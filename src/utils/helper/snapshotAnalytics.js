function normalizeProvince(value) {
  return String(value || '').trim().toUpperCase();
}

export function flattenSnapshotRows(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const provinces = snapshot.provinces || {};

  return Object.values(provinces).flatMap((provinceDoc) => {
    const rows = Array.isArray(provinceDoc?.rows) ? provinceDoc.rows : [];
    return rows;
  });
}

export function filterRowsByHorizon(rows, horizon = 4) {
  const allowed = new Set(Array.from({ length: horizon }, (_, idx) => `Q+${idx + 1}`));
  return (rows || []).filter((row) => allowed.has(row?.forecast_horizon));
}

export function filterRowsByFarmScope(rows, farms = [], scope = 'ALL_MY_FARMS', selectedFarmId = null, selectedProvince = null) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (!Array.isArray(farms) || farms.length === 0) return [];

  if (scope === 'THIS_FARM') {
    const selected = farms.find((farm) => String(farm.id) === String(selectedFarmId)) || farms[0];
    if (!selected) return [];
    const province = normalizeProvince(selected.province);
    return rows.filter((row) => normalizeProvince(row.province) === province);
  }

  if (scope === 'THIS_PROVINCE') {
    const target = normalizeProvince(selectedProvince);
    if (!target) return [];
    return rows.filter((row) => normalizeProvince(row.province) === target);
  }

  const ownedProvinces = new Set(farms.map((farm) => normalizeProvince(farm.province)).filter(Boolean));
  return rows.filter((row) => ownedProvinces.has(normalizeProvince(row.province)));
}

export function aggregateSummary(rows, horizon = 4) {
  const data = filterRowsByHorizon(rows, horizon);
  const grouped = {
    PALAY: 0,
    CORN: 0,
    OTHER: 0
  };

  data.forEach((row) => {
    const key = String(row.crop_group || '').toUpperCase();
    if (!grouped[key]) grouped[key] = 0;
    grouped[key] += Number(row.predicted_production || 0);
  });

  return [
    { label: 'Total Palay', metric: 'palay_predicted_yield', unit: 'metric tons', value: Number(grouped.PALAY || 0).toFixed(2) },
    { label: 'Total Corn', metric: 'corn_predicted_yield', unit: 'metric tons', value: Number(grouped.CORN || 0).toFixed(2) },
    { label: 'Other Crops', metric: 'other_predicted_yield', unit: 'metric tons', value: Number(grouped.OTHER || 0).toFixed(2) }
  ].map((item) => ({ ...item, value: Number(item.value) }));
}

export function aggregateTrend(rows, basePeriod = null, horizon = 4) {
  const data = filterRowsByHorizon(rows, horizon);
  if (data.length === 0) return { base_period: basePeriod, labels: [], series: [] };

  const keys = Array.from({ length: horizon }, (_, idx) => `Q+${idx + 1}`);
  const byCrop = new Map();

  data.forEach((row) => {
    const crop = row.crop;
    const key = row.forecast_horizon;
    if (!crop || !keys.includes(key)) return;
    if (!byCrop.has(crop)) byCrop.set(crop, new Map());
    const stepMap = byCrop.get(crop);
    stepMap.set(key, (stepMap.get(key) || 0) + Number(row.predicted_production || 0));
  });

  const series = Array.from(byCrop.entries()).map(([crop, stepMap]) => ({
    id: String(crop).toLowerCase().replace(/\s+/g, '_'),
    label: crop,
    data: keys.map((key) => Number((stepMap.get(key) || 0).toFixed(2)))
  }));

  let labels = keys;
  if (basePeriod && String(basePeriod).includes('Q')) {
    const [yearPart, quarterPart] = String(basePeriod).split('Q');
    const baseYear = Number(yearPart);
    const baseQuarter = Number(quarterPart);

    if (!Number.isNaN(baseYear) && !Number.isNaN(baseQuarter)) {
      labels = Array.from({ length: horizon }, (_, index) => {
        const n = index + 1;
        const q = baseQuarter + n;
        const year = baseYear + Math.floor((q - 1) / 4);
        const quarter = ((q - 1) % 4) + 1;
        return `${year}Q${quarter}`;
      });
    }
  }

  return { base_period: basePeriod, labels, series };
}

export function aggregateRisk(rows, horizon = 4) {
  const data = filterRowsByHorizon(rows, horizon);
  const models = ['PALAY', 'CORN', 'OTHER'];
  const risks = ['High', 'Risk-prone', 'Declining'];
  const riskCounts = {
    PALAY: { High: 0, 'Risk-prone': 0, Declining: 0 },
    CORN: { High: 0, 'Risk-prone': 0, Declining: 0 },
    OTHER: { High: 0, 'Risk-prone': 0, Declining: 0 }
  };

  data.forEach((row) => {
    const model = String(row.crop_group || '').toUpperCase();
    const risk = row.future_risk_label;
    if (models.includes(model) && risks.includes(risk)) {
      riskCounts[model][risk] += 1;
    }
  });

  const riskPercentages = {};
  models.forEach((model) => {
    const total = risks.reduce((sum, risk) => sum + riskCounts[model][risk], 0);
    riskPercentages[model] = {};
    risks.forEach((risk) => {
      riskPercentages[model][risk] = total > 0 ? Number(((riskCounts[model][risk] / total) * 100).toFixed(2)) : 0;
    });
  });

  return { risk_counts: riskCounts, risk_percentages: riskPercentages };
}

export function getAvailableCrops(rows, horizon = 4) {
  const data = filterRowsByHorizon(rows, horizon);
  return Array.from(new Set(data.map((row) => row.crop).filter(Boolean))).sort();
}

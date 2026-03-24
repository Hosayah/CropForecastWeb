import { jsPDF } from 'jspdf';

function safeText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function sanitizeFilePart(value, fallback = 'recommendation') {
  const normalized = safeText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
}

function formatTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function buildRankingLines(items, formatter) {
  return (Array.isArray(items) ? items : []).map((item, index) => `${index + 1}. ${formatter(item)}`);
}

export function downloadRecommendationPdf({
  farmName,
  province,
  season,
  recommendation,
  climateSummary,
  updatedAtLabel
}) {
  if (!recommendation || !season) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const maxWidth = 178;
  let cursorY = 18;

  const ensureSpace = (neededHeight = 10) => {
    if (cursorY + neededHeight <= pageHeight - 16) return;
    doc.addPage();
    cursorY = 18;
  };

  const addTextBlock = (text, { fontSize = 11, style = 'normal', color = [30, 41, 59], spacing = 1.8 } = {}) => {
    const value = safeText(text);
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(value, maxWidth);
    const lineHeight = (fontSize * 0.45) + spacing;
    ensureSpace(Math.max(8, lines.length * lineHeight + 2));
    doc.text(lines, marginX, cursorY);
    cursorY += lines.length * lineHeight;
  };

  const addSectionTitle = (title) => {
    cursorY += 2;
    addTextBlock(title, { fontSize: 13, style: 'bold', color: [22, 101, 52], spacing: 2.2 });
    cursorY += 1;
  };

  const addKeyValue = (label, value) => {
    addTextBlock(`${label}: ${safeText(value)}`, { fontSize: 10.5, style: 'normal', color: [71, 85, 105], spacing: 1.6 });
  };

  const topOptimal = recommendation?.optimal_crops?.[0];
  const dominant = recommendation?.commonly_planted?.[0];
  const generatedLabel = formatTimestamp(recommendation?.createdAt);
  const optimalLines = buildRankingLines(recommendation?.optimal_crops, (item) => {
    const crop = safeText(item?.crop);
    const score = Number(item?.score);
    const risk = safeText(item?.risk);
    return `${crop} | Score: ${Number.isFinite(score) ? score.toFixed(2) : '-'} | Risk: ${risk}`;
  });
  const commonLines = buildRankingLines(recommendation?.commonly_planted, (item) => {
    const crop = safeText(item?.crop);
    const share = Number(item?.historical_share);
    const note = safeText(item?.note, '');
    const detail = Number.isFinite(share) ? `${Math.round(share * 100)}% historical share` : 'Historical share unavailable';
    return note ? `${crop} | ${detail} | ${note}` : `${crop} | ${detail}`;
  });

  addTextBlock('AgriSense Crop Recommendation', { fontSize: 18, style: 'bold', color: [15, 23, 42], spacing: 2.8 });
  addTextBlock('Farmer recommendation summary', { fontSize: 10.5, color: [100, 116, 139], spacing: 1.8 });

  cursorY += 2;
  addKeyValue('Farm', farmName);
  addKeyValue('Province', province || recommendation?.province);
  addKeyValue('Season', season);
  if (generatedLabel) addKeyValue('Generated', generatedLabel);
  if (updatedAtLabel) addKeyValue('Updated', updatedAtLabel);

  addSectionTitle('Recommendation Summary');
  addKeyValue('Top Crop', topOptimal?.crop);
  addKeyValue('Risk Outlook', topOptimal?.risk);
  addKeyValue('Dominant Crop', dominant?.crop);
  addKeyValue(climateSummary?.title || 'Climate Snapshot', climateSummary?.value || '-');
  if (climateSummary?.extra) {
    addTextBlock(climateSummary.extra, { fontSize: 10, color: [100, 116, 139], spacing: 1.6 });
  }

  if (optimalLines.length > 0) {
    addSectionTitle('Optimal Crop Rankings');
    optimalLines.forEach((line) => addTextBlock(line, { fontSize: 10.5, color: [30, 41, 59], spacing: 1.6 }));
  }

  if (commonLines.length > 0) {
    addSectionTitle('Commonly Planted Crops');
    commonLines.forEach((line) => addTextBlock(line, { fontSize: 10.5, color: [30, 41, 59], spacing: 1.6 }));
  }

  addSectionTitle('Recommendation Insight');
  addTextBlock(
    recommendation?.overview ||
      `Based on farm conditions in ${safeText(recommendation?.province, 'this province')} for ${safeText(recommendation?.season, season)}, several crops show strong suitability.`,
    { fontSize: 10.5, color: [51, 65, 85], spacing: 1.8 }
  );

  const fileName = `crop_recommendation_${sanitizeFilePart(farmName)}_${sanitizeFilePart(season, 'season')}.pdf`;
  doc.save(fileName);
}

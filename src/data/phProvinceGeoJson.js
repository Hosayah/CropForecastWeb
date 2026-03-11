import { PH_REGIONS } from './phLocations';

const REGION_ANCHORS = {
  CAR: [88, 20],
  'REGION I': [36, 66],
  'REGION II': [148, 66],
  'REGION III': [70, 112],
  'REGION IV-A': [106, 156],
  MIMAROPA: [18, 182],
  'REGION V': [200, 156],
  'REGION VI': [126, 230],
  'REGION VII': [174, 250],
  'REGION VIII': [232, 228],
  'REGION IX': [120, 308],
  'REGION X': [174, 314],
  'REGION XI': [228, 326],
  'REGION XII': [190, 370],
  'REGION XIII': [264, 300],
  BARMM: [148, 378]
};

const TILE_WIDTH = 34;
const TILE_HEIGHT = 20;
const TILE_GAP_X = 6;
const TILE_GAP_Y = 6;

function rectPolygon(x, y, width, height) {
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
    [x, y]
  ];
}

function createFeature(province, region, x, y) {
  return {
    type: 'Feature',
    properties: { province, region },
    geometry: {
      type: 'Polygon',
      coordinates: [rectPolygon(x, y, TILE_WIDTH, TILE_HEIGHT)]
    }
  };
}

const features = Object.entries(PH_REGIONS).flatMap(([regionKey, region]) => {
  const [baseX, baseY] = REGION_ANCHORS[regionKey] || [0, 0];
  return (region.provinces || []).map((province, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = baseX + col * (TILE_WIDTH + TILE_GAP_X);
    const y = baseY + row * (TILE_HEIGHT + TILE_GAP_Y);
    return createFeature(province, regionKey, x, y);
  });
});

export const PH_PROVINCE_GEOJSON = {
  type: 'FeatureCollection',
  name: 'ph_provinces_cartogram',
  features
};


const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const SHOP_AMENITIES = ['cafe', 'restaurant', 'fast_food', 'convenience', 'supermarket', 'pharmacy', 'bar', 'pub', 'bakery'];

function buildQuery(lat, lng, radius) {
  const shopFilters = [
    `node["shop"](around:${radius},${lat},${lng});`,
    ...SHOP_AMENITIES.map(a => `node["amenity"="${a}"](around:${radius},${lat},${lng});`)
  ].join('\n  ');

  return `
[out:json][timeout:15];
(
  ${shopFilters}
  node["highway"="bus_stop"](around:${radius},${lat},${lng});
);
out body;
>;
out skel qt;
  `.trim();
}

function parsePOIs(elements) {
  const shops = [];
  const busStops = [];

  elements.forEach(el => {
    if (el.type !== 'node' || !el.lat || !el.lon) return;

    const tags = el.tags || {};
    const name = tags.name || tags.brand || '未命名';

    if (el.tags && el.tags.highway === 'bus_stop') {
      busStops.push({
        id: `bus_${el.id}`,
        lat: el.lat,
        lng: el.lon,
        name: name,
        type: 'bus_stop',
        category: '公交站牌',
        tags
      });
      return;
    }

    const category = tags.shop
      ? shopTypeLabel(tags.shop)
      : amenityLabel(tags.amenity);

    shops.push({
      id: `shop_${el.id}`,
      lat: el.lat,
      lng: el.lon,
      name,
      type: tags.shop || tags.amenity || 'shop',
      category,
      tags
    });
  });

  return { shops, busStops };
}

function shopTypeLabel(type) {
  const map = {
    convenience: '便利店',
    supermarket: '超市',
    cafe: '咖啡馆',
    restaurant: '餐厅',
    fast_food: '快餐',
    bakery: '面包店',
    pharmacy: '药店',
    bar: '酒吧',
    pub: '酒馆'
  };
  return map[type] || '门店';
}

function amenityLabel(amenity) {
  const map = {
    cafe: '咖啡馆',
    restaurant: '餐厅',
    fast_food: '快餐',
    convenience: '便利店',
    supermarket: '超市',
    pharmacy: '药店',
    bar: '酒吧',
    pub: '酒馆',
    bakery: '面包店'
  };
  return map[amenity] || '门店';
}

async function fetchFromOverpass(url, query) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return parsePOIs(data.elements || []);
}

export async function fetchNearbyPOIs(lat, lng, radius = 600) {
  const query = buildQuery(lat, lng, radius);

  for (const url of OVERPASS_URLS) {
    try {
      return await fetchFromOverpass(url, query);
    } catch (e) {
      console.warn(`Overpass 实例失败: ${url}`, e.message);
    }
  }

  console.warn('所有 Overpass 实例均不可用');
  return { shops: [], busStops: [] };
}

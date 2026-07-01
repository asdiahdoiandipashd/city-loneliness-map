import { getCheckins, addCheckin, getCityByCoords, getDistance, seedCheckinsIfEmpty } from './data.js';
import { fetchNearbyPOIs } from './overpass.js';

let map = null;
let markersLayer = null;
let currentPositionLayer = null;
let shopsLayer = null;
let busStopsLayer = null;
let currentPosition = { lat: 31.2304, lng: 121.4737, city: '上海市' };
let onSelectCheckinCallback = null;
let onAddCheckinRequestCallback = null;
let onSelectPOICallback = null;
let showShops = false;
let showBusStops = false;
let lastPOIs = { shops: [], busStops: [] };

const DEFAULT_CENTER = { lat: 31.2304, lng: 121.4737 };

export function initMap() {
  seedCheckinsIfEmpty();

  const mapEl = document.getElementById('leaflet-map');
  if (!mapEl) return;

  map = L.map('leaflet-map', {
    center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
    zoom: 13,
    zoomControl: false,
    attributionControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  currentPositionLayer = L.layerGroup().addTo(map);
  shopsLayer = L.layerGroup().addTo(map);
  busStopsLayer = L.layerGroup().addTo(map);

  renderMarkers();
  renderCurrentPositionMarker();

  // 地图点击：用于标记此刻（长按或点击空白处）
  map.on('click', (e) => {
    if (onAddCheckinRequestCallback) {
      onAddCheckinRequestCallback(e.latlng.lat, e.latlng.lng);
    }
  });

  // 绑定工具栏按钮
  const locateBtn = document.getElementById('locate-me-btn');
  if (locateBtn) {
    locateBtn.addEventListener('click', locateUser);
  }

  // 绑定导航栏定位按钮
  const navLocateBtn = document.getElementById('location-btn');
  if (navLocateBtn) {
    navLocateBtn.addEventListener('click', locateUser);
  }

  const addBtn = document.getElementById('add-checkin-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (onAddCheckinRequestCallback) {
        onAddCheckinRequestCallback(currentPosition.lat, currentPosition.lng);
      }
    });
  }

  const toggleShopsBtn = document.getElementById('toggle-shops-btn');
  if (toggleShopsBtn) {
    toggleShopsBtn.addEventListener('click', () => {
      showShops = !showShops;
      toggleShopsBtn.classList.toggle('active', showShops);
      if (showShops) {
        loadAndRenderPOIs();
      } else {
        shopsLayer.clearLayers();
      }
    });
  }

  const toggleBusBtn = document.getElementById('toggle-bus-btn');
  if (toggleBusBtn) {
    toggleBusBtn.addEventListener('click', () => {
      showBusStops = !showBusStops;
      toggleBusBtn.classList.toggle('active', showBusStops);
      if (showBusStops) {
        loadAndRenderPOIs();
      } else {
        busStopsLayer.clearLayers();
      }
    });
  }

  // 优先定位用户
  locateUser();
}

export function locateUser() {
  const locateBtn = document.getElementById('locate-me-btn');
  if (locateBtn) {
    locateBtn.textContent = '定位中...';
    locateBtn.disabled = true;
  }

  if (!navigator.geolocation) {
    fallbackToDefault('浏览器不支持定位');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        city: getCityByCoords(position.coords.latitude, position.coords.longitude)
      };
      updateMapCenter(currentPosition.lat, currentPosition.lng, currentPosition.city);
      if (locateBtn) {
        locateBtn.textContent = '定位到我';
        locateBtn.disabled = false;
      }
      updateLocationButtonUI(currentPosition.city);
      renderCurrentPositionMarker();
      if (showShops || showBusStops) {
        loadAndRenderPOIs();
      }
    },
    (error) => {
      console.warn('定位失败', error);
      fallbackToDefault('定位失败，使用默认城市');
    },
    { timeout: 8000, enableHighAccuracy: false }
  );
}

function fallbackToDefault(message) {
  currentPosition = { ...DEFAULT_CENTER, city: '上海市' };
  updateMapCenter(currentPosition.lat, currentPosition.lng, currentPosition.city);
  const locateBtn = document.getElementById('locate-me-btn');
  if (locateBtn) {
    locateBtn.textContent = '定位到我';
    locateBtn.disabled = false;
  }
  updateLocationButtonUI('上海市', message || '定位失败，已切换默认城市');
  renderCurrentPositionMarker();
}

function showLocationToast(message) {
  const locationText = document.getElementById('location-text');
  if (!locationText) return;
  const original = locationText.textContent;
  locationText.textContent = message;
  setTimeout(() => {
    if (locationText.textContent === message) {
      locationText.textContent = original;
    }
  }, 2500);
}

function updateMapCenter(lat, lng, city) {
  if (!map) return;
  map.setView([lat, lng], 14);
  renderMarkers();
}

function updateLocationButtonUI(city, toastMessage) {
  const locationText = document.getElementById('location-text');
  const locationBtn = document.getElementById('location-btn');
  if (locationText) locationText.textContent = city;
  if (locationBtn) locationBtn.classList.add('active');
  if (toastMessage) showLocationToast(toastMessage);
}

function createCurrentLocationIcon() {
  return L.divIcon({
    className: 'current-location-marker',
    html: `
      <div class="current-location-dot"></div>
      <div class="current-location-pulse"></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function renderCurrentPositionMarker() {
  if (!map || !currentPositionLayer) return;
  currentPositionLayer.clearLayers();

  const marker = L.marker([currentPosition.lat, currentPosition.lng], {
    icon: createCurrentLocationIcon(),
    zIndexOffset: 1000
  });
  marker.bindPopup('<div style="font-family:\'Outfit\',sans-serif;font-size:0.75rem;">你在这里</div>', { closeButton: false, className: 'poi-popup' });
  currentPositionLayer.addLayer(marker);
}

function createMarkerIcon(score) {
  const size = Math.max(18, Math.min(36, 14 + score / 5));
  const opacity = 0.7 + score / 330;
  return L.divIcon({
    className: 'emotion-marker',
    html: `<div class="emotion-marker-inner" style="width:${size}px;height:${size}px;opacity:${opacity};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

function createShopIcon() {
  return L.divIcon({
    className: 'poi-marker shop-marker',
    html: `<div class="poi-marker-inner" style="background:#c4a77d;box-shadow:0 0 8px rgba(196,167,125,0.5);">&#8962;</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

function createBusStopIcon() {
  return L.divIcon({
    className: 'poi-marker bus-marker',
    html: `<div class="poi-marker-inner" style="background:#7fb89f;box-shadow:0 0 8px rgba(127,184,159,0.5);">&#9733;</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

export function renderMarkers() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  const checkins = getCheckins();
  checkins.forEach(checkin => {
    const marker = L.marker([checkin.lat, checkin.lng], { icon: createMarkerIcon(checkin.score) });
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      selectCheckin(checkin);
    });

    const popupContent = `
      <div style="font-family: 'Outfit', sans-serif; min-width: 140px;">
        <div style="font-size: 0.85rem; font-weight: 500; color: var(--ink); margin-bottom: 0.25rem;">${checkin.name}</div>
        <div style="font-size: 0.7rem; color: var(--muted); margin-bottom: 0.5rem;">${checkin.city} · 孤独指数 ${checkin.score}</div>
        <div style="font-size: 0.75rem; color: var(--ink); line-height: 1.5;">${checkin.text || checkin.tags.slice(0, 2).join(' · ')}</div>
      </div>
    `;
    marker.bindPopup(popupContent, { closeButton: false, className: 'emotion-popup' });
    markersLayer.addLayer(marker);
  });
}

async function loadAndRenderPOIs() {
  if (!map) return;
  const pois = await fetchNearbyPOIs(currentPosition.lat, currentPosition.lng, 600);
  lastPOIs = pois;
  renderPOIs();
}

function renderPOIs() {
  if (!map) return;

  shopsLayer.clearLayers();
  busStopsLayer.clearLayers();

  if (showShops) {
    lastPOIs.shops.forEach(poi => {
      const marker = L.marker([poi.lat, poi.lng], { icon: createShopIcon() });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectPOICallback) {
          onSelectPOICallback(poi);
        }
      });
      marker.bindPopup(`<div style="font-family:'Outfit',sans-serif;font-size:0.8rem;"><strong>${poi.name}</strong><br><span style="color:var(--muted);font-size:0.7rem;">${poi.category}</span></div>`, { closeButton: false, className: 'poi-popup' });
      shopsLayer.addLayer(marker);
    });
  }

  if (showBusStops) {
    lastPOIs.busStops.forEach(poi => {
      const marker = L.marker([poi.lat, poi.lng], { icon: createBusStopIcon() });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectPOICallback) {
          onSelectPOICallback(poi);
        }
      });
      marker.bindPopup(`<div style="font-family:'Outfit',sans-serif;font-size:0.8rem;"><strong>${poi.name}</strong><br><span style="color:var(--muted);font-size:0.7rem;">公交站牌</span></div>`, { closeButton: false, className: 'poi-popup' });
      busStopsLayer.addLayer(marker);
    });
  }
}

export function selectCheckin(checkin) {
  if (onSelectCheckinCallback) {
    onSelectCheckinCallback(checkin);
  }
  if (map) {
    map.setView([checkin.lat, checkin.lng], 15);
  }
}

export function onSelectCheckin(callback) {
  onSelectCheckinCallback = callback;
}

export function onAddCheckinRequest(callback) {
  onAddCheckinRequestCallback = callback;
}

export function onSelectPOI(callback) {
  onSelectPOICallback = callback;
}

export function getCurrentPosition() {
  return { ...currentPosition };
}

export function getNearbyCheckins(radiusKm = 5, limit = 10) {
  const checkins = getCheckins();
  return checkins
    .map(c => ({
      ...c,
      distance: getDistance(currentPosition.lat, currentPosition.lng, c.lat, c.lng)
    }))
    .filter(c => c.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export function refreshMarkers() {
  renderMarkers();
}

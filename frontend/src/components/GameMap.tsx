import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getNationColorForFeature, getRegionByFeatureId } from '../utils/mapUtils';
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, Layer, PathOptions } from 'leaflet';
import L from 'leaflet';

// Cache GeoJSON data globally to avoid re-fetching
let cachedGeoJSON: any = null;

export default function GameMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<LeafletMap | null>(null);
  const geoJsonLayer = useRef<LeafletGeoJSON | null>(null);
  const battalionMarkers = useRef<L.LayerGroup | null>(null);

  const gameState = useGameStore((s) => s.gameState);
  const setSelectedNationId = useGameStore((s) => s.setSelectedNationId);
  const setSidePanel = useGameStore((s) => s.setSidePanel);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [30, 10],
      zoom: 3,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark tile layer
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);

    leafletMap.current = map;
    battalionMarkers.current = L.layerGroup().addTo(map);

    // Load GeoJSON
    loadGeoJSON(map);

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update map colors when game state changes
  useEffect(() => {
    if (!geoJsonLayer.current || !gameState) return;
    updateMapColors();
    updateBattalions();
  }, [gameState]);

  async function loadGeoJSON(map: LeafletMap) {
    if (cachedGeoJSON) {
      addGeoJSONToMap(cachedGeoJSON, map);
      return;
    }

    try {
      // Try loading from local data first, then from CDN
      let data: any;
      try {
        const resp = await fetch('/geojson/world_countries.geojson');
        if (resp.ok) {
          data = await resp.json();
        }
      } catch {}

      if (!data) {
        // Fallback to Natural Earth data from CDN
        const resp = await fetch(
          'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
        );
        data = await resp.json();
      }

      cachedGeoJSON = data;
      addGeoJSONToMap(data, map);
    } catch (e) {
      console.error('Failed to load GeoJSON:', e);
    }
  }

  function addGeoJSONToMap(data: any, map: LeafletMap) {
    const layer = L.geoJSON(data, {
      style: (feature) => getFeatureStyle(feature),
      onEachFeature: (feature, layer) => {
        layer.on({
          click: () => handleFeatureClick(feature),
          mouseover: (e: any) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.6 });
          },
          mouseout: (e: any) => {
            geoJsonLayer.current?.resetStyle(e.target);
          },
        });
      },
    }).addTo(map);

    geoJsonLayer.current = layer;
  }

  function getFeatureStyle(feature: any): PathOptions {
    if (!gameState) {
      return {
        fillColor: '#333333',
        weight: 1,
        opacity: 0.5,
        color: '#555555',
        fillOpacity: 0.3,
      };
    }

    const featureId = feature?.properties?.ISO_A3 || feature?.properties?.ISO_A3_EH || '';
    const color = getNationColorForFeature(featureId, gameState.regions, gameState.nations);

    return {
      fillColor: color,
      weight: 1,
      opacity: 0.6,
      color: '#444444',
      fillOpacity: 0.4,
    };
  }

  function updateMapColors() {
    if (!geoJsonLayer.current || !gameState) return;
    geoJsonLayer.current.setStyle((feature: any) => getFeatureStyle(feature));
  }

  function updateBattalions() {
    if (!battalionMarkers.current || !gameState) return;
    battalionMarkers.current.clearLayers();

    for (const nation of Object.values(gameState.nations)) {
      for (const btn of nation.battalions) {
        if (btn.lat === 0 && btn.lng === 0) continue;

        const iconChar = btn.type === 'infantry' ? '\u{1F6E1}' :
                         btn.type === 'armor' ? '\u{2694}' :
                         btn.type === 'naval' ? '\u{2693}' :
                         btn.type === 'air' ? '\u{2708}' : '\u{2B50}';

        const icon = L.divIcon({
          className: 'battalion-marker',
          html: `<div style="
            background: ${nation.color};
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            border: 2px solid rgba(255,255,255,0.5);
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
          ">${iconChar}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([btn.lat, btn.lng], { icon });
        marker.bindTooltip(
          `<b>${btn.name}</b><br/>${nation.name}<br/>${btn.type} - ${btn.strength.toLocaleString()} effectifs`,
          { direction: 'top', offset: [0, -12] }
        );
        battalionMarkers.current!.addLayer(marker);
      }
    }
  }

  function handleFeatureClick(feature: any) {
    if (!gameState) return;
    const featureId = feature?.properties?.ISO_A3 || feature?.properties?.ISO_A3_EH || '';
    const region = getRegionByFeatureId(featureId, gameState.regions);
    if (region) {
      setSelectedNationId(region.controlled_by);
      setSidePanel('info');
    }
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

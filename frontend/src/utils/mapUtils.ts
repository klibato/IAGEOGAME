import type { Nation, Region, Battalion } from '../types/game';

/**
 * Get the nation color for a GeoJSON feature based on region ownership.
 */
export function getNationColorForFeature(
  featureId: string,
  regions: Record<string, Region>,
  nations: Record<string, Nation>
): string {
  // Find the region that maps to this GeoJSON feature
  for (const region of Object.values(regions)) {
    if (region.geojson_feature_id === featureId) {
      const nation = nations[region.controlled_by];
      return nation?.color || '#444444';
    }
  }
  return '#333333'; // Not controlled by any nation
}

/**
 * Get a region by its GeoJSON feature ID.
 */
export function getRegionByFeatureId(
  featureId: string,
  regions: Record<string, Region>
): Region | null {
  for (const region of Object.values(regions)) {
    if (region.geojson_feature_id === featureId) {
      return region;
    }
  }
  return null;
}

/**
 * Battalion icon based on type.
 */
export function getBattalionIcon(type: string): string {
  switch (type) {
    case 'infantry': return '\u{1F6E1}';
    case 'armor': return '\u{1F3DA}';
    case 'naval': return '\u{2693}';
    case 'air': return '\u{2708}';
    default: return '\u{2B50}';
  }
}

/**
 * Format population number.
 */
export function formatPopulation(pop: number): string {
  if (pop >= 1_000_000_000) return `${(pop / 1_000_000_000).toFixed(1)}B`;
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(0)}K`;
  return pop.toString();
}

/**
 * Category icon mapping.
 */
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'military': return '\u{2694}';
    case 'diplomatic': return '\u{1F91D}';
    case 'economic': return '\u{1F4B0}';
    case 'internal': return '\u{1F3DB}';
    case 'global': return '\u{1F30D}';
    default: return '\u{1F4CB}';
  }
}

/**
 * Relation type display color.
 */
export function getRelationColor(relation: string): string {
  switch (relation) {
    case 'allied': return '#4CAF50';
    case 'friendly': return '#8BC34A';
    case 'neutral': return '#9E9E9E';
    case 'tense': return '#FF9800';
    case 'hostile': return '#f44336';
    case 'at_war': return '#b71c1c';
    default: return '#9E9E9E';
  }
}

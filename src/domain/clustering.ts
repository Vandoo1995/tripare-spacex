import { haversineKm } from './geo';

export type GeoPoint = {
  id: string;
  latitude: number;
  longitude: number;
  weight: number;
};

export type Cluster =
  | {
      type: 'point';
      id: string;
      latitude: number;
      longitude: number;
      weight: number;
    }
  | {
      type: 'cluster';
      id: string;
      latitude: number;
      longitude: number;
      weight: number;
      memberIds: string[];
    };

export function radiusKmForDelta(latitudeDelta: number): number {
  if (!Number.isFinite(latitudeDelta) || latitudeDelta <= 0) return 25;
  return Math.max(2, Math.min(400, latitudeDelta * 55));
}

export function clusterPoints(points: GeoPoint[], radiusKm: number): Cluster[] {
  const remaining = points.slice();
  const clusters: Cluster[] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift();
    if (!seed) break;

    const members: GeoPoint[] = [seed];
    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      const candidate = remaining[i];
      if (!candidate) continue;
      if (haversineKm(seed.latitude, seed.longitude, candidate.latitude, candidate.longitude) <= radiusKm) {
        members.push(candidate);
        remaining.splice(i, 1);
      }
    }

    if (members.length === 1) {
      clusters.push({
        type: 'point',
        id: seed.id,
        latitude: seed.latitude,
        longitude: seed.longitude,
        weight: seed.weight,
      });
      continue;
    }

    let lat = 0;
    let lon = 0;
    let weight = 0;
    const memberIds: string[] = [];
    for (const member of members) {
      lat += member.latitude;
      lon += member.longitude;
      weight += member.weight;
      memberIds.push(member.id);
    }
    clusters.push({
      type: 'cluster',
      id: `c-${memberIds.slice().sort().join('-')}`,
      latitude: lat / members.length,
      longitude: lon / members.length,
      weight,
      memberIds,
    });
  }

  return clusters;
}

export function densityColor(count: number, max: number): string {
  if (max <= 0 || count <= 0) return '#64748B';
  const t = Math.min(1, count / max);
  if (t < 0.33) return '#22C55E';
  if (t < 0.66) return '#EAB308';
  return '#E11D48';
}

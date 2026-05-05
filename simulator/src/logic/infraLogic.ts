export interface NTTBuilding {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface RouteSegment {
  type: 'conduit' | 'aerial';
  path: [number, number][]; // [lat, lng]
}

export interface PoleLocation {
  lat: number;
  lng: number;
  distance: number;
}

export interface SimulationResult {
  building: NTTBuilding;
  totalDistance: number;
  conduitLength: number;
  aerialLength: number;
  poleCount: number;
  segments: RouteSegment[];
  poles: PoleLocation[];
  cost: number;
}

/**
 * 2地点間の直線距離（メートル）を計算
 */
export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Overpass API を使用して 7km 以内の NTT 収容局を検索
 */
export const searchNTTBuildings = async (lat: number, lng: number): Promise<NTTBuilding[]> => {
  const query = `
    [out:json][timeout:25];
    (
      node["telecom"="exchange"]["operator"~"NTT"](around:7000,${lat},${lng});
      way["telecom"="exchange"]["operator"~"NTT"](around:7000,${lat},${lng});
      node["telecom"="exchange"]["name"~"NTT"](around:7000,${lat},${lng});
      way["telecom"="exchange"]["name"~"NTT"](around:7000,${lat},${lng});
      node["name"~"NTT"]["building"="service"](around:7000,${lat},${lng});
      way["name"~"NTT"]["building"="service"](around:7000,${lat},${lng});
    );
    out center;
  `;
  
  const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  const data = await response.json();

  if (!data.elements || data.elements.length === 0) {
    return [];
  }

  return data.elements.map((el: any) => ({
    id: el.id.toString(),
    name: el.tags?.name || 'NTT収容局',
    lat: el.lat || el.center?.lat,
    lng: el.lon || el.center?.lon,
  }));
};

/**
 * OSRM APIを使用して経路を取得
 */
export const fetchRoute = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
  const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.routes || data.routes.length === 0) {
    throw new Error('経路が見つかりませんでした。');
  }

  return data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
};

/**
 * 経路データから設備を生成
 */
export const generateInfrastructure = (route: [number, number][]): Omit<SimulationResult, 'building' | 'cost'> => {
  let totalDistance = 0;
  const segments: RouteSegment[] = [];
  const poles: PoleLocation[] = [];
  
  let conduitPath: [number, number][] = [route[0]];
  let aerialPath: [number, number][] = [];
  let conduitLength = 0;
  let lastPoleDistance = 30;

  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i];
    const p2 = route[i+1];
    const dist = getDistance(p1[0], p1[1], p2[0], p2[1]);
    
    const segmentStartDist = totalDistance;
    totalDistance += dist;

    if (totalDistance <= 30) {
      conduitPath.push(p2);
      conduitLength = totalDistance;
    } else {
      if (segmentStartDist < 30) {
        conduitPath.push(p2);
        conduitLength = 30;
        aerialPath.push(p2);
      } else {
        if (aerialPath.length === 0) aerialPath.push(p1);
        aerialPath.push(p2);
      }

      while (lastPoleDistance + 30 <= totalDistance) {
        lastPoleDistance += 30;
        const ratio = (lastPoleDistance - segmentStartDist) / dist;
        const poleLat = p1[0] + (p2[0] - p1[0]) * ratio;
        const poleLng = p1[1] + (p2[1] - p1[1]) * ratio;
        poles.push({ lat: poleLat, lng: poleLng, distance: lastPoleDistance });
      }
    }
  }

  if (conduitPath.length > 0) {
    segments.push({ type: 'conduit', path: conduitPath });
  }
  if (aerialPath.length > 0) {
    segments.push({ type: 'aerial', path: aerialPath });
  }

  return {
    totalDistance,
    conduitLength,
    aerialLength: Math.max(0, totalDistance - 30),
    poleCount: poles.length,
    segments,
    poles
  };
};

/**
 * 費用の算出
 */
export const calculateCost = (data: Omit<SimulationResult, 'building' | 'cost'>): number => {
  const cableCost = data.totalDistance * 1000;
  const conduitCost = data.conduitLength * 400000;
  const poleCost = data.poleCount * 100000;
  
  return cableCost + conduitCost + poleCost;
};

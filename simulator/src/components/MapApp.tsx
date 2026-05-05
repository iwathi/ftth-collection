import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Building2, TowerControl as Pole, Calculator, Navigation, Crosshair, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { fetchRoute, generateInfrastructure, calculateCost, getDistance, searchNTTBuildings } from '../logic/infraLogic';
import type { SimulationResult, NTTBuilding } from '../logic/infraLogic';

// Leaflet markers
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const homeIcon = L.divIcon({
  html: `<div class="bg-amber-500 p-1.5 rounded-full border-2 border-white shadow-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const buildingIcon = L.divIcon({
  html: `<div class="bg-sky-600 p-1.5 rounded-full border-2 border-white shadow-lg"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M15 2h.01"/><path d="M9 2h.01"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const poleIcon = L.divIcon({
  html: `<div class="bg-slate-600 p-1 rounded-full border border-white shadow-sm"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M8 6h8"/><path d="M9 10h6"/></svg></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const RecenterMap = ({ coords }: { coords: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 14, { duration: 1.5 });
  }, [coords, map]);
  return null;
};

const CenterTracker = ({ onCenterChange }: { onCenterChange: (center: [number, number]) => void }) => {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onCenterChange([center.lat, center.lng]);
    },
    zoomend: (e) => {
      const center = e.target.getCenter();
      onCenterChange([center.lat, center.lng]);
    }
  });
  return null;
};

const formatJPY = (val: number) => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val);
};

type AppPhase = 'SET_HOME' | 'SEARCHING' | 'SET_NTT_MANUAL' | 'RESULT';

export const MapApp: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('SET_HOME');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6895, 139.6917]);
  const [jumpCoords, setJumpCoords] = useState<[number, number] | null>(null);
  
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const handleSearchJump = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setError('');
    setLoadingStep('検索中...');
    
    try {
      let geoData: any[] = [];
      let currentQuery = searchQuery;
      let attempt = 0;

      while (attempt < 3) {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentQuery)}&accept-language=ja`;
        const geoRes = await fetch(geoUrl);
        geoData = await geoRes.json();
        if (geoData.length > 0) break;
        const nextQuery = currentQuery.replace(/[\s\d-−ー]+$/, '').replace(/[0-9]+丁目?.*$/, '');
        if (nextQuery === currentQuery || nextQuery.length < 2) break;
        currentQuery = nextQuery;
        attempt++;
      }

      if (geoData.length === 0) throw new Error('住所が見つかりません。');
      
      const lat = parseFloat(geoData[0].lat);
      const lng = parseFloat(geoData[0].lon);
      setJumpCoords([lat, lng]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingStep('');
    }
  };

  const handleConfirmHome = async () => {
    setError('');
    setHomeCoords(mapCenter);
    setPhase('SEARCHING');
    setLoadingStep('局舎を検索中...');

    try {
      const buildings = await searchNTTBuildings(mapCenter[0], mapCenter[1]);

      if (buildings.length === 0) {
        setPhase('SET_NTT_MANUAL');
        return;
      }

      let closest = buildings[0];
      let minDistance = getDistance(mapCenter[0], mapCenter[1], closest.lat, closest.lng);

      buildings.forEach(b => {
        const d = getDistance(mapCenter[0], mapCenter[1], b.lat, b.lng);
        if (d < minDistance) {
          minDistance = d;
          closest = b;
        }
      });

      await runSimulation(closest, mapCenter);

    } catch (err: any) {
      setError('検索エラー: ' + err.message);
      setPhase('SET_HOME');
    }
  };

  const handleConfirmNTTManual = async () => {
    if (!homeCoords) return;
    setError('');
    setPhase('SEARCHING');
    setLoadingStep('経路を算出中...');

    const manualBuilding: NTTBuilding = {
      id: 'manual_' + Date.now(),
      name: '手動指定NTTビル',
      lat: mapCenter[0],
      lng: mapCenter[1]
    };

    try {
      await runSimulation(manualBuilding, homeCoords);
    } catch (err: any) {
      setError('シミュレーションエラー: ' + err.message);
      setPhase('SET_NTT_MANUAL');
    }
  };

  const runSimulation = async (building: NTTBuilding, home: [number, number]) => {
    setLoadingStep('経路を算出中...');
    try {
      const route = await fetchRoute([building.lat, building.lng], home);
      const infra = generateInfrastructure(route);
      const cost = calculateCost(infra);
      setResult({ ...infra, building, cost });
      setPhase('RESULT');
      setJumpCoords(home);
    } catch(err: any) {
      throw new Error(err.message || '経路の取得に失敗しました。');
    }
  };

  const handleReset = () => {
    setResult(null);
    setHomeCoords(null);
    setPhase('SET_HOME');
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* ====================================================
          左カラム: 安定したサイドバー (UI層)
      ======================================================= */}
      <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 z-10 shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-6 h-6 text-sky-500" />
            <h1 className="text-xl font-black bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              FTTH エリア計量
            </h1>
          </div>
          <p className="text-xs text-slate-400">地図上で設備をプロットし、概算費用をシミュレート</p>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* フェーズ 1: 自宅指定 */}
            {phase === 'SET_HOME' && (
              <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                <div>
                  <h2 className="text-sm font-bold text-amber-500 mb-2 flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Step 1</span> 自宅の決定
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800 p-3 rounded-xl border border-slate-700">
                    住所検索で地図を移動し、右側の地図の中央の的（ターゲット）を自宅の位置に合わせてください。
                  </p>
                </div>

                <form onSubmit={handleSearchJump} className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="住所・地名を入力"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium text-white shadow-inner"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    disabled={loadingStep !== ''}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-300 transition-colors"
                  >
                    地図をジャンプ
                  </button>
                </form>

                <div className="mt-8">
                  <button
                    onClick={handleConfirmHome}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-4 rounded-xl text-md font-black shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" /> 地図の中央を自宅にする
                  </button>
                </div>
              </motion.div>
            )}

            {/* フェーズ 2: 手動局舎指定 */}
            {phase === 'SET_NTT_MANUAL' && (
              <motion.div key="ntt" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                <div>
                  <h2 className="text-sm font-bold text-sky-500 mb-2 flex items-center gap-2">
                    <span className="bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded">Step 2</span> 局舎の配置
                  </h2>
                  <div className="bg-slate-800 p-4 rounded-xl border border-sky-500/30 text-xs text-slate-300 leading-relaxed shadow-lg shadow-sky-900/20">
                    <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold">
                      <AlertTriangle className="w-4 h-4" /> 局舎が自動取得できませんでした
                    </div>
                    <p className="mb-2">Googleマップ等で最寄りのNTTビルを検索し、その位置へ地図を移動してください。</p>
                    <p>画面中央の青い的を合わせた上で下のボタンを押してください。</p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleConfirmNTTManual}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-slate-900 py-4 rounded-xl text-md font-black shadow-[0_0_30px_-5px_rgba(14,165,233,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-5 h-5" /> 地図の中央を局舎にする
                  </button>
                </div>
              </motion.div>
            )}

            {/* フェーズ 3: ロード中 */}
            {phase === 'SEARCHING' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                 <Navigation className="w-8 h-8 animate-spin text-sky-500" />
                 <p className="text-sm font-bold animate-pulse">{loadingStep}</p>
              </motion.div>
            )}

            {/* フェーズ 4: 結果表示 */}
            {phase === 'RESULT' && result && (
              <motion.div key="result" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6 h-full">
                <div>
                  <h2 className="text-sm font-bold text-emerald-500 mb-2 flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Result</span> シミュレーション完了
                  </h2>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex flex-col">
                  <div className="bg-sky-900/30 p-5 border-b border-slate-800">
                    <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mb-1">概算設備費用</p>
                    <h2 className="text-3xl font-black text-white tracking-tight">{formatJPY(result.cost)}</h2>
                    <p className="text-[11px] text-slate-400 mt-2">起点: {result.building.name} ({Math.round(result.totalDistance)}m)</p>
                  </div>

                  <div className="p-5 space-y-4 flex-1">
                    <div className="bg-slate-900 rounded-xl p-3 flex justify-between items-center text-sm border border-slate-800/50">
                      <span className="text-slate-400 flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]"></div> 管路区間
                      </span>
                      <span className="font-black text-slate-100">{Math.round(result.conduitLength)} <span className="text-xs text-slate-500 font-normal">m</span></span>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-3 flex justify-between items-center text-sm border border-slate-800/50">
                      <span className="text-slate-400 flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div> 電柱区間
                      </span>
                      <span className="font-black text-slate-100">{Math.round(result.aerialLength)} <span className="text-xs text-slate-500 font-normal">m</span></span>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-3 flex justify-between items-center text-sm border border-slate-800/50">
                      <span className="text-slate-400 flex items-center gap-2">
                         <Pole className="w-4 h-4 text-slate-400" /> 電柱本数
                      </span>
                      <span className="font-black text-slate-100">{result.poleCount} <span className="text-xs text-slate-500 font-normal">本</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button onClick={handleReset} className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 transition-colors">
                    最初からやり直す
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* 右下にエラー表示 */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mt-4 bg-rose-500/10 border border-rose-500/50 text-rose-400 px-4 py-3 rounded-xl text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <div>{error}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ====================================================
          右カラム: マップ本体 (地図層)
      ======================================================= */}
      <div className="flex-1 relative bg-[#020617] cursor-crosshair">
        
        {/* React-Leaflet に全画面を使わせる */}
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ width: '100%', height: '100%', zIndex: 0 }}
          zoomControl={false}
          className="custom-popup"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <CenterTracker onCenterChange={setMapCenter} />
          {jumpCoords && <RecenterMap coords={jumpCoords} />}
          
          {homeCoords && phase !== 'SET_HOME' && (
            <Marker position={homeCoords} icon={homeIcon} zIndexOffset={100} />
          )}

          {result && (
            <>
              <Marker position={[result.building.lat, result.building.lng]} icon={buildingIcon} zIndexOffset={100}>
                <Popup>
                  <div className="font-bold">{result.building.name}</div>
                  <div className="text-xs text-slate-500 italic">基幹局舎</div>
                </Popup>
              </Marker>
              
              {result.segments.map((seg, idx) => (
                <Polyline
                  key={idx}
                  positions={seg.path}
                  color={seg.type === 'conduit' ? '#0ea5e9' : '#f59e0b'}
                  weight={seg.type === 'conduit' ? 6 : 4}
                  opacity={0.8}
                  dashArray={seg.type === 'conduit' ? undefined : '5, 10'}
                />
              ))}

              {result.poles.map((pole, idx) => (
                <Marker key={idx} position={[pole.lat, pole.lng]} icon={poleIcon}>
                  <Popup>
                    <div className="text-[10px]">電柱 No.{idx + 1}</div>
                    <div className="text-[9px] text-slate-400">距離: {Math.round(pole.distance)}m</div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>

        {/* ターゲットーカーソル（地図の真ん中に絶対配置） */}
        {(phase === 'SET_HOME' || phase === 'SET_NTT_MANUAL') && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
              className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center bg-black/20 backdrop-blur-[2px] ${phase === 'SET_HOME' ? 'border-amber-500 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'border-sky-500 text-sky-500 shadow-[0_0_30px_rgba(14,165,233,0.3)]'}`}
            >
              <Crosshair className="w-6 h-6 opacity-70" />
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

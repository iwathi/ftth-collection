import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { EquipmentDefinition } from '../data/equipments';
import {
  Server, Home, Building2, ArrowUpToLine,
  Network, Cpu, Link2, Plug
} from 'lucide-react';

// =============================================================
// 通信機器（接続箇所）アイコンマッピング
// =============================================================
const getEquipmentIcon = (id: string) => {
  switch (id) {
    case 'eq_olt':            return <Cpu className="w-6 h-6 text-sky-400" />;
    case 'eq_ftm':            return <Network className="w-6 h-6 text-indigo-400" />;
    case 'eq_chika_closure':  return <Plug className="w-6 h-6 text-emerald-400" />;
    case 'eq_kaku_closure':   return <Plug className="w-6 h-6 text-amber-400" />;
    case 'eq_splitter_8':     return <Link2 className="w-6 h-6 text-rose-400" />;
    case 'eq_splitter_4':     return <Link2 className="w-6 h-6 text-orange-400" />;
    case 'eq_outlet':         return <Plug className="w-6 h-6 text-teal-400" />;
    case 'eq_onu':            return <Server className="w-6 h-6 text-purple-400" />;
    default:                  return <Server className="w-6 h-6 text-slate-400" />;
  }
};

// =============================================================
// 通信機器ノード（接続箇所） — 縦型コンパクト、クロージャ類は横長
// =============================================================
type EquipmentNodeData = {
  equipment: EquipmentDefinition;
  isError?: boolean;
};

export const EquipmentNode: React.FC<NodeProps<EquipmentNodeData>> = ({ data, selected }) => {
  const { equipment, isError } = data;

  // クロージャ類は横長レイアウト
  const isClosure = ['eq_chika_closure', 'eq_kaku_closure'].includes(equipment.id);

  if (isClosure) {
    return (
      <div
        className={`
          relative flex flex-row items-center gap-1 px-2 py-1 cursor-grab
          rounded-sm border backdrop-blur-sm shadow-sm transition-all duration-200
          bg-slate-800/95
          ${selected ? 'border-sky-400 ring-1 ring-sky-400/40' : 'border-slate-600'}
          ${isError ? 'border-red-500 ring-1 ring-red-500/40 bg-red-950/60 animate-pulse' : ''}
        `}
        style={{ minWidth: 100, maxWidth: 140 }}
      >
        {/* 入力ハンドル (左) */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-sky-500 !border-2 !border-slate-900"
        />

        {/* アイコン削除 */}

        {/* 名前 */}
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] font-bold text-slate-100 truncate">{equipment.name}</span>
          <span className="text-[8px] text-slate-400 truncate">接続点</span>
        </div>

        {/* 出力ハンドル (右) */}
        {equipment.validTargets.length > 0 && (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-sky-500 !border-2 !border-slate-900"
          />
        )}
      </div>
    );
  }

  // 通常（縦型）
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center rounded-xl px-3 py-2 gap-1
        bg-slate-800/90 border backdrop-blur-sm shadow-lg cursor-grab
        transition-all duration-200
        ${selected ? 'border-sky-400 ring-2 ring-sky-400/40 scale-105' : 'border-slate-600'}
        ${isError ? 'border-red-500 ring-2 ring-red-500/40 bg-red-950/60 animate-pulse' : ''}
      `}
      style={{ minWidth: 90 }}
    >
      {/* 入力ハンドル (OLT は入力なし) */}
      {equipment.id !== 'eq_olt' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-sky-500 !border-2 !border-slate-900"
        />
      )}

      <div className="bg-slate-700/80 rounded-lg p-2">
        {getEquipmentIcon(equipment.id)}
      </div>
      <span className="text-[11px] font-bold text-slate-100 whitespace-nowrap">{equipment.name}</span>
      <span className="text-[9px] text-slate-400 whitespace-nowrap">接続箇所</span>

      {/* 出力ハンドル (ONU は出力なし) */}
      {equipment.validTargets.length > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-sky-500 !border-2 !border-slate-900"
        />
      )}
    </div>
  );
};

// =============================================================
// NTTビルノード（大型コンテナ）
// =============================================================
export const NTTBuildingNode: React.FC<NodeProps> = ({ selected }) => (
  <div
    className={`relative rounded-lg border-2 overflow-hidden ${selected ? 'border-sky-400' : 'border-slate-500'}`}
    style={{
      width: 320, height: 260,
      background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.97) 100%)',
    }}
  >
    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-600 bg-slate-700/60">
      <Building2 className="w-5 h-5 text-sky-400" />
      <span className="text-sm font-bold text-sky-300 tracking-wide">NTT ビル</span>
      <span className="ml-auto text-[10px] text-slate-400">局舎フェーズ</span>
    </div>
    <div className="p-3 grid grid-cols-2 gap-2 mt-1">
      <div className="rounded border border-dashed border-slate-600 bg-slate-800/40 p-2 text-center text-[10px] text-slate-500">OLT / FTM</div>
      <div className="rounded border border-dashed border-slate-600 bg-slate-800/40 p-2 text-center text-[10px] text-slate-500">SMDC / 配線盤</div>
    </div>
  </div>
);

// =============================================================
// お客様宅ノード（家型）
// =============================================================
export const CustomerHouseNode: React.FC<NodeProps> = ({ selected }) => (
  <div
    className={`relative overflow-hidden border-2 ${selected ? 'border-amber-400' : 'border-amber-700/60'}`}
    style={{ width: 220, height: 200, background: 'linear-gradient(180deg, rgba(30,41,59,0.90) 0%, rgba(15,23,42,0.95) 100%)' }}
  >
    {/* 三角屋根 */}
    <div style={{ width: 0, height: 0, borderLeft: '110px solid transparent', borderRight: '110px solid transparent', borderBottom: '55px solid rgba(120,80,20,0.7)' }} />
    <div style={{ position: 'absolute', top: 10, width: 0, height: 0, left: 0, borderLeft: '110px solid transparent', borderRight: '110px solid transparent', borderBottom: '50px solid rgba(78,52,12,0.5)' }} />
    <div className="border-t border-amber-800/50 bg-slate-800/60 px-2 py-1">
      <div className="flex items-center gap-1 border-b border-slate-700 pb-1 mb-1">
        <Home className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold text-amber-300">お客様宅</span>
      </div>
      <div className="grid grid-cols-2 gap-1 mt-1">
        <div className="rounded border border-dashed border-slate-600 bg-slate-800/40 p-1 text-center text-[9px] text-slate-500">光コンセント</div>
        <div className="rounded border border-dashed border-slate-600 bg-slate-800/40 p-1 text-center text-[9px] text-slate-500">ONU</div>
      </div>
    </div>
  </div>
);

// =============================================================
// 電柱ノード
// =============================================================
export const PoleNode: React.FC<NodeProps<{ label?: string }>> = ({ data, selected }) => (
  <div className="flex flex-col items-center" style={{ width: 50 }}>
    <div className={`border-b-2 ${selected ? 'border-sky-400' : 'border-slate-400'}`} style={{ width: 50, marginBottom: 2 }} />
    <div className={`rounded border ${selected ? 'border-sky-400' : 'border-slate-500'}`}
      style={{ width: 10, height: 120, background: 'linear-gradient(90deg, #475569, #64748b, #475569)' }} />
    <span className="text-[9px] text-slate-400 mt-1 font-bold text-center">{data?.label || '電柱'}</span>
  </div>
);

// =============================================================
// マンホールノード（図の通り: ボックス型、側面に管路の穴）
// =============================================================
export const ManholeNode: React.FC<NodeProps> = ({ selected }) => (
  <div className="flex flex-col items-center gap-0" style={{ width: 180 }}>
    {/* 地表の蓋（小さな四角） */}
    <div
      className={`border ${selected ? 'border-sky-400 bg-slate-600' : 'border-slate-400 bg-slate-700'}`}
      style={{ width: 80, height: 12, borderRadius: 2 }}
    />
    {/* 本体ボックス */}
    <div
      className={`relative border-2 flex flex-col items-center justify-center ${selected ? 'border-sky-400' : 'border-slate-500'}`}
      style={{ width: 180, height: 120, background: 'linear-gradient(180deg,#334155,#1e293b)' }}
    >
      {/* 側面の管路穴（左右に円形のくぼみ） */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2
        w-4 h-4 rounded-full border-2 border-emerald-500 bg-slate-900/80" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2
        w-4 h-4 rounded-full border-2 border-emerald-500 bg-slate-900/80" />
      <span className="text-[8px] text-slate-400 font-bold select-none">MH</span>
    </div>
    <span className="text-[9px] text-slate-400 font-bold mt-1">マンホール</span>
  </div>
);

// =============================================================
// とう道ノード（断面図: 四角トンネル + 上床板・歩床・下床板）
// =============================================================
export const ToudouNode: React.FC<NodeProps> = ({ selected }) => (
  <div
    className={`relative border-2 flex flex-col overflow-hidden ${selected ? 'border-sky-400' : 'border-slate-500'}`}
    style={{ width: 360, height: 120, background: 'linear-gradient(180deg,#1e293b,#0f172a)' }}
  >
    {/* 上床板 */}
    <div className="w-full bg-slate-600" style={{ height: 6 }} />
    {/* 内部（歩床） */}
    <div className="flex-1 flex items-center justify-center">
      <span className="text-[9px] text-slate-500 font-bold tracking-widest select-none">
        ━ とう道（断面）━
      </span>
    </div>
    {/* 歩床ライン */}
    <div className="w-full bg-slate-700" style={{ height: 3 }} />
    {/* 下床板 */}
    <div className="w-full bg-slate-600" style={{ height: 6 }} />
  </div>
);

// =============================================================
// 管路ノード（円筒形パイプ: 横長）
// =============================================================
export const KanroNode: React.FC<NodeProps> = ({ selected }) => (
  <div className="flex flex-col items-center" style={{ width: 140 }}>
    {/* パイプ本体（楕円キャップ付き横長円筒） */}
    <div
      className={`relative flex items-center ${selected ? 'ring-1 ring-sky-400' : ''}`}
      style={{ width: 140, height: 28 }}
    >
      {/* 左キャップ（楕円） */}
      <div
        className="absolute left-0 z-10 border-2 border-emerald-600"
        style={{
          width: 18, height: 28, borderRadius: '50%',
          background: 'radial-gradient(ellipse at 40% 50%, #4ade80, #166534)',
        }}
      />
      {/* パイプ胴体 */}
      <div
        className="flex-1 flex items-center justify-center border-t-2 border-b-2 border-emerald-700"
        style={{
          height: 28, marginLeft: 9, marginRight: 9,
          background: 'linear-gradient(180deg, #15803d 0%, #4ade80 40%, #15803d 100%)',
        }}
      >
        <span className="text-[9px] text-emerald-100 font-bold tracking-widest select-none">管路</span>
      </div>
      {/* 右キャップ（楕円） */}
      <div
        className="absolute right-0 z-10 border-2 border-emerald-600"
        style={{
          width: 18, height: 28, borderRadius: '50%',
          background: 'radial-gradient(ellipse at 60% 50%, #4ade80, #166534)',
        }}
      />
    </div>
  </div>
);

// =============================================================
// 引き上げ電柱ノード（地下→地上）
// =============================================================
export const RiserPoleNode: React.FC<NodeProps> = ({ selected }) => (
  <div className="flex flex-col items-center" style={{ width: 50 }}>
    <ArrowUpToLine className={`w-5 h-5 mb-1 ${selected ? 'text-sky-400' : 'text-slate-400'}`} />
    <div className="border-b-2 border-slate-400" style={{ width: 50, marginBottom: 2 }} />
    <div className={`rounded border ${selected ? 'border-sky-400' : 'border-slate-500'}`}
      style={{ width: 10, height: 100, background: 'linear-gradient(90deg, #374151, #6b7280, #374151)' }} />
    <div className={`w-0.5 h-6 ${selected ? 'bg-sky-400' : 'bg-emerald-600'}`} />
    <span className="text-[8px] text-slate-400 font-bold text-center leading-tight">引き上げ<br/>電柱</span>
  </div>
);

// =============================================================
// スプリッタ共通コンポーネント（N分岐）
// 左に1入力、右にN出力のハンドルを縦に等間隔で持つ
// =============================================================
const SplitterNode: React.FC<NodeProps & { branches: number; color: string; label: string }> = ({
  selected, branches, color, label
}) => {
  // 1出力ごとの高さ（最低24px）
  const rowH = 26;
  const bodyH = branches * rowH + 16; // 上下パディング込み
  const bodyW = 180;

  return (
    <div
      className={`relative flex flex-row items-stretch border-2 rounded-md overflow-visible cursor-grab
        bg-slate-800/90 backdrop-blur-sm shadow-lg transition-all duration-200
        ${selected ? 'border-sky-400 ring-2 ring-sky-400/30' : 'border-slate-600'}`}
      style={{ width: bodyW, height: bodyH, minHeight: bodyH }}
    >
      {/* 左側（入力端子 + ラベル） */}
      <div className="flex flex-col items-center justify-center px-2 border-r border-slate-600 bg-slate-700/40 min-w-[56px]">
        <Link2 className={`w-5 h-5 mb-1`} style={{ color }} />
        <span className="text-[9px] font-bold text-slate-200 text-center leading-tight whitespace-nowrap">{label}</span>
      </div>

      {/* 右側（N出力ドット） */}
      <div className="flex-1 flex flex-col justify-around items-end pr-1 py-1">
        {Array.from({ length: branches }, (_, i) => (
          <div key={i} className="flex items-center gap-1 w-full justify-end">
            <span className="text-[8px] text-slate-500">{i + 1}</span>
            <div
              className="rounded-full border border-slate-500 bg-slate-600"
              style={{ width: 8, height: 8 }}
            />
          </div>
        ))}
      </div>

      {/* 1つの入力ハンドル (左) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !bg-sky-500 !border-2 !border-slate-900"
        style={{ top: '50%' }}
      />

      {/* N出力ハンドル (右) — 等間隔で縦に配置 */}
      {Array.from({ length: branches }, (_, i) => (
        <Handle
          key={i}
          type="source"
          position={Position.Right}
          id={`out-${i}`}
          className="!w-2.5 !h-2.5 !bg-rose-500 !border !border-slate-900"
          style={{
            top: `${((i + 0.5) / branches) * 100}%`,
            right: -5,
          }}
        />
      ))}
    </div>
  );
};

export const Splitter8Node: React.FC<NodeProps> = (props) => (
  <SplitterNode {...props} branches={8} color="#f87171" label={`8分岐\nスプリッタ`} />
);

export const Splitter4Node: React.FC<NodeProps> = (props) => (
  <SplitterNode {...props} branches={4} color="#fb923c" label={`4分岐\nスプリッタ`} />
);

import React from 'react';
import { EQUIPMENTS_DATA, type EquipmentDefinition } from '../data/equipments';
import { trackEvent } from '../lib/gtag';

export const Sidebar: React.FC = () => {
  const onDragStart = (eventObj: React.DragEvent<HTMLDivElement>, equipmentData: EquipmentDefinition) => {
    // 分析用イベント送信: ドラッグ開始
    trackEvent({
      action: 'drag_start',
      category: 'interaction',
      label: equipmentData.name,
      item_type: equipmentData.itemType,
      action_detail: 'inventory_drag'
    });

    // stringified データを付与してドロップ先に渡す
    eventObj.dataTransfer.setData('application/reactflow', JSON.stringify(equipmentData));
    eventObj.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside 
      id="tutorial-inventory" 
      className="w-full md:w-72 h-1/4 md:h-full bg-slate-800/80 backdrop-blur-md border-t md:border-t-0 md:border-l border-slate-700 p-4 flex flex-col z-20"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white text-center md:text-left">機材インベントリ</h2>
        <p className="text-sm text-slate-400 text-center md:text-left mt-1">
          機材をドラッグ＆ドロップしてマップに配置してください。
        </p>
      </div>

      {/* スマホ時は横スクロール、PC時は縦スクロール */}
      <div className="flex-1 overflow-y-auto overflow-x-auto md:overflow-x-hidden pt-2 pb-6 pr-2 custom-scrollbar">
        <div className="mb-4">
          <h3 className="text-emerald-400 font-bold mb-2 border-b border-emerald-500/30 pb-1">基盤設備 (設置用)</h3>
          <div className="flex md:flex-col gap-3">
            {EQUIPMENTS_DATA.filter(eq => eq.itemType === 'infrastructure').map((eq) => (
              <div
                key={eq.id}
                draggable
                onDragStart={(e) => onDragStart(e, eq)}
                className="flex-shrink-0 w-40 md:w-full bg-slate-700/50 hover:bg-slate-600/80 border border-slate-500 border-dashed rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
              >
                <div className="text-center font-bold text-slate-200 mb-1">{eq.name}</div>
                <div className="text-xs text-emerald-400 text-center bg-slate-800/50 rounded px-1 py-0.5 mb-2 mx-auto w-fit">
                  {eq.category}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 md:line-clamp-none text-left">
                  {eq.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sky-400 font-bold mb-2 border-b border-sky-500/30 pb-1">接続箇所 (結線用)</h3>
          <div className="flex md:flex-col gap-3">
            {EQUIPMENTS_DATA.filter(eq => eq.itemType === 'node').map((eq) => (
              <div
                key={eq.id}
                draggable
                onDragStart={(e) => onDragStart(e, eq)}
                className="flex-shrink-0 w-40 md:w-full bg-slate-700/50 hover:bg-slate-600/80 border border-sky-500/50 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
              >
                <div className="text-center font-bold text-slate-200 mb-1">{eq.name}</div>
                <div className="text-xs text-sky-400 text-center bg-slate-800/50 rounded px-1 py-0.5 mb-2 mx-auto w-fit">
                  {eq.category}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 md:line-clamp-none text-left">
                  {eq.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

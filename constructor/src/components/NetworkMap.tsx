import React, { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
} from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';

import {
  EquipmentNode,
  NTTBuildingNode,
  CustomerHouseNode,
  PoleNode,
  ManholeNode,
  ToudouNode,
  KanroNode,
  RiserPoleNode,
  Splitter8Node,
  Splitter4Node,
} from './CustomNode';
import type { EquipmentDefinition } from '../data/equipments';
import { LearningPopup } from './LearningPopup';
import { Play, CheckCircle2, AlertCircle, JapaneseYen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { event } from '../lib/gtag';

// ノードタイプ定義（コンポーネント外に定義して再生成を防ぐ）
const nodeTypes = {
  equipmentNode: EquipmentNode,
  nttBuilding: NTTBuildingNode,
  customerHouse: CustomerHouseNode,
  pole: PoleNode,
  manhole: ManholeNode,
  toudou: ToudouNode,
  kanro: KanroNode,
  riserPole: RiserPoleNode,
  splitter8: Splitter8Node,
  splitter4: Splitter4Node,
};

// =============================================================
// キャンバス初期配置ノード (NTTビルとお客様宅)
// =============================================================
const INITIAL_NODES: Node[] = [
  {
    id: 'init_ntt_building',
    type: 'nttBuilding',
    position: { x: 60, y: 80 },
    data: { label: 'NTTビル' },
    draggable: true,
    selectable: true,
    deletable: false,
    zIndex: 0,
  },
  {
    id: 'init_customer_house',
    type: 'customerHouse',
    position: { x: 1000, y: 100 },
    data: { label: 'お客様宅' },
    draggable: true,
    selectable: true,
    deletable: false,
    zIndex: 0,
  },
];

export const NetworkMap: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // 学習ポップアップ
  const [activeEquipment, setActiveEquipment] = useState<EquipmentDefinition | null>(null);

  // テスト結果
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // 概算工事費用の計算
  const totalCost = useMemo(() => {
    return nodes.reduce((sum, node) => {
      const equipment = node.data?.equipment as EquipmentDefinition | undefined;
      return sum + (equipment?.unitCost || 0);
    }, 0);
  }, [nodes]);

  const formatJPY = (val: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(val);
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // 1:1 接続制限（1つの端子から1本のみ）
      const alreadyHasConnection = edges.some(
        (e) => e.source === params.source && e.sourceHandle === params.sourceHandle
      );

      if (alreadyHasConnection) {
        setTestResult({
          status: 'error',
          message: '1つの端子からは1本しか接続できません。',
        });
        setTimeout(() => setTestResult({ status: 'idle', message: '' }), 3000);
        return;
      }

      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // 通信機器ノード同士の接続のみ検証（インフラノードはスルー）
      const sourceEq = sourceNode.data?.equipment as EquipmentDefinition | undefined;
      const targetEq = targetNode.data?.equipment as EquipmentDefinition | undefined;

      // 分析用イベント送信: 結線アクション
      event({
        action: 'network_connect',
        category: 'interaction',
        label: `${sourceEq?.name || 'unknown'} -> ${targetEq?.name || 'unknown'}`,
        item_type: sourceEq?.itemType,
        action_detail: 'wire_connection'
      });

      let isCorrect = true; // インフラ同士・インフラ-機器間はニュートラル扱い

      if (sourceEq && targetEq) {
        // 基盤設備同士の結線は不可
        if (
          sourceEq.itemType === 'infrastructure' ||
          targetEq.itemType === 'infrastructure'
        )
          return;
        // 正しい接続かチェック
        isCorrect = sourceEq.validTargets.includes(targetEq.id);
      }

      if (!params.source || !params.target) return;

      const newEdge: Edge = {
        ...params,
        source: params.source,
        target: params.target,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCorrect ? '#38bdf8' : '#cbd5e1',
        },
        style: {
          stroke: isCorrect ? '#38bdf8' : '#94a3b8',
          strokeWidth: 2,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));

      if (sourceEq && targetEq) {
        if (isCorrect) {
          setActiveEquipment(targetEq);
        } else {
          setTestResult({
            status: 'error',
            message: `${sourceEq.name} → ${targetEq.name} の直接接続は推奨されていません。`,
          });
          setTimeout(() => setTestResult({ status: 'idle', message: '' }), 4000);
        }
      }
    },
    [nodes, edges, setEdges, setActiveEquipment, setTestResult]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const raw = event.dataTransfer.getData('application/reactflow');
      if (!raw) return;

      const equipmentData = JSON.parse(raw) as EquipmentDefinition;

      // 分析用イベント送信: ドラッグ＆ドロップ（配置）
      event({
        action: 'drag_and_drop',
        category: 'interaction',
        label: equipmentData.name,
        item_type: equipmentData.itemType,
        action_detail: 'place_node'
      });

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // インフラ設備ごとに適切なノードタイプを選択
      let nodeType = 'equipmentNode';
      if (equipmentData.itemType === 'infrastructure') {
              switch (equipmentData.id) {
          case 'infra_ntt_building': nodeType = 'nttBuilding'; break;
          case 'infra_house': nodeType = 'customerHouse'; break;
          case 'infra_pole': nodeType = 'pole'; break;
          case 'infra_riser_pole': nodeType = 'riserPole'; break;
          case 'infra_manhole': nodeType = 'manhole'; break;
          case 'infra_toudo': nodeType = 'toudou'; break;
          case 'infra_kanro': nodeType = 'kanro'; break;
          default: nodeType = 'equipmentNode';
        }
      } else {
        // 通信機器の中でスプリッタは専用ノードタイプを使用
        switch (equipmentData.id) {
          case 'eq_splitter_8': nodeType = 'splitter8'; break;
          case 'eq_splitter_4': nodeType = 'splitter4'; break;
          default: nodeType = 'equipmentNode';
        }
      }

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: nodeType,
        position,
        data: {
          equipment: equipmentData,
          label: equipmentData.name,
        },
        draggable: true,
        // インフラ設備は zIndex:0、通信機器は zIndex:10 → エッジ(zIndex:5)が中間に入る
        zIndex: equipmentData.itemType === 'infrastructure' ? 0 : 10,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // ================================================================
  // 開通テスト — BFS で OLT から ONU へのパスが存在するか判定
  // ================================================================
  const runTest = () => {
    // 分析用イベント送信: テスト実行
    event({
      action: 'run_test',
      category: 'feature',
      label: 'Network Connection Test',
      action_detail: 'test_execution'
    });

    // OLTとONUのノードを探す（splitterノードタイプも対象に含める）
    const allEquipNodes = nodes.filter(n =>
      ['equipmentNode', 'splitter8', 'splitter4'].includes(n.type ?? '')
    );

    const oltNode = allEquipNodes.find(n => n.data?.equipment?.id === 'eq_olt');
    const onuNodes = allEquipNodes.filter(n => n.data?.equipment?.id === 'eq_onu');

    if (!oltNode) {
      setTestResult({ status: 'error', message: 'OLT を配置して接続してください。' });
      return;
    }
    if (onuNodes.length === 0) {
      setTestResult({ status: 'error', message: 'ONU を配置して接続してください。' });
      return;
    }

    // BFS: OLT から到達可能なノードIDセットを構築
    const visited = new Set<string>();
    const queue: string[] = [oltNode.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // current から出るエッジを全て辿る
      edges
        .filter(e => e.source === current)
        .forEach(e => {
          if (!visited.has(e.target)) queue.push(e.target);
        });
    }

    // ONUに到達できたか
    const reachedOnuIds = onuNodes.filter(n => visited.has(n.id)).map(n => n.id);
    const success = reachedOnuIds.length > 0;

    // 分析用イベント送信: テスト結果
    event({
      action: 'test_result',
      category: 'feature',
      label: success ? 'Success' : 'Failure',
      value: success ? 1 : 0,
      action_detail: 'test_outcome'
    });

    if (success) {
      // 成功: 到達可能経路のエッジを緑アニメーション、それ以外はグレー
      setEdges(eds =>
        eds.map(e =>
          visited.has(e.source) && visited.has(e.target)
            ? { ...e, animated: true, style: { stroke: '#10b981', strokeWidth: 3 } }
            : { ...e, animated: false, style: { stroke: '#475569', strokeWidth: 1.5 } }
        )
      );
      setTestResult({
        status: 'success',
        message: `開通成功！ OLT → ONU まで光信号が通りました 🎉`,
      });
    } else {
      setTestResult({
        status: 'error',
        message: 'OLT から ONU まで繋がっていません。接続を確認してください。',
      });
    }
  };

  return (
    <div id="tutorial-map" className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
      {/* 概算工事費用オーバーレイ (左上) */}
      <div className="absolute top-4 left-4 z-50">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-slate-900/85 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[240px]"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <JapaneseYen className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">概算工事費用</span>
          </div>
          <motion.div
            key={totalCost}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-black text-white font-mono flex items-baseline gap-1"
          >
            {formatJPY(totalCost)}
          </motion.div>
          <div className="mt-2 text-[10px] text-slate-500 border-t border-slate-800 pt-2">
            ※ 設置設備に基づきリアルタイム算定
          </div>
        </motion.div>
      </div>

      {/* 背景ゾーン（上=地上 / 下=地下） */}
      <div className="absolute inset-0 pointer-events-none flex flex-col opacity-100 z-0">
        {/* 地上エリア (空) */}
        <div
          className="flex-1 border-b border-slate-600 flex flex-col"
          style={{
            background:
              'linear-gradient(180deg, rgba(14,30,64,0.95) 0%, rgba(15,40,80,0.85) 100%)',
          }}
        >
          <p className="text-slate-600 text-xs font-bold p-3 tracking-widest opacity-60 uppercase">
            ─── 地上エリア（局舎 / 架空 / 宅内）
          </p>
        </div>
        {/* 地下エリア (土) */}
        <div
          className="flex flex-col"
          style={{
            height: '30%',
            background:
              'linear-gradient(180deg, rgba(30,20,10,0.85) 0%, rgba(20,14,6,0.97) 100%)',
          }}
        >
          <p className="text-slate-600 text-xs font-bold p-3 tracking-widest opacity-60 uppercase">
            ─── 地下エリア（管路・とう道・マンホール）
          </p>
        </div>
      </div>

      {/* 地上/地下の境界線ライン */}
      <div
        className="absolute left-0 right-0 z-0 pointer-events-none flex items-center gap-2 px-4"
        style={{ top: '70%' }}
      >
        <div className="flex-1 border-t-2 border-dashed border-slate-500 opacity-50" />
        <span className="text-slate-500 text-[10px] font-bold whitespace-nowrap opacity-50">
          GL（地表面）
        </span>
        <div className="flex-1 border-t-2 border-dashed border-slate-500 opacity-50" />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={true}
        className="z-10"
      >
        <Controls className="bg-slate-800/90 text-white fill-white border border-slate-700" />
        <Background color="#1e293b" gap={24} size={1} />
      </ReactFlow>

      {/* テスト実行ボタン */}
      <div className="absolute top-4 right-4 z-20">
        <button
          id="tutorial-test-button"
          onClick={runTest}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105"
        >
          <Play className="w-5 h-5 fill-current" />
          開通テスト実行
        </button>
      </div>

      {/* 結果フィードバック */}
      <AnimatePresence>
        {testResult.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-20 right-4 z-20 px-6 py-4 rounded-xl flex items-center gap-3 backdrop-blur-md border shadow-2xl ${
              testResult.status === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100'
                : 'bg-red-950/80 border-red-500/50 text-red-100'
            }`}
          >
            {testResult.status === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400" />
            )}
            <span className="font-bold">{testResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <LearningPopup
        equipment={activeEquipment}
        onClose={() => {
          if (activeEquipment) {
            event({
              action: 'close_popup',
              category: 'interaction',
              label: activeEquipment.name,
              action_detail: 'popup_close'
            });
          }
          setActiveEquipment(null);
        }}
      />
    </div>
  );
};

export default function NetworkMapWrapper() {
  return (
    <ReactFlowProvider>
      <NetworkMap />
    </ReactFlowProvider>
  );
}

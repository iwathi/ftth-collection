import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step } from 'react-joyride';


export const TutorialWrapper: React.FC = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // 初回アクセス時のみチュートリアルを実行
    const hasSeenTutorial = localStorage.getItem('ftth-constructor-tutorial');
    if (!hasSeenTutorial) {
      // マップ描画などのマウントを少し待ってから開始する
      setTimeout(() => setRun(true), 500);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-xl font-bold text-sky-800 mb-2">FTTH Constructor へようこそ！</h2>
          <p className="text-slate-600">このシミュレーターでは、インフラ基盤設備と通信機器を組み合わせて光回線の仕組みを学ぶことができます。</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    } as Step,
    {
      target: '#tutorial-inventory',
      content: (
        <div>
          <h3 className="font-bold text-sky-800 text-lg mb-1">1. 機材を選ぼう</h3>
          <p className="text-slate-600">右または下にあるインベントリには「基盤設備」と「通信機器」が入っています。<br/>配置したいカードを<strong>長押ししてドラッグ</strong>してください。</p>
        </div>
      ),
      placement: 'left-start',
    },
    {
      target: '#tutorial-map',
      content: (
        <div>
          <h3 className="font-bold text-emerald-700 text-lg mb-1">2. 配置と結線</h3>
          <p className="text-slate-600">まずは「NTTビル」や「電柱」などの<strong>基盤設備</strong>を配置し、その上に「OLT」や「クロージャ」などの<strong>通信機器</strong>を置いてみましょう！<br/>配置後、通信機器の<strong>端子（青い丸）</strong>から別の機器へドラッグすると結線できます。</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '#tutorial-test-button',
      content: (
        <div>
          <h3 className="font-bold text-indigo-700 text-lg mb-1">3. 開通テスト</h3>
          <p className="text-slate-600">構成が完成したら、テストを実行して光が流れるか確認しましょう！</p>
        </div>
      ),
      placement: 'bottom',
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('ftth-constructor-tutorial-v2', 'completed');
    }
  };

  const joyrideProps = {
    steps,
    run,
    continuous: true,
    scrollToFirstStep: true,
    showProgress: true,
    showSkipButton: true,
    callback: handleJoyrideCallback,
    styles: {
      options: {
        primaryColor: '#0ea5e9', // sky-500
        textColor: '#1e293b', // slate-800
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        overlayColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 1000,
      },
      tooltipContainer: {
        textAlign: 'left',
        padding: '16px',
      },
      tooltipTitle: {
        margin: 0,
      },
      buttonNext: {
        backgroundColor: '#0284c7', // sky-600
        fontWeight: 'bold',
        borderRadius: '8px',
        padding: '8px 16px',
      },
      buttonBack: {
        color: '#64748b', // slate-500
        marginRight: '8px',
      },
      buttonSkip: {
        color: '#ef4444', // red-500
      }
    },
    locale: {
      back: '戻る',
      close: '閉じる',
      last: '完了',
      next: '次へ',
      skip: 'スキップ',
    }
  };

  const JoyrideComp = Joyride as any;

  return (
    <JoyrideComp {...joyrideProps} />
  );
};

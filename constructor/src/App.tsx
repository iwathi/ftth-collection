import { Sidebar } from './components/Sidebar';
import NetworkMapWrapper from './components/NetworkMap';
import { TutorialWrapper } from './components/TutorialWrapper';

function App() {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <TutorialWrapper />
      {/* 
        スマホ: 縦並び (Mapが上、インベントリが下)
        PC: 横並び (Mapが左、インベントリが右)
      */}
      
      <main className="flex-1 h-3/4 md:h-full relative">
        <NetworkMapWrapper />
      </main>

      <Sidebar />
    </div>
  );
}

export default App;

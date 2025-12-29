import React, { useState, useEffect, useCallback } from 'react';
import { Person } from '../types';
import { Trophy, RotateCcw, Play, History, Trash2, AlertCircle } from 'lucide-react';

interface LuckyDrawProps {
  candidates: Person[];
}

export const LuckyDraw: React.FC<LuckyDrawProps> = ({ candidates }) => {
  const [currentWinner, setCurrentWinner] = useState<Person | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [allowRepeats, setAllowRepeats] = useState(false);
  const [winnersHistory, setWinnersHistory] = useState<Person[]>([]);
  const [displayId, setDisplayId] = useState<string>('???');
  const [displayName, setDisplayName] = useState<string>('准备抽奖');

  // Filter eligible candidates
  const eligibleCandidates = allowRepeats
    ? candidates
    : candidates.filter(c => !winnersHistory.some(w => w.id === c.id));

  const startDraw = useCallback(() => {
    if (eligibleCandidates.length === 0) {
      alert("没有可抽选的候选人了！");
      return;
    }

    setIsDrawing(true);
    let counter = 0;
    const maxIterations = 20; // How many shuffles before stop
    const duration = 2000; // Total duration in ms
    const intervalTime = duration / maxIterations;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
      const randomPerson = eligibleCandidates[randomIndex];
      setDisplayId(randomPerson.id.slice(0, 4));
      setDisplayName(randomPerson.name);
      counter++;

      if (counter >= maxIterations) {
        clearInterval(interval);
        // Final Winner Selection
        const finalIndex = Math.floor(Math.random() * eligibleCandidates.length);
        const winner = eligibleCandidates[finalIndex];
        setCurrentWinner(winner);
        setDisplayName(winner.name);
        setWinnersHistory(prev => [winner, ...prev]);
        setIsDrawing(false);
      }
    }, intervalTime);
  }, [eligibleCandidates]);

  const [confirmHistoryClear, setConfirmHistoryClear] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (confirmHistoryClear) {
      timer = setTimeout(() => setConfirmHistoryClear(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [confirmHistoryClear]);

  const resetHistory = () => {
    if (confirmHistoryClear) {
      setWinnersHistory([]);
      setCurrentWinner(null);
      setDisplayName("准备抽奖");
      setConfirmHistoryClear(false);
    } else {
      setConfirmHistoryClear(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center cursor-pointer gap-2 select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={allowRepeats}
                onChange={(e) => setAllowRepeats(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
            <span className="text-sm font-medium text-slate-700">允许重复中奖</span>
          </label>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <span className="text-sm text-slate-500">
            待抽人数： <span className="font-bold text-slate-800">{eligibleCandidates.length}</span>
          </span>
        </div>

        <button
          onClick={startDraw}
          disabled={isDrawing || eligibleCandidates.length === 0}
          className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${isDrawing || eligibleCandidates.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
            }`}
        >
          {isDrawing ? <RotateCcw className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          {isDrawing ? '抽奖中...' : '开始抽奖'}
        </button>
      </div>

      {/* Main Display */}
      <div className="relative bg-white rounded-3xl shadow-xl border-4 border-indigo-50 p-12 text-center overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500"></div>

        {currentWinner && !isDrawing && (
          <div className="absolute top-4 right-4">
            <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl text-slate-400 font-medium uppercase tracking-widest">获奖者是</h2>
          <div className={`text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-700 to-purple-800 transition-all duration-100 ${isDrawing ? 'blur-[2px] scale-95 opacity-80' : 'blur-0 scale-100 opacity-100'}`}>
            {displayName}
          </div>
          {isDrawing && <div className="text-slate-300 text-sm animate-pulse">洗牌中...</div>}
        </div>
      </div>

      {/* History */}
      {winnersHistory.length > 0 && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-700">
              <History className="w-5 h-5" /> 中奖记录
            </h3>
            <button onClick={resetHistory} className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-md ${confirmHistoryClear ? 'bg-red-50 text-red-700 font-bold' : 'text-red-500 hover:text-red-700 hover:bg-slate-100'}`}>
              {confirmHistoryClear ? <AlertCircle className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
              {confirmHistoryClear ? "确定清除?" : "清除记录"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {winnersHistory.map((winner, idx) => (
              <div key={`${winner.id}-${idx}`} className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm text-slate-700 font-medium animate-in zoom-in duration-300">
                <span className="text-slate-400 mr-2 text-xs">#{winnersHistory.length - idx}</span>
                {winner.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

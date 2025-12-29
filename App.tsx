import React, { useState, useMemo, useEffect } from 'react';
import { AppMode, Person } from './types';
import { LuckyDraw } from './components/LuckyDraw';
import { GroupGenerator } from './components/GroupGenerator';
import { AudioRecorder } from './components/AudioRecorder';
import { cleanNameList } from './services/geminiService';
import { Upload, FileText, Gift, Users, X, Bot, FileInput, AlertCircle, Trash2 } from 'lucide-react';

const MOCK_DATA = `赵一
钱二
孙三
李四
周五
吴六
郑七
王八
冯九
陈十
诸葛亮
曹操
刘备
孙权
关羽
张飞
赵云
马超
黄忠
魏延
孙三
李四`; // Intentionally added duplicates for demo

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.INPUT);
  const [people, setPeople] = useState<Person[]>([]);
  const [rawInput, setRawInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse raw text into people array
  const handleParse = (input: string) => {
    const lines = input.split(/[\n,]+/).map(line => line.trim()).filter(line => line.length > 0);
    const newPeople = lines.map(name => ({
      id: crypto.randomUUID(), // Note: In a real app, stability of ID on re-parse might matter, but okay here
      name
    }));
    setPeople(newPeople);
  };

  // Analyze duplicates
  const { uniqueCount, duplicateCount, duplicatesSet } = useMemo(() => {
    const nameCounts = new Map<string, number>();
    people.forEach(p => {
      nameCounts.set(p.name, (nameCounts.get(p.name) || 0) + 1);
    });

    const duplicates = new Set<string>();
    let dupCount = 0;

    nameCounts.forEach((count, name) => {
      if (count > 1) {
        duplicates.add(name);
        dupCount += count - 1; // Excess occurrences
      }
    });

    return {
      uniqueCount: nameCounts.size,
      duplicateCount: dupCount,
      duplicatesSet: duplicates
    };
  }, [people]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawInput(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleAiClean = async () => {
    if (!rawInput.trim()) return;
    setIsProcessing(true);
    try {
      const names = await cleanNameList(rawInput);
      const text = names.join('\n');
      setRawInput(text);
      handleParse(text);
    } catch (e) {
      alert("AI 格式化失败，请检查 API Key。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranscribedNames = (names: string[]) => {
    const currentNames = rawInput ? rawInput.split('\n') : [];
    const newNames = [...currentNames, ...names].filter(n => n.trim().length > 0);
    const text = newNames.join('\n');
    setRawInput(text);
    handleParse(text);
  };

  const loadMockData = () => {
    setRawInput(MOCK_DATA);
    handleParse(MOCK_DATA);
  };

  const removeDuplicates = () => {
    const seen = new Set();
    const uniqueLines: string[] = [];

    // Process from rawInput lines to maintain approximate order if possible,
    // or just use the current people list. Using people list is easier.
    const uniquePeople: Person[] = [];

    people.forEach(p => {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        uniquePeople.push(p);
      }
    });

    const newText = uniquePeople.map(p => p.name).join('\n');
    setRawInput(newText);
    setPeople(uniquePeople);
  };

  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (confirmClear) {
      timer = setTimeout(() => setConfirmClear(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [confirmClear]);

  const clearData = () => {
    if (confirmClear) {
      setPeople([]);
      setRawInput('');
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Users className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hidden sm:block">
              HR 抽奖与分组工具
            </h1>
          </div>
          <nav className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setMode(AppMode.INPUT)}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${mode === AppMode.INPUT ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900'}`}
            >
              数据来源
            </button>
            <button
              onClick={() => setMode(AppMode.DRAW)}
              disabled={people.length === 0}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${mode === AppMode.DRAW ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900 disabled:opacity-50'}`}
            >
              幸运抽奖
            </button>
            <button
              onClick={() => setMode(AppMode.GROUPS)}
              disabled={people.length === 0}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${mode === AppMode.GROUPS ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900 disabled:opacity-50'}`}
            >
              自动分组
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {mode === AppMode.INPUT && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-800">名单管理</h2>
              <p className="text-slate-500">支持 CSV 导入、文本粘贴或语音输入。</p>
            </div>

            <div className="grid gap-6">

              {/* Input Area */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    名单录入
                  </label>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={loadMockData} className="flex-1 sm:flex-none text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-full transition-colors flex items-center justify-center gap-1">
                      <FileInput className="w-3 h-3" /> 加载模拟名单
                    </button>
                    <label className="flex-1 sm:flex-none cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors flex items-center justify-center gap-1">
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                      <Upload className="w-3 h-3" /> 上传 CSV
                    </label>
                    <button onClick={clearData} className={`flex-1 sm:flex-none text-xs font-medium px-3 py-1.5 rounded-full transition-all flex items-center justify-center gap-1 ${confirmClear ? 'bg-red-600 text-white hover:bg-red-700 font-bold' : 'text-red-600 hover:text-red-800 bg-red-50'}`}>
                      {confirmClear ? <AlertCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {confirmClear ? "确定清空?" : "清空"}
                    </button>
                  </div>
                </div>

                <textarea
                  className="w-full h-48 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none font-mono text-sm bg-slate-50"
                  placeholder="张三&#10;李四&#10;王五..."
                  value={rawInput}
                  onChange={(e) => {
                    setRawInput(e.target.value);
                    handleParse(e.target.value);
                  }}
                ></textarea>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-slate-400">每行一个名字，或用逗号分隔。</p>
                  <button
                    onClick={handleAiClean}
                    disabled={isProcessing || !rawInput}
                    className="flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-full transition-all shadow-sm"
                  >
                    {isProcessing ? <Bot className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                    AI 智能格式化
                  </button>
                </div>
              </div>

              {/* Preview & Validation Area */}
              {people.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-slate-700">名单预览</h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        总计 {people.length} 人
                      </span>
                    </div>
                    {duplicateCount > 0 && (
                      <button
                        onClick={removeDuplicates}
                        className="text-xs flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200 transition-colors font-medium animate-pulse"
                      >
                        <Trash2 className="w-3 h-3" />
                        一键去重 ({duplicateCount})
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                    <div className="flex flex-wrap gap-2">
                      {people.map((p, idx) => {
                        const isDuplicate = duplicatesSet.has(p.name);
                        return (
                          <div
                            key={`${p.id}-${idx}`}
                            className={`px-3 py-1 rounded-md text-sm border flex items-center gap-1.5 ${isDuplicate
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-white border-slate-200 text-slate-700'
                              }`}
                          >
                            {isDuplicate && <AlertCircle className="w-3 h-3" />}
                            {p.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Input */}
              <AudioRecorder onNamesTranscribed={handleTranscribedNames} />

              {/* Footer Actions */}
              {people.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-medium text-indigo-900">{uniqueCount} 位有效候选人就绪</p>
                      <p className="text-xs text-indigo-600">
                        {duplicateCount > 0 ? `发现 ${duplicateCount} 个重复项，建议先去重` : '可前往抽奖或分组'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setMode(AppMode.DRAW)}
                      className="flex-1 sm:flex-none bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      去抽奖
                    </button>
                    <button
                      onClick={() => setMode(AppMode.GROUPS)}
                      className="flex-1 sm:flex-none bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      去分组
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {mode === AppMode.DRAW && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6 text-slate-500">
              <Gift className="w-5 h-5" />
              <h2 className="text-xl font-semibold text-slate-800">幸运抽奖</h2>
            </div>
            <LuckyDraw candidates={people} />
          </div>
        )}

        {mode === AppMode.GROUPS && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6 text-slate-500">
              <Users className="w-5 h-5" />
              <h2 className="text-xl font-semibold text-slate-800">团队分组</h2>
            </div>
            <GroupGenerator people={people} />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
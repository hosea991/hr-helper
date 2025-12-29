import React, { useState } from 'react';
import { Person, Group } from '../types';
import { Users, Shuffle, Wand2, Download, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateGroupNames } from '../services/geminiService';

interface GroupGeneratorProps {
  people: Person[];
}

export const GroupGenerator: React.FC<GroupGeneratorProps> = ({ people }) => {
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNaming, setIsNaming] = useState(false);

  const generateGroups = () => {
    if (people.length === 0) return;
    setIsGenerating(true);

    // Shuffle
    const shuffled = [...people].sort(() => Math.random() - 0.5);
    const newGroups: Group[] = [];
    
    // Chunk
    for (let i = 0; i < shuffled.length; i += groupSize) {
      const chunk = shuffled.slice(i, i + groupSize);
      newGroups.push({
        id: `g-${i}`,
        name: `第 ${newGroups.length + 1} 组`,
        members: chunk
      });
    }

    // Distribute remainders if last group is too small (optional strategy: merge with previous)
    // For now, we leave as is, HR usually prefers manual adjustment or clean math.
    
    setTimeout(() => {
        setGroups(newGroups);
        setIsGenerating(false);
    }, 500); // Fake delay for UX
  };

  const applyAiNames = async () => {
      if(groups.length === 0) return;
      setIsNaming(true);
      const names = await generateGroupNames(groups);
      
      const updatedGroups = groups.map((g, i) => ({
          ...g,
          name: names[i] || g.name
      }));
      setGroups(updatedGroups);
      setIsNaming(false);
  };

  const downloadCSV = () => {
      // 1. Construct the CSV string content
      let csvContent = "组名,姓名,ID\n";
      groups.forEach(g => {
          g.members.forEach(m => {
              // Basic sanitization: replace commas in data with spaces to prevent CSV breakage
              const safeGroupName = g.name.replace(/,/g, ' ');
              const safeName = m.name.replace(/,/g, ' ');
              csvContent += `${safeGroupName},${safeName},${m.id}\n`;
          });
      });

      // 2. Create a Blob with BOM (\uFEFF) for Excel UTF-8 compatibility
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 3. Create a temporary object URL
      const url = URL.createObjectURL(blob);
      
      // 4. Create and trigger the download link
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "groups_result.csv");
      document.body.appendChild(link);
      link.click();
      
      // 5. Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  // Prepare data for chart
  const chartData = groups.map(g => ({
    name: g.name,
    count: g.members.length
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Settings Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="text-slate-400" />
            <span className="font-semibold text-slate-700">总人数: {people.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
             <label className="text-sm font-medium text-slate-600">每组人数:</label>
             <input 
                type="number" 
                min="2" 
                max={people.length}
                value={groupSize}
                onChange={(e) => setGroupSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
             />
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={generateGroups}
            disabled={people.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors font-medium"
          >
            {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
            生成分组
          </button>
        </div>
      </div>

      {/* Results */}
      {groups.length > 0 && (
        <div className="space-y-6">
          {/* Action Bar for Results */}
          <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
             <h3 className="font-bold text-indigo-900">结果可视化</h3>
             <div className="flex gap-2">
                 <button 
                    onClick={applyAiNames}
                    disabled={isNaming}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 text-sm font-medium transition-colors"
                 >
                     {isNaming ? <Wand2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                     AI 生成队名
                 </button>
                 <button 
                    onClick={downloadCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors"
                 >
                     <Download className="w-4 h-4" />
                     导出 CSV
                 </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 lg:col-span-3 h-64">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">分布平衡图</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Group Cards */}
              {groups.map((group, idx) => (
                <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="p-4 border-b border-slate-100" style={{borderTop: `4px solid ${COLORS[idx % COLORS.length]}`}}>
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">{group.name}</h3>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-500">{group.members.length} 名成员</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 bg-slate-50/50">
                    <ul className="space-y-2">
                        {group.members.map(member => (
                            <li key={member.id} className="text-sm text-slate-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                {member.name}
                            </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
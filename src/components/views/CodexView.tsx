import React, { useMemo, useState } from 'react';
import { Position, MetricConfig } from '../../types';
import { METRIC_DEFINITIONS } from '../../data/mockData';
import { audioEngine } from '../../services/audioEngine';

interface CodexViewProps {
  positions: Position[];
  onUpdateWeights: (positionId: string, weights: Position['weights']) => void;
}

export const CodexView: React.FC<CodexViewProps> = ({
  positions,
  onUpdateWeights
}) => {
  const [selectedPosId, setSelectedPosId] = useState(positions[0]?.id || 'pos_01');
  const [activeMetricTab, setActiveMetricTab] = useState<'m1' | 'm2' | 'm3' | 'm4' | 'm5'>('m3');

  const currentPos = positions.find(p => p.id === selectedPosId) || positions[0];
  const [tempWeights, setTempWeights] = useState<Position['weights']>({ ...currentPos.weights });
  const [saveToast, setSaveToast] = useState<string | null>(null);

  /** 按职务范围分组，分组口径与「模拟面试 → 目标职务」完全一致 */
  const positionGroups = useMemo(() => {
    const groups: { code: string; label: string; items: Position[] }[] = [];
    positions.forEach(p => {
      const code = p.trackCode ?? '00';
      const label = p.trackLabel ?? '其他岗位';
      let group = groups.find(g => g.code === code);
      if (!group) {
        group = { code, label, items: [] };
        groups.push(group);
      }
      group.items.push(p);
    });
    return groups;
  }, [positions]);

  const handlePosChange = (id: string) => {
    audioEngine.play('paper');
    setSelectedPosId(id);
    const target = positions.find(p => p.id === id);
    if (target) {
      setTempWeights({ ...target.weights });
    }
  };

  const totalWeight = parseFloat(
    (
      tempWeights.m1 +
      tempWeights.m2 +
      tempWeights.m3 +
      tempWeights.m4 +
      tempWeights.m5
    ).toFixed(2)
  );

  const isValid = Math.abs(totalWeight - 1.0) < 0.001;

  const handleSlider = (key: keyof Position['weights'], val: number) => {
    setTempWeights(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSave = () => {
    if (!isValid) return;
    audioEngine.play('coin');
    onUpdateWeights(selectedPosId, tempWeights);
    setSaveToast('岗位权重规则模板已更新并在全系统生效');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleReset = () => {
    audioEngine.play('click');
    setTempWeights({ ...currentPos.weights });
  };

  const currentMetricDef = METRIC_DEFINITIONS.find(m => m.id === activeMetricTab) || METRIC_DEFINITIONS[0];

  return (
    <div className="space-y-6">
      
      {/* 顶部指引 */}
      <div className="sd-box p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h3 className="font-serifSc font-bold text-base text-[#4a2817]">
              岗位标准库与五维规则配比工坊
            </h3>
          </div>
          <p className="text-xs text-stone-600 font-serifSc">
            将经验主观打分转化为统一的量化指标体系，模型只判定档位，程序严格按公式求和
          </p>
        </div>

        {/* 岗位选择下拉：与「模拟面试 → 目标职务」同一数据源，选项完全一致 */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-700 font-serifSc font-bold">当前配置岗位：</span>
            <select
              value={selectedPosId}
              onChange={e => handlePosChange(e.target.value)}
              className="px-3 py-1.5 text-xs rounded border-2 border-[#5b3117] bg-[#fbf2d5] text-[#381f13] font-serifSc font-bold focus:outline-none"
            >
              {positionGroups.map(group => (
                <optgroup key={group.code} label={`${group.code} ${group.label}`}>
                  {group.items.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-serifSc text-stone-500">
            <span className="px-1.5 py-0.5 rounded bg-[#487332]/12 border border-[#487332]/40 text-[#2f5121] font-bold">
              ⟳ 与模拟面试目标职务同步
            </span>
            <span className="font-mono text-[#8b5329]">共 {positions.length} 个职务</span>
            <span>· {currentPos?.category}</span>
          </div>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-100 border-2 border-emerald-500 text-emerald-900 rounded font-serifSc text-xs flex items-center justify-between animate-fadeIn">
          <span>✓ {saveToast}</span>
          <button onClick={() => setSaveToast(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* 左右分栏：左侧权重滑块配置，右侧五维指标与1-5档位要点 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 左侧权重调节器 */}
        <div className="lg:col-span-5 sd-box p-4 rounded-lg space-y-4">
          <div className="border-b border-[#5b3117]/30 pb-2 flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#4a2817] font-serifSc">
              指标权重配比
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-600 font-serifSc">当前合计：</span>
              <span
                className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
                  isValid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-400 animate-pulse'
                }`}
              >
                {totalWeight.toFixed(2)}
              </span>
            </div>
          </div>

          {!isValid && (
            <div className="p-2.5 rounded bg-red-50 border border-red-400 text-xs text-red-800 font-serifSc leading-relaxed">
              ✦ 规则校验警告：五项权重之和必须严格等于 1.00，当前为 {totalWeight.toFixed(2)}，{totalWeight < 1.0 ? `还差 ${(1.0 - totalWeight).toFixed(2)}` : `超出了 ${(totalWeight - 1.0).toFixed(2)}`}
            </div>
          )}

          <div className="space-y-3.5 text-xs font-serifSc">
            {[
              { key: 'm1', name: '思想政治与品德', desc: '德育表现与志愿奉献', min: 0.1, max: 0.5 },
              { key: 'm2', name: '学业表现', desc: '绩点排名与科技竞赛', min: 0.05, max: 0.4 },
              { key: 'm3', name: '学生工作经历', desc: '骨干履历与实操经验', min: 0.1, max: 0.5 },
              { key: 'm4', name: '岗位匹配能力', desc: '专业素养与任职设想', min: 0.1, max: 0.5 },
              { key: 'm5', name: '材料规范与诚信', desc: '时间线严密与雷同审查', min: 0.02, max: 0.2 }
            ].map(item => {
              const k = item.key as keyof Position['weights'];
              const currentVal = tempWeights[k];
              return (
                <div key={k} className="p-2.5 rounded bg-white/60 border border-stone-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-bold text-[#4a2817]">{item.name}</span>
                      <span className="text-[10px] text-stone-500 ml-1.5">{item.desc}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs">
                      {currentVal.toFixed(2)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    step={0.01}
                    value={currentVal}
                    onChange={e => handleSlider(k, parseFloat(e.target.value))}
                    className="w-full accent-[#8b5329] cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded border border-[#5b3117] text-xs font-serifSc hover:bg-[#eedcb1]"
            >
              重置预设
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`sd-btn-gold px-4 py-1.5 rounded text-xs font-pixel ${
                !isValid ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              保存权重配置
            </button>
          </div>
        </div>

        {/* 右侧指标档位要点 */}
        <div className="lg:col-span-7 sd-box p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="border-b border-[#5b3117]/30 pb-2 mb-3">
              <h4 className="font-bold text-sm text-[#4a2817] font-serifSc">
                档位判定标准细则表（1至5档）
              </h4>
              <p className="text-xs text-stone-600 font-serifSc">
                档位定义坚决杜绝优秀、良好等模糊形容词，以客观可核查的事实与成果为唯一定档依据
              </p>
            </div>

            {/* 指标导航切换 */}
            <div className="flex gap-1.5 mb-3 border-b border-stone-300 pb-2 overflow-x-auto text-xs font-serifSc">
              {METRIC_DEFINITIONS.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    audioEngine.play('paper');
                    setActiveMetricTab(m.id);
                  }}
                  className={`px-2.5 py-1 rounded font-bold transition-colors whitespace-nowrap ${
                    activeMetricTab === m.id
                      ? 'bg-[#5b3117] text-[#ffdf79]'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {currentMetricDef.rubric.map(item => (
                <div
                  key={item.level}
                  className="p-2.5 rounded bg-white/70 border border-stone-300 hover:border-amber-700 transition-colors text-xs font-serifSc"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {item.level} 档
                    </span>
                    <strong className="text-stone-800">{item.point}</strong>
                  </div>
                  <div className="text-stone-600 text-[11px] pl-2 border-l-2 border-amber-500 italic">
                    典型事实举证：{item.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#5b3117]/20 flex items-center justify-between text-xs text-stone-600 font-serifSc">
            <span>支持按学院实情定制模板</span>
            <span className="font-mono text-amber-900">版本号 v2.4.0</span>
          </div>
        </div>

      </div>

    </div>
  );
};

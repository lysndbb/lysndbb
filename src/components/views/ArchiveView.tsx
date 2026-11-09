import React, { useState, useMemo } from 'react';
import { Candidate } from '../../types';
import { MetricStars } from '../MetricStars';
import { audioEngine } from '../../services/audioEngine';

interface ArchiveViewProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onGoToBench: (candidate: Candidate) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  candidates,
  onSelectCandidate,
  onGoToBench
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStar, setSelectedStar] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => {
      if (c.position_name.includes('青协')) set.add('青协');
      else if (c.position_name.includes('融媒体')) set.add('融媒体中心');
      else if (c.position_name.includes('学生会')) set.add('学生会');
      else set.add('其他组织');
    });
    return Array.from(set);
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        const matchMajor = c.major.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchMajor) return false;
      }
      if (selectedDept !== 'all') {
        if (!c.position_name.includes(selectedDept)) return false;
      }
      if (selectedStar === 'iridium') {
        if (c.composite_score < 90) return false;
      } else if (selectedStar === 'gold') {
        if (c.composite_score < 85 || c.composite_score >= 90) return false;
      } else if (selectedStar === 'silver') {
        if (c.composite_score < 80 || c.composite_score >= 85) return false;
      } else if (selectedStar === 'pending') {
        if (c.status !== 'pending_review') return false;
      }
      return true;
    });
  }, [candidates, search, selectedDept, selectedStar]);

  return (
    <div className="space-y-6">
      
      {/* 隐私脱敏合规提示条 */}
      <div className="px-4 py-2 bg-[#2b1408]/80 rounded border border-[#5b2b14] text-[#ffdf79] text-xs font-serifSc flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/images/badges/shield.jpg" alt="隐私" className="w-4 h-4 rounded object-cover inline-block" />
          <span>出于隐私考虑，我们这边只放化名。所有学生学号均已规范为2026级新生编号。</span>
        </div>
        <span className="font-mono text-[10px] text-[#eedcb1]/60">2026级新生干部选拔</span>
      </div>
      
      {/* 顶部控制面板 */}
      <div className="sd-box p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名、学号或班级"
            className="px-3 py-1.5 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] placeholder-stone-400 focus:outline-none w-48 font-serifSc"
          />

          <select
            value={selectedDept}
            onChange={e => {
              audioEngine.play('click');
              setSelectedDept(e.target.value);
            }}
            className="px-2.5 py-1.5 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] focus:outline-none font-serifSc"
          >
            <option value="all">全部组织机构</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedStar}
            onChange={e => {
              audioEngine.play('click');
              setSelectedStar(e.target.value);
            }}
            className="px-2.5 py-1.5 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] focus:outline-none font-serifSc"
          >
            <option value="all">全品级筛选</option>
            <option value="iridium">铱星极优 (90分以上)</option>
            <option value="gold">金星拔尖 (85-89.9分)</option>
            <option value="silver">银星良好 (80-84.9分)</option>
            <option value="pending">待人工复核名单</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-600 font-serifSc">
            共载入 <strong className="text-[#5b3117] font-mono">{filteredCandidates.length}</strong> 份申报档案
          </span>
          <div className="inline-flex rounded border border-[#5b3117] overflow-hidden">
            <button
              onClick={() => {
                audioEngine.play('paper');
                setViewMode('table');
              }}
              className={`px-3 py-1 text-xs font-serifSc ${
                viewMode === 'table'
                  ? 'bg-[#5b3117] text-[#ffdf79] font-bold'
                  : 'bg-[#fbf2d5] text-[#5b3117] hover:bg-[#eedcb1]'
              }`}
            >
              名册总表
            </button>
            <button
              onClick={() => {
                audioEngine.play('paper');
                setViewMode('cards');
              }}
              className={`px-3 py-1 text-xs font-serifSc ${
                viewMode === 'cards'
                  ? 'bg-[#5b3117] text-[#ffdf79] font-bold'
                  : 'bg-[#fbf2d5] text-[#5b3117] hover:bg-[#eedcb1]'
              }`}
            >
              卡片陈列
            </button>
          </div>
        </div>
      </div>

      {/* 表格视图 */}
      {viewMode === 'table' ? (
        <div className="sd-box rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#381a0b] text-[#fbf2d5] border-b-2 border-[#d49b55] font-serifSc">
                <tr>
                  <th className="py-2.5 px-3">排位</th>
                  <th className="py-2.5 px-3">候选人</th>
                  <th className="py-2.5 px-3">学号班级</th>
                  <th className="py-2.5 px-3">申报岗位</th>
                  <th className="py-2.5 px-3 text-center">材料初审</th>
                  <th className="py-2.5 px-3 text-center">现场面试</th>
                  <th className="py-2.5 px-3 text-center">综合总分</th>
                  <th className="py-2.5 px-3">星露谷品质评级</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5b3117]/20 font-serifSc text-stone-800">
                {filteredCandidates.map((c, index) => {
                  const isExpanded = expandedId === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <tr 
                        className={`hover:bg-amber-100/60 transition-colors ${
                          c.status === 'pending_review' ? 'bg-red-50/50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                          #{index + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#4a2817]">
                          <span 
                            onClick={() => {
                              audioEngine.play('paper');
                              onSelectCandidate(c);
                            }}
                            className="cursor-pointer hover:underline hover:text-amber-800"
                          >
                            {c.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 font-mono">
                          {c.id} · {c.major}
                        </td>
                        <td className="py-2.5 px-3 text-stone-700">
                          {c.position_name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#8b5329]">
                          {c.material_score}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-700">
                          {c.interview_score}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-purple-900">
                          {c.composite_score}
                        </td>
                        <td className="py-2.5 px-3">
                          <MetricStars 
                            score={c.composite_score} 
                            isPendingReview={c.status === 'pending_review'} 
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              audioEngine.play('click');
                              setExpandedId(isExpanded ? null : c.id);
                            }}
                            className="px-2 py-0.5 rounded border border-[#5b3117] bg-[#eedcb1] text-[#381f13] hover:bg-[#ffdf79]"
                          >
                            {isExpanded ? '收起' : '指标明细'}
                          </button>
                          <button
                            onClick={() => {
                              audioEngine.play('paper');
                              onSelectCandidate(c);
                            }}
                            className="px-2 py-0.5 rounded border border-amber-600 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold"
                          >
                            证据链
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-amber-50/90 border-y border-[#5b3117]/30">
                          <td colSpan={9} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs">
                              {(['m1', 'm2', 'm3', 'm4', 'm5'] as const).map(k => {
                                const labels: Record<string, string> = {
                                  m1: '德育思政',
                                  m2: '学业学术',
                                  m3: '学干履历',
                                  m4: '胜任设想',
                                  m5: '诚信规范'
                                };
                                const metric = c.metrics[k];
                                return (
                                  <div key={k} className="p-2.5 rounded bg-white/80 border border-stone-300">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-stone-700">{labels[k]}</span>
                                      <span className="font-mono font-bold text-amber-800">{metric.level} 档</span>
                                    </div>
                                    <p className="text-[11px] text-stone-600 line-clamp-2 italic mb-1">
                                      {metric.evidence}
                                    </p>
                                    <span className="text-[10px] text-stone-400 font-mono">
                                      置信度 {(metric.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map(c => (
            <div
              key={c.id}
              className="sd-box p-4 rounded-lg flex flex-col justify-between hover:translate-y-[-2px] transition-all cursor-pointer group"
              onClick={() => {
                audioEngine.play('paper');
                onSelectCandidate(c);
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-[#4a2817] group-hover:text-amber-800 transition-colors">
                    {c.name}
                  </h4>
                  <MetricStars score={c.composite_score} isPendingReview={c.status === 'pending_review'} />
                </div>

                <p className="text-xs text-stone-600 font-mono mb-1">
                  学号 {c.id} · {c.major}
                </p>
                <p className="text-xs text-stone-800 font-serifSc mb-3 line-clamp-1">
                  申报：{c.position_name}
                </p>

                <div className="p-2 rounded bg-amber-50 border border-amber-200 mb-3 text-xs">
                  <div className="flex items-center justify-between text-stone-600 mb-1">
                    <span>材料评档得分</span>
                    <strong className="text-[#8b5329] font-mono">{c.material_score}</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-600 mb-1">
                    <span>现场面试折算</span>
                    <strong className="text-stone-800 font-mono">{c.interview_score}</strong>
                  </div>
                  <div className="flex items-center justify-between font-bold text-purple-900 border-t border-amber-200 pt-1">
                    <span>综合总成绩</span>
                    <span className="font-mono text-sm">{c.composite_score}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#5b3117]/20 text-xs">
                <span className="text-stone-500 font-serifSc">点击调阅五维档案</span>
                <span className="text-amber-800 font-bold group-hover:translate-x-1 transition-transform">
                  查看证据链 →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

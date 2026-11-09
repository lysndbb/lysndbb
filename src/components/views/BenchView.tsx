import React, { useState } from 'react';
import { Candidate, AuditLog, MetricLevel } from '../../types';
import { audioEngine } from '../../services/audioEngine';

interface BenchViewProps {
  candidates: Candidate[];
  auditLogs: AuditLog[];
  onUpdateCandidate: (updated: Candidate) => void;
  onAddAuditLog: (log: AuditLog) => void;
  preSelectedCandidateId?: string | null;
}

export const BenchView: React.FC<BenchViewProps> = ({
  candidates,
  auditLogs,
  onUpdateCandidate,
  onAddAuditLog,
  preSelectedCandidateId
}) => {
  const pendingCandidates = candidates.filter(c => c.status === 'pending_review');
  const allCandidates = candidates;

  const [selectedId, setSelectedId] = useState<string>(
    preSelectedCandidateId || pendingCandidates[0]?.id || candidates[0]?.id || ''
  );

  const selectedCandidate = allCandidates.find(c => c.id === selectedId) || allCandidates[0];

  const [overrideMetric, setOverrideMetric] = useState<'m1' | 'm2' | 'm3' | 'm4' | 'm5'>('m3');
  const [newLevel, setNewLevel] = useState<MetricLevel>(
    selectedCandidate ? selectedCandidate.metrics.m3.level : 3
  );
  const [reason, setReason] = useState('');
  const [operator, setOperator] = useState('辅导员_刘老师');

  const handleSelectCandidate = (id: string) => {
    audioEngine.play('paper');
    setSelectedId(id);
    const target = allCandidates.find(c => c.id === id);
    if (target) {
      setNewLevel(target.metrics[overrideMetric].level);
    }
    setReason('');
  };

  const handleMetricTab = (m: 'm1' | 'm2' | 'm3' | 'm4' | 'm5') => {
    audioEngine.play('click');
    setOverrideMetric(m);
    if (selectedCandidate) {
      setNewLevel(selectedCandidate.metrics[m].level);
    }
  };

  const handleSubmitAdjudication = () => {
    if (!selectedCandidate) return;
    if (!reason.trim()) {
      alert('必须录入人工改档理由 方可确认提交');
      return;
    }

    audioEngine.play('levelup');

    const oldLevel = selectedCandidate.metrics[overrideMetric].level;
    const updatedCandidate: Candidate = {
      ...selectedCandidate,
      status: 'completed',
      review_reason: null,
      metrics: {
        ...selectedCandidate.metrics,
        [overrideMetric]: {
          ...selectedCandidate.metrics[overrideMetric],
          level: newLevel,
          reason: `人工复核改判：${reason.trim()}`
        }
      }
    };

    // 重新严谨计算分数
    const w = { m1: 0.25, m2: 0.15, m3: 0.30, m4: 0.25, m5: 0.05 };
    const m = updatedCandidate.metrics;
    const ratioSum = (m.m1.level / 5) * w.m1 +
                     (m.m2.level / 5) * w.m2 +
                     (m.m3.level / 5) * w.m3 +
                     (m.m4.level / 5) * w.m4 +
                     (m.m5.level / 5) * w.m5;
    updatedCandidate.material_score = parseFloat((ratioSum * 100).toFixed(1));
    const alpha = 0.4;
    updatedCandidate.composite_score = parseFloat(
      (alpha * updatedCandidate.interview_score + (1 - alpha) * updatedCandidate.material_score).toFixed(1)
    );

    onUpdateCandidate(updatedCandidate);

    const logEntry: AuditLog = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      operator,
      action: '人工改判定档',
      targetStudentId: selectedCandidate.id,
      targetStudentName: selectedCandidate.name,
      metricId: overrideMetric,
      oldLevel,
      newLevel,
      reason: reason.trim(),
      verified: true
    };
    onAddAuditLog(logEntry);

    setReason('');
  };

  const metricNames: Record<string, string> = {
    m1: '思想政治与品德',
    m2: '学业表现',
    m3: '学生工作经历',
    m4: '岗位匹配能力',
    m5: '材料规范与诚信'
  };

  return (
    <div className="space-y-6">
      
      {/* 顶部指引 */}
      <div className="sd-box p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <img src="/images/badges/scales.jpg" alt="复核天平" className="w-7 h-7 rounded border-2 border-[#8b5329] object-cover shadow" />
            <h3 className="font-serifSc font-bold text-base text-[#4a2817]">
              复核仲裁法庭与审计留痕
            </h3>
          </div>
          <p className="text-xs text-stone-600 font-serifSc">
            将最终决定权保留在复核人手中，改档必填依据，全过程日志上链存证，应对学生申诉
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-serifSc">
          <span className="text-stone-600">当前复核执行官：</span>
          <input
            type="text"
            value={operator}
            onChange={e => setOperator(e.target.value)}
            className="px-2 py-1 rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] w-32 font-bold"
          />
        </div>
      </div>

      {/* 主体左右三栏排布：待复核候选人列表、改判操作面板、原文比对与日志 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 左侧：待复核候选人名册 */}
        <div className="lg:col-span-3 sd-box p-3 rounded-lg space-y-2">
          <h4 className="font-bold text-xs text-[#4a2817] font-serifSc border-b border-[#5b3117]/30 pb-1.5 flex items-center justify-between">
            <span>待复核争议样本</span>
            <span className="px-1.5 py-0.2 bg-red-100 text-red-800 rounded font-mono text-[10px] font-bold">
              {pendingCandidates.length} 项
            </span>
          </h4>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {pendingCandidates.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-500 font-serifSc">
                ✦ 当前暂无待复核争议样本 · 档案全部归档核准 ✦
              </div>
            ) : (
              pendingCandidates.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCandidate(c.id)}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                    selectedId === c.id
                      ? 'bg-[#5b3117] text-[#ffdf79] border-[#f6b262] font-bold shadow-pixel-sm'
                      : 'bg-white/70 border-stone-300 hover:bg-amber-100/60 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>{c.name}</span>
                    <span className="font-mono text-[10px]">{c.id}</span>
                  </div>
                  <p className="text-[10px] opacity-80 truncate">
                    {c.review_reason || '触发双评仲裁线'}
                  </p>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-stone-300">
              <span className="text-[11px] font-bold text-stone-600 block mb-1">
                全部候选人快速检索：
              </span>
              <select
                value={selectedId}
                onChange={e => handleSelectCandidate(e.target.value)}
                className="w-full p-1.5 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13]"
              >
                {allCandidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id}) - {c.status === 'pending_review' ? '待复核' : '已完成'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 中间：改档裁定面板 */}
        <div className="lg:col-span-5 sd-box p-4 rounded-lg flex flex-col justify-between space-y-3">
          {selectedCandidate ? (
            <div>
              <div className="border-b border-[#5b3117]/30 pb-2 mb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#4a2817] font-serifSc">
                    {selectedCandidate.name} · 档位复核裁定
                  </h4>
                  <span className="text-xs text-stone-600 font-serifSc">
                    {selectedCandidate.position_name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 block font-serifSc">现初审分</span>
                  <span className="font-mono font-bold text-base text-[#8b5329]">
                    {selectedCandidate.material_score}
                  </span>
                </div>
              </div>

              {/* 指标切换 */}
              <div className="flex gap-1 mb-3 overflow-x-auto text-xs font-serifSc">
                {(['m1', 'm2', 'm3', 'm4', 'm5'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => handleMetricTab(k)}
                    className={`px-2 py-1 rounded font-bold whitespace-nowrap ${
                      overrideMetric === k
                        ? 'bg-[#8b5329] text-[#ffdf79]'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {metricNames[k]} ({selectedCandidate.metrics[k].level}档)
                  </button>
                ))}
              </div>

              {/* 当前指标AI初审证据 */}
              <div className="p-3 rounded bg-amber-50 border border-amber-300 text-xs mb-3 font-serifSc">
                <span className="font-bold text-amber-900 block mb-1">
                  AI智能体原提取证据：
                </span>
                <p className="text-stone-800 italic mb-2 select-all">
                  {selectedCandidate.metrics[overrideMetric].evidence}
                </p>
                <div className="text-[11px] text-stone-600">
                  原判定理由：{selectedCandidate.metrics[overrideMetric].reason}
                </div>
              </div>

              {/* 档位修改选择 */}
              <div className="mb-3">
                <label className="block text-xs font-bold text-stone-800 mb-1 font-serifSc">
                  调整为目标档位（1至5档）：
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        audioEngine.play('click');
                        setNewLevel(lvl);
                      }}
                      className={`py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                        newLevel === lvl
                          ? 'bg-[#5b3117] text-[#ffdf79] border-[#f6b262] shadow-pixel-sm'
                          : 'bg-white border-stone-300 text-stone-700 hover:bg-amber-100'
                      }`}
                    >
                      {lvl} 档
                    </button>
                  ))}
                </div>
              </div>

              {/* 改判理由必填框 */}
              <div>
                <div className="flex items-center justify-between mb-1 text-xs font-serifSc">
                  <label className="font-bold text-stone-800">
                    改判理由与佐证说明（必填项）：
                  </label>
                  <span className="text-[10px] text-red-700">理由为空时禁用提交</span>
                </div>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="例如：经人工核查学生提交的青协工时认证盖章证明，其骨干服务确实满一年，符合4档标准..."
                  rows={4}
                  className="w-full p-2.5 text-xs font-serifSc rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] placeholder-stone-400 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-stone-500">请选择候选人</div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSubmitAdjudication}
              disabled={!reason.trim()}
              className={`w-full sd-btn-gold py-2 rounded text-xs font-pixel shadow-pixel ${
                !reason.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              签署仲裁决定并存入审计日志
            </button>
          </div>
        </div>

        {/* 右侧：申报原文对照与历史审计留痕 */}
        <div className="lg:col-span-4 sd-box p-4 rounded-lg flex flex-col justify-between space-y-3">
          <div>
            <h4 className="font-bold text-xs text-[#4a2817] font-serifSc border-b border-[#5b3117]/30 pb-1.5 mb-2">
              人工复核不可篡改操作日志
            </h4>

            <div className="space-y-2 max-h-80 overflow-y-auto text-xs font-serifSc">
              {auditLogs.length === 0 ? (
                <div className="p-3 text-center text-stone-500">
                  暂无改档审计操作记录
                </div>
              ) : (
                auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-white/70 border border-stone-300 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-stone-600 mb-1">
                      <span className="font-bold text-[#4a2817]">{log.operator}</span>
                      <span className="font-mono text-stone-400">{log.timestamp}</span>
                    </div>
                    <div className="text-stone-800 mb-1">
                      将 <strong>{log.targetStudentName}</strong> 的 <strong>{metricNames[log.metricId] || log.metricId}</strong> 从 {log.oldLevel}档 调整为 <strong>{log.newLevel}档</strong>
                    </div>
                    <p className="text-stone-500 italic bg-amber-50 p-1.5 rounded">
                      理由：{log.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#5b3117]/20 text-[11px] text-stone-500 font-serifSc">
            满足《深化新时代教育评价改革总体方案》全流程可溯源规范
          </div>
        </div>

      </div>

    </div>
  );
};

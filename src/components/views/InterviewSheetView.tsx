import React, { useMemo, useState } from 'react';
import { Candidate, MetricLevel, Position } from '../../types';
import { audioEngine } from '../../services/audioEngine';
import { METRIC_CATALOG } from '../../data/metricCatalog';

interface InterviewSheetViewProps {
  candidates: Candidate[];
  positions: Position[];
  onUpdateCandidate: (c: Candidate) => void;
}

const LEVEL_TONE: Record<number, string> = {
  1: 'border-[#a93226] bg-[#fdecea] text-[#a93226]',
  2: 'border-[#c47b2a] bg-[#fdf1e0] text-[#8a4f0d]',
  3: 'border-[#b08a2a] bg-[#fbf6dd] text-[#6f5510]',
  4: 'border-[#487332] bg-[#eaf5e1] text-[#2f5121]',
  5: 'border-[#2f5121] bg-[#d8ecd0] text-[#1f3a14]'
};

export const InterviewSheetView: React.FC<InterviewSheetViewProps> = ({
  candidates,
  positions,
  onUpdateCandidate
}) => {
  // 默认落在「有申报档案」的岗位上，避免岗位与候选人不匹配
  const defaultPositionId = useMemo(() => {
    const withApplicants = positions.find(p => candidates.some(c => c.position_id === p.id));
    return withApplicants?.id ?? positions[0]?.id ?? '';
  }, [candidates, positions]);
  const [positionId, setPositionId] = useState(defaultPositionId);
  const position = positions.find(p => p.id === positionId) ?? positions[0];

  const pool = useMemo(
    () => candidates.filter(c => c.position_id === positionId),
    [candidates, positionId]
  );
  const [candidateId, setCandidateId] = useState(pool[0]?.id ?? candidates[0]?.id ?? '');
  const candidate = candidates.find(c => c.id === candidateId) ?? pool[0] ?? candidates[0];

  const [levels, setLevels] = useState<Record<string, MetricLevel | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>('m3');
  const [submitted, setSubmitted] = useState<{ total: number; composite: number } | null>(null);

  const given = METRIC_CATALOG.filter(m => levels[m.id]).length;
  const allGiven = given === METRIC_CATALOG.length;

  const interviewScore = useMemo(() => {
    const sum = METRIC_CATALOG.reduce(
      (s, m) => s + m.weight * ((levels[m.id] ?? 0) / 5),
      0
    );
    return Math.round(sum * 1000) / 10;
  }, [levels]);

  const alpha = position?.alpha ?? 0.4;
  const composite = candidate
    ? Math.round((alpha * interviewScore + (1 - alpha) * candidate.material_score) * 10) / 10
    : 0;

  const pick = (c: Candidate) => {
    audioEngine.play('click');
    setCandidateId(c.id);
    setLevels({});
    setNotes({});
    setSubmitted(null);
  };

  const submit = () => {
    if (!candidate || !allGiven) return;
    const mergedNotes = METRIC_CATALOG.map(m => {
      const note = (notes[m.id] || '').trim();
      return note ? `${m.short}：${note}` : '';
    })
      .filter(Boolean)
      .join('；');
    onUpdateCandidate({
      ...candidate,
      interview_score: interviewScore,
      composite_score: composite,
      interview_notes: mergedNotes || candidate.interview_notes
    });
    audioEngine.play('levelup');
    setSubmitted({ total: interviewScore, composite });
  };

  if (!candidate) {
    return (
      <div className="sd-box rounded-lg p-6 text-center font-serifSc text-xs text-stone-500">
        当前没有可评分的候选人，请先在「申报材料」中导入材料。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 顶部：选择与进度 */}
      <div className="sd-box rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded border border-[#d49b55] bg-[#4a2411] px-2 py-0.5 font-mono text-[10px] text-[#ffdf79]">
                [05]
              </span>
              <h3 className="font-serifSc text-base font-black text-[#3d1c0b]">面试评分表</h3>
              <span className="font-serifSc text-[10.5px] text-stone-500">
                面试官逐项给档 · 与材料评判共用同一套档位定义
              </span>
            </div>
            <p className="font-serifSc text-xs text-stone-600">
              提交后按式(1)折算面试分，再按 S总 = α·S面 + (1-α)·S材 合成综合分；提交后 24 小时内可补填现场记录
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-serifSc text-[11px] text-stone-700">
              岗位
              <select
                value={positionId}
                onChange={e => {
                  audioEngine.play('paper');
                  setPositionId(e.target.value);
                  const next = candidates.find(c => c.position_id === e.target.value);
                  setCandidateId(next?.id ?? '');
                  setLevels({});
                  setNotes({});
                  setSubmitted(null);
                }}
                className="rounded border border-[#5b3117] bg-[#fbf2d5] px-2 py-1 font-serifSc text-[11px] font-bold text-[#381f13] focus:outline-none"
              >
                {positions.map(p => {
                  const count = candidates.filter(c => c.position_id === p.id).length;
                  return (
                    <option key={p.id} value={p.id} disabled={count === 0}>
                      {p.name}
                      {count > 0 ? ` · ${count} 人申报` : ' · 暂无申报'}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="flex items-center gap-1.5 font-serifSc text-[11px] text-stone-700">
              候选人
              <select
                value={candidateId}
                onChange={e => {
                  const c = candidates.find(x => x.id === e.target.value);
                  if (c) pick(c);
                }}
                className="rounded border border-[#5b3117] bg-[#fbf2d5] px-2 py-1 font-serifSc text-[11px] font-bold text-[#381f13] focus:outline-none"
              >
                {(pool.length ? pool : candidates).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}（{c.id}）
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[#5b3117]/20 pt-2">
          <span className="font-serifSc text-[11px] text-stone-700">
            {candidate.name} · {candidate.major} · {candidate.position_name}
          </span>
          <span className="rounded bg-[#eedcb1] px-1.5 py-0.5 font-mono text-[10px] text-[#5b2b14]">
            材料分 {candidate.material_score}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
              allGiven ? 'bg-[#eaf5e1] text-[#2f5121]' : 'bg-red-50 text-[#a93226]'
            }`}
          >
            已给档 {given}/5
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-[#8b5329]/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d49b55] to-[#5b2b14] transition-all duration-500"
                style={{ width: `${(given / 5) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-stone-500">{Math.round((given / 5) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* 评分表主体 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-2.5 lg:col-span-8">
          {METRIC_CATALOG.map((m, idx) => {
            const level = levels[m.id];
            const open = expanded === m.id;
            return (
              <div
                key={m.id}
                className={`sd-box anim-fade-up rounded-lg p-3 transition-shadow ${
                  level ? 'ring-1 ring-[#487332]/40' : 'ring-1 ring-[#a93226]/25'
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[#5b2b14] font-mono text-[10px] text-[#ffdf79]">
                    {idx + 1}
                  </span>
                  <span className="font-serifSc text-xs font-bold text-[#4a2817]">{m.name}</span>
                  <span className="rounded bg-[#eedcb1] px-1.5 py-0.5 font-mono text-[9px] text-[#5b2b14]">
                    权重 {(m.weight * 100).toFixed(0)}%
                  </span>
                  {!level && (
                    <span className="animate-pulse rounded border border-[#a93226]/50 bg-red-50 px-1.5 py-0.5 font-serifSc text-[9px] text-[#a93226]">
                      未给档
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(lv => {
                      const on = level === lv;
                      return (
                        <button
                          key={lv}
                          onClick={() => {
                            audioEngine.play('click');
                            setLevels(prev => ({ ...prev, [m.id]: lv as MetricLevel }));
                            setSubmitted(null);
                          }}
                          title={m.anchors[lv - 1]}
                          className={`h-7 w-8 rounded border font-mono text-[11px] transition-all ${
                            on
                              ? `${LEVEL_TONE[lv]} scale-105 font-bold shadow-pixel-sm`
                              : 'border-[#8b5329]/35 bg-[#fbf2d5] text-[#8b5329] hover:-translate-y-0.5 hover:border-[#5b2b14]'
                          }`}
                        >
                          {lv}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-1.5 flex items-start gap-2">
                  <p className="flex-1 font-serifSc text-[10.5px] leading-relaxed text-stone-600">
                    <span className="font-bold text-[#5b2b14]">观察要点：</span>
                    {m.interviewFocus}
                  </p>
                  <button
                    onClick={() => {
                      audioEngine.play('click');
                      setExpanded(open ? null : m.id);
                    }}
                    className="shrink-0 rounded border border-[#8b5329]/40 px-1.5 py-0.5 font-serifSc text-[9.5px] text-[#5b2b14] hover:bg-[#eedcb1]"
                  >
                    {open ? '收起档位 ▲' : '档位定义 ▼'}
                  </button>
                </div>

                {open && (
                  <div className="anim-fade-in mt-2 grid grid-cols-1 gap-1 sm:grid-cols-5">
                    {m.anchors.map((a, i) => (
                      <div
                        key={i}
                        className={`rounded border px-1.5 py-1 font-serifSc text-[9px] leading-snug ${
                          level === i + 1
                            ? LEVEL_TONE[i + 1]
                            : 'border-[#8b5329]/25 bg-white/50 text-stone-600'
                        }`}
                      >
                        <div className="mb-0.5 font-mono font-bold">{i + 1} 档</div>
                        {a}
                      </div>
                    ))}
                  </div>
                )}

                <input
                  value={notes[m.id] || ''}
                  onChange={e => setNotes(prev => ({ ...prev, [m.id]: e.target.value }))}
                  placeholder="现场记录（选填，一句话即可，如：举例完整、数据可查）"
                  className="mt-2 w-full rounded border border-[#8b5329]/45 bg-white/80 px-2 py-1 font-serifSc text-[10.5px] text-[#381f13] placeholder-stone-400 focus:border-[#b06a10] focus:outline-none"
                />
              </div>
            );
          })}
        </div>

        {/* 右侧折算与提交 */}
        <div className="space-y-3 lg:col-span-4">
          <div className="sd-box sticky top-[70px] rounded-lg p-3">
            <h4 className="mb-2 flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
              <span className="h-3 w-1 bg-[#8b5329]" />
              分数折算预览
            </h4>
            <div className="space-y-1.5">
              <ScoreRow label="面试得分 S面" value={interviewScore} tone="text-[#8b5329]" hint="式(1)：100×Σ(wᵢ×Lᵢ/5)" />
              <ScoreRow label="材料得分 S材" value={candidate.material_score} tone="text-stone-700" hint="来自材料初审，已存档" />
              <div className="rounded border border-[#5b2b14]/40 bg-[#eedcb1]/60 px-2 py-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-serifSc text-[10.5px] text-[#5b2b14]">综合总分 S总</span>
                  <span className="font-mono text-xl font-black text-purple-900">{composite}</span>
                </div>
                <div className="font-mono text-[9px] text-stone-600">
                  α={alpha} · {alpha}×{interviewScore} + {(1 - alpha).toFixed(1)}×{candidate.material_score}
                </div>
              </div>
            </div>

            {!allGiven && (
              <div className="mt-2 rounded border border-[#a93226]/40 bg-red-50 px-2 py-1.5 font-serifSc text-[10px] text-[#a93226]">
                还有 {5 - given} 项未给档，提交按钮不可用。未给档的指标不允许按平均分补齐。
              </div>
            )}

            <button
              onClick={submit}
              disabled={!allGiven}
              className={`mt-2.5 w-full rounded px-3 py-1.5 font-serifSc text-xs font-bold transition-all ${
                allGiven
                  ? 'sd-btn-gold'
                  : 'cursor-not-allowed border border-stone-300 bg-stone-200 text-stone-400'
              }`}
            >
              {allGiven ? '提交评分表并写入档案' : '请先完成 5 项给档'}
            </button>

            {submitted && (
              <div className="anim-pop-in mt-2 rounded border-2 border-[#487332] bg-[#eaf5e1] px-2 py-1.5 font-serifSc text-[10.5px] text-[#2f5121]">
                <div className="font-bold">✓ 评分表已归档</div>
                <div>
                  {candidate.name} 面试分 {submitted.total} · 综合分 {submitted.composite}，已同步至评判总览与凭据导出。
                </div>
              </div>
            )}

            <div className="mt-2 space-y-1 border-t border-[#5b3117]/20 pt-2 font-serifSc text-[9.5px] leading-relaxed text-stone-500">
              <p>· 评分表与材料评判共用同一套档位定义，档位相差 2 档以上自动进入复核队列。</p>
              <p>· 提交后 24 小时内可补填现场记录，超时由复核人代填并标注来源。</p>
              <p>· 现场转写稿仅在征得学生同意后使用，只用于给档。</p>
            </div>
          </div>

          <div className="sd-box rounded-lg p-3">
            <h4 className="mb-1.5 font-serifSc text-xs font-bold text-[#4a2817]">待评分候选人</h4>
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {(pool.length ? pool : candidates).slice(0, 12).map(c => (
                <button
                  key={c.id}
                  onClick={() => pick(c)}
                  className={`flex w-full items-center gap-1.5 rounded border px-2 py-1 text-left transition-colors ${
                    c.id === candidateId
                      ? 'border-[#d49b55] bg-[#5b2b14] text-[#ffdf79]'
                      : 'border-[#8b5329]/25 bg-[#fbf2d5] text-stone-700 hover:bg-[#eedcb1]'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eedcb1] font-serifSc text-[9px] text-[#8b5329]">
                    {c.name.slice(0, 1)}
                  </span>
                  <span className="truncate font-serifSc text-[10.5px]">{c.name}</span>
                  <span className="ml-auto font-mono text-[9px] opacity-70">{c.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreRow: React.FC<{ label: string; value: number; tone: string; hint: string }> = ({
  label,
  value,
  tone,
  hint
}) => (
  <div className="flex items-center justify-between rounded border border-[#8b5329]/25 bg-white/60 px-2 py-1">
    <div>
      <div className="font-serifSc text-[10.5px] text-stone-700">{label}</div>
      <div className="font-mono text-[9px] text-stone-400">{hint}</div>
    </div>
    <span className={`font-mono text-base font-bold ${tone}`}>{value}</span>
  </div>
);

export default InterviewSheetView;

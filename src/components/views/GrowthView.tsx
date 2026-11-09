import React, { useMemo, useState } from 'react';
import { Candidate, ResourceItem } from '../../types';
import { HDU_RESOURCES } from '../../data/mockData';
import { audioEngine } from '../../services/audioEngine';
import { METRIC_CATALOG } from '../../data/metricCatalog';

interface GrowthViewProps {
  candidates: Candidate[];
}

const POLICIES = [
  {
    id: 'p1',
    name: '《“人工智能+教育”行动计划》（2026）',
    quote: '推动智能技术全场景覆盖，强化过程性评价与个性化培养，让评价回到成长过程之中。'
  },
  {
    id: 'p2',
    name: '《深化新时代教育评价改革总体方案》（2020）',
    quote: '改进结果评价，强化过程评价，探索增值评价，健全综合评价。'
  },
  {
    id: 'p3',
    name: '《中国教育现代化2035》',
    quote: '因材施教，促进全面发展与个性发展相统一，为每个学生提供适合的教育。'
  }
];

const BASELINE = 4; // 岗位胜任基线档位

/* 五维雷达图 */
const RadarChart: React.FC<{ values: number[]; baseline: number; labels: string[] }> = ({
  values,
  baseline,
  labels
}) => {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2 - 4;
  const r = 88;
  const angle = (i: number) => (Math.PI * 2 * i) / values.length - Math.PI / 2;
  const point = (i: number, v: number) => {
    const rad = (v / 5) * r;
    return [cx + Math.cos(angle(i)) * rad, cy + Math.sin(angle(i)) * rad];
  };
  const polygon = (vals: number[]) =>
    vals
      .map((v, i) => point(i, v))
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px]">
      {[1, 2, 3, 4, 5].map(ring => (
        <polygon
          key={ring}
          points={polygon(new Array(values.length).fill(ring))}
          fill={ring === 5 ? 'rgba(238,220,177,0.35)' : 'none'}
          stroke="rgba(139,83,41,0.22)"
          strokeWidth={ring === 5 ? 1.4 : 0.8}
        />
      ))}
      {values.map((_, i) => {
        const [x, y] = point(i, 5);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(139,83,41,0.25)" strokeWidth={0.9} />;
      })}

      {/* 岗位基线 */}
      <polygon
        points={polygon(new Array(values.length).fill(baseline))}
        fill="rgba(72,115,50,0.09)"
        stroke="#487332"
        strokeWidth={1.4}
        strokeDasharray="4 3"
      />

      {/* 学生画像 */}
      <polygon
        className="sd-radar-line"
        points={polygon(values)}
        fill="rgba(200,134,42,0.28)"
        stroke="#8b4a12"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const [x, y] = point(i, v);
        return <circle key={i} cx={x} cy={y} r={3.4} fill="#5b2b14" stroke="#ffdf79" strokeWidth={1.2} />;
      })}

      {labels.map((l, i) => {
        const [x, y] = point(i, 5.85);
        return (
          <text
            key={l}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#5b2b14"
            fontWeight="700"
          >
            {l}
          </text>
        );
      })}
    </svg>
  );
};

export const GrowthView: React.FC<GrowthViewProps> = ({ candidates }) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidates[0]?.id || '');
  const candidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  const [counselorNote, setCounselorNote] = useState(
    '该生集体荣誉感强、踏实负责，交代的事能落地；但在多部门交叉协作和突发压力下的应变还需打磨，公开表达偏保守。'
  );
  const [studentWish, setStudentWish] = useState(
    '希望能在志愿公益项目孵化和校外赞助谈判中获得更多导师指引，也想尝试牵头一次跨部门活动。'
  );
  const [policyId, setPolicyId] = useState('p2');
  const [attended, setAttended] = useState<string[]>([]);
  const [generatedAt] = useState(() => new Date().toLocaleDateString('zh-CN'));

  const policy = POLICIES.find(p => p.id === policyId) ?? POLICIES[0];

  const gaps = useMemo(
    () =>
      METRIC_CATALOG.map(meta => {
        const current = candidate?.metrics[meta.id].level ?? 3;
        return { meta, current, gap: Math.max(0, BASELINE - current) };
      }).sort((a, b) => b.gap - a.gap || b.meta.weight - a.meta.weight),
    [candidate]
  );

  const matchedResources = useMemo(() => {
    const list = HDU_RESOURCES.filter(r => gaps.some(g => g.meta.id === r.targetMetric && g.gap > 0));
    return list.sort((a, b) => {
      const ga = gaps.find(g => g.meta.id === a.targetMetric)?.gap ?? 0;
      const gb = gaps.find(g => g.meta.id === b.targetMetric)?.gap ?? 0;
      return gb - ga;
    });
  }, [gaps]);

  const activeResources = matchedResources.filter(r => !attended.includes(r.id));
  const fullMarks = gaps.filter(g => g.gap === 0);

  const toggleAttended = (id: string) => {
    audioEngine.play('click');
    setAttended(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-5">
      {/* 顶部 */}
      <div className="sd-box anim-fade-up rounded-lg p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded border border-[#d49b55] bg-[#4a2411] px-2 py-0.5 font-mono text-[10px] text-[#ffdf79]">
                [03]
              </span>
              <h3 className="font-serifSc text-base font-black text-[#3d1c0b]">学生能力发展与因材施教规划</h3>
              <span className="font-serifSc text-[10.5px] text-stone-500">
                四类材料 → 学生画像 → 一页纸培养方案
              </span>
            </div>
            <p className="font-serifSc text-xs text-stone-600">
              输入学生档案、辅导员描述、学生期望与政策导向，系统按档位缺口生成可执行的行动清单
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-serifSc text-[11px] text-stone-700">
              调阅学生档案
              <select
                value={selectedCandidateId}
                onChange={e => {
                  audioEngine.play('paper');
                  setSelectedCandidateId(e.target.value);
                  setAttended([]);
                }}
                className="rounded border border-[#5b3117] bg-[#fbf2d5] px-2 py-1 font-serifSc text-[11px] font-bold text-[#381f13] focus:outline-none"
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}（{c.id}）
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* 左：四类输入 */}
        <div className="space-y-4 lg:col-span-5">
          <div className="sd-box anim-fade-up rounded-lg p-3.5">
            <h4 className="mb-2 flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
              <span className="h-3 w-1 bg-[#8b5329]" />
              四类材料输入
            </h4>

            <div className="space-y-3">
              {/* 1 学生档案 */}
              <div className="rounded border border-[#8b5329]/30 bg-white/60 p-2">
                <div className="mb-1 flex items-center gap-1.5">
                  <Badge n="1" label="学生档案（自动调取）" />
                  <span className="ml-auto font-mono text-[9px] text-stone-400">
                    {candidate.interview_score} / {candidate.material_score} / {candidate.composite_score}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {METRIC_CATALOG.map(m => (
                    <div key={m.id} className="rounded bg-[#eedcb1]/60 px-1 py-0.5 text-center">
                      <div className="font-serifSc text-[9px] text-stone-600">{m.short}</div>
                      <div className="font-mono text-[11px] font-bold text-[#5b2b14]">
                        {candidate.metrics[m.id].level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 辅导员描述 */}
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <Badge n="2" label="辅导员描述" />
                  <span className="font-serifSc text-[9px] text-stone-500">写入前需辅导员确认，学生可见</span>
                </div>
                <textarea
                  value={counselorNote}
                  onChange={e => setCounselorNote(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-[#5b3117] bg-[#fbf2d5] px-2 py-1.5 font-serifSc text-[11px] leading-relaxed text-[#381f13] focus:outline-none"
                />
              </div>

              {/* 3 学生期望 */}
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <Badge n="3" label="学生成长期望" />
                </div>
                <textarea
                  value={studentWish}
                  onChange={e => setStudentWish(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-[#5b3117] bg-[#fbf2d5] px-2 py-1.5 font-serifSc text-[11px] leading-relaxed text-[#381f13] focus:outline-none"
                />
              </div>

              {/* 4 政策导向 */}
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <Badge n="4" label="政策导向" />
                </div>
                <select
                  value={policyId}
                  onChange={e => {
                    audioEngine.play('paper');
                    setPolicyId(e.target.value);
                  }}
                  className="w-full rounded border border-[#5b3117] bg-[#fbf2d5] px-2 py-1 font-serifSc text-[11px] font-bold text-[#381f13] focus:outline-none"
                >
                  {POLICIES.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 rounded border-l-2 border-[#8b5329] bg-[#eedcb1]/50 px-2 py-1 font-serifSc text-[10px] leading-relaxed text-stone-700">
                  {policy.quote}
                </p>
              </div>
            </div>
          </div>

          {/* 缺口诊断 */}
          <div className="sd-box anim-fade-up rounded-lg p-3.5">
            <h4 className="mb-2 flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
              <span className="h-3 w-1 bg-[#8b5329]" />
              胜任力缺口诊断
              <span className="font-serifSc text-[9.5px] font-normal text-stone-500">
                对标岗位基线 {BASELINE} 档
              </span>
            </h4>
            <div className="space-y-1.5">
              {gaps.map((g, idx) => (
                <div key={g.meta.id} className="anim-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="mb-0.5 flex items-center justify-between font-serifSc text-[10.5px]">
                    <span className="font-bold text-stone-800">
                      {g.meta.name}
                      <span className="ml-1 font-mono text-[9px] font-normal text-stone-500">
                        权重 {(g.meta.weight * 100).toFixed(0)}%
                      </span>
                    </span>
                    <span
                      className={`font-mono text-[10px] ${
                        g.gap === 0 ? 'text-[#2f5121]' : g.gap >= 2 ? 'text-[#a93226]' : 'text-amber-700'
                      }`}
                    >
                      {g.gap === 0 ? '已达标' : `差 ${g.gap} 档`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#8b5329]/15">
                    <div
                      className={`anim-grow-bar h-full rounded-full ${
                        g.gap === 0
                          ? 'bg-gradient-to-r from-[#487332] to-[#6f9c56]'
                          : g.gap >= 2
                          ? 'bg-gradient-to-r from-[#a93226] to-[#c8624f]'
                          : 'bg-gradient-to-r from-[#d49b55] to-[#8b5329]'
                      }`}
                      style={{ width: `${(g.current / 5) * 100}%`, animationDelay: `${0.1 + idx * 0.06}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右：画像 + 资源 */}
        <div className="space-y-4 lg:col-span-7">
          <div className="sd-box anim-fade-up rounded-lg p-3.5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
                <span className="h-3 w-1 bg-[#8b5329]" />
                学生画像（五维雷达）
              </h4>
              <div className="flex items-center gap-3 font-serifSc text-[9.5px] text-stone-600">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-3 rounded-sm bg-[#c8862a]" />
                  本人档位
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-3 rounded-sm bg-[#487332]/40" />
                  岗位基线
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <RadarChart
                values={METRIC_CATALOG.map(m => candidate.metrics[m.id].level)}
                baseline={BASELINE}
                labels={METRIC_CATALOG.map(m => m.short)}
              />
              <div className="flex-1 space-y-2">
                <div className="rounded border border-[#8b5329]/25 bg-white/60 p-2">
                  <div className="font-serifSc text-[10px] text-stone-500">综合评估</div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-black text-[#5b2b14]">
                      {candidate.composite_score}
                    </span>
                    <span className="font-serifSc text-[10px] text-stone-500">
                      材料 {candidate.material_score} · 面试 {candidate.interview_score}
                    </span>
                  </div>
                  <div className="mt-1 font-serifSc text-[10px] leading-relaxed text-stone-700">
                    {fullMarks.length === METRIC_CATALOG.length
                      ? '五维均已达到岗位基线，建议列为拔尖学生干部导师库候选。'
                      : `当前最强维度为「${[...gaps].sort((a, b) => a.gap - b.gap)[0].meta.name}」，最需补强的是「${gaps[0].meta.name}」（差 ${gaps[0].gap} 档）。`}
                  </div>
                </div>
                <div className="rounded border border-[#8b5329]/25 bg-[#eedcb1]/40 p-2">
                  <div className="font-serifSc text-[10px] font-bold text-[#5b2b14]">政策锚点</div>
                  <p className="font-serifSc text-[10px] leading-relaxed text-stone-700">{policy.quote}</p>
                  <div className="mt-1 font-mono text-[9px] text-stone-500">{policy.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 资源匹配 */}
          <div className="sd-box anim-fade-up rounded-lg p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
                <span className="h-3 w-1 bg-[#8b5329]" />
                资源匹配清单
                <span className="font-serifSc text-[9.5px] font-normal text-stone-500">
                  按缺口从大到小排序 · 已参加可标记剔除
                </span>
              </h4>
              <span className="rounded bg-[#eedcb1] px-1.5 py-0.5 font-mono text-[9.5px] text-[#5b2b14]">
                {activeResources.length} 条建议
              </span>
            </div>

            <div className="space-y-2">
              {activeResources.length === 0 && (
                <div className="rounded border border-[#487332]/40 bg-[#eaf5e1] px-2 py-2 font-serifSc text-[10.5px] text-[#2f5121]">
                  当前五维均已达到基线，无需新增训练资源；建议进入下一阶段的传帮带与项目牵引。
                </div>
              )}
              {activeResources.map((res, idx) => {
                const gap = gaps.find(g => g.meta.id === res.targetMetric);
                return (
                  <div
                    key={res.id}
                    className="sd-hover-lift anim-fade-up rounded border border-[#8b5329]/30 bg-white/70 p-2.5"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-[#5b2b14] px-1.5 py-0.5 font-mono text-[9px] text-[#ffdf79]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-serifSc text-[11px] font-bold text-stone-800">{res.title}</span>
                      <span className="ml-auto font-mono text-[9px] text-[#8b5329]">
                        {res.provider} · {res.timeframe}
                      </span>
                    </div>
                    <p className="mt-1 font-serifSc text-[10px] leading-relaxed text-stone-700">
                      <span className="font-bold text-[#5b2b14]">执行：</span>
                      {res.action}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded border border-[#8b5329]/35 bg-[#eedcb1]/60 px-1.5 py-0.5 font-serifSc text-[9px] text-[#5b2b14]">
                        依据：{gap ? `${gap.meta.name}当前 ${gap.current} 档，距基线差 ${gap.gap} 档` : res.benefit}
                      </span>
                      <span className="rounded border border-[#487332]/30 bg-[#eaf5e1] px-1.5 py-0.5 font-serifSc text-[9px] text-[#2f5121]">
                        预期：{res.benefit}
                      </span>
                      <button
                        onClick={() => toggleAttended(res.id)}
                        className="ml-auto rounded border border-[#8b5329]/40 px-1.5 py-0.5 font-serifSc text-[9px] text-stone-600 hover:bg-[#eedcb1]"
                        title="标记为已参加，从方案中剔除"
                      >
                        已参加
                      </button>
                    </div>
                  </div>
                );
              })}
              {attended.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 rounded border border-dashed border-[#8b5329]/40 px-2 py-1.5">
                  <span className="font-serifSc text-[9.5px] text-stone-500">已剔除（本期不重复推荐）：</span>
                  {attended.map(id => {
                    const r = HDU_RESOURCES.find(x => x.id === id);
                    if (!r) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => toggleAttended(id)}
                        className="rounded bg-[#eedcb1] px-1.5 py-0.5 font-serifSc text-[9px] text-stone-600 line-through hover:bg-[#ffdf79]"
                      >
                        {r.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 一页纸方案 */}
      <div className="sd-box export-watermark anim-fade-up rounded-lg p-5">
        <div className="relative z-10 space-y-3.5">
          <div className="border-b-2 border-[#5b3117] pb-3 text-center">
            <span className="mb-0.5 block font-mono text-[10px] tracking-widest text-[#8b5329]">
              E-JUDGE.AI · 2026 MENTORSHIP PLAN
            </span>
            <h3 className="font-serifSc text-base font-black text-[#381f13]">
              学生骨干个性化能力发展建议单（一页纸）
            </h3>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 font-mono text-[10.5px] text-stone-600">
              <span>姓名：{candidate.name}（化名）</span>
              <span>学号：{candidate.id}</span>
              <span>班级：{candidate.major}</span>
              <span>生成日期：{generatedAt}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div className="rounded border border-amber-300 bg-amber-50/80 p-2.5 font-serifSc text-[11px]">
              <strong className="mb-1 block text-amber-900">一、申报现状</strong>
              <p className="leading-relaxed text-stone-700">
                申报职务【{candidate.position_name}】，材料分 {candidate.material_score}，面试分{' '}
                {candidate.interview_score}，综合 {candidate.composite_score}。五维档位：
                {METRIC_CATALOG.map(m => `${m.short}${candidate.metrics[m.id].level}`).join(' / ')}。
              </p>
            </div>
            <div className="rounded border border-[#8b5329]/30 bg-white/80 p-2.5 font-serifSc text-[11px]">
              <strong className="mb-1 block text-stone-900">二、画像与诉求</strong>
              <p className="leading-relaxed text-stone-700">
                辅导员观察：{counselorNote}
              </p>
              <p className="mt-1 leading-relaxed text-stone-700">学生期望：{studentWish}</p>
            </div>
          </div>

          <div className="rounded border border-[#487332]/30 bg-[#f4faf0] p-2.5 font-serifSc text-[11px]">
            <strong className="mb-1 block text-[#2f5121]">三、行动清单（按缺口排序）</strong>
            <div className="space-y-1">
              {activeResources.slice(0, 4).map((res, i) => (
                <div key={res.id} className="flex gap-1.5 leading-relaxed text-stone-700">
                  <span className="font-mono text-[10px] text-[#487332]">{i + 1}.</span>
                  <span>
                    <strong className="text-stone-800">{res.title}</strong>（{res.timeframe}）——
                    {res.action} 验收标准：{res.benefit}。
                  </span>
                </div>
              ))}
              {activeResources.length === 0 && <span className="text-stone-600">本期无需新增训练项。</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div className="rounded border border-[#8b5329]/30 bg-[#eedcb1]/45 p-2.5 font-serifSc text-[11px]">
              <strong className="mb-1 block text-[#5b2b14]">四、政策依据</strong>
              <p className="leading-relaxed text-stone-700">{policy.quote}</p>
              <div className="mt-0.5 font-mono text-[9.5px] text-stone-500">{policy.name}</div>
            </div>
            <div className="rounded border border-amber-300 bg-amber-100/50 p-2.5 font-serifSc text-[11px] text-amber-900">
              <strong className="mb-1 block">五、跟踪节点</strong>
              <div className="space-y-0.5">
                <div>· 第 4 周：辅导员核对行动项启动情况，确认资源报名。</div>
                <div>· 第 8 周：中期履职复盘，对照档位缺口看变化。</div>
                <div>· 学期末：重新评测五维档位，滚动生成下一期建议单。</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#5b3117]/25 pt-3 font-serifSc text-[10px] text-stone-500">
            <span>经杭电拔尖育人资源库认证 · 建议单可由辅导员导出打印</span>
            <button
              onClick={() => {
                audioEngine.play('coin');
                window.print();
              }}
              className="sd-btn-gold flex items-center gap-1.5 rounded px-3 py-1 text-[11px] font-bold"
            >
              誊印发展建议单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<{ n: string; label: string }> = ({ n, label }) => (
  <span className="flex items-center gap-1 font-serifSc text-[10.5px] font-bold text-stone-800">
    <span className="flex h-4 w-4 items-center justify-center rounded bg-[#8b5329] font-mono text-[9px] text-[#ffdf79]">
      {n}
    </span>
    {label}
  </span>
);

export default GrowthView;

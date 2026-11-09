import React, { useMemo, useState } from 'react';
import { Position } from '../../types';
import { audioEngine } from '../../services/audioEngine';
import { INTERVIEW_TRACKS, InterviewTarget } from '../../data/interviewTracks';
import {
  METRIC_CATALOG,
  MetricCatalogItem,
  MetricKey,
  GeneratedQuestion,
  buildQuestionList,
  judgeAnswer
} from '../../data/metricCatalog';
import { WorkshopView } from './WorkshopView';

interface MockInterviewViewProps {
  positions: Position[];
  /** 页面模式：岗位标准出题（面试工作台）/ 情境真题演练，由导航子页决定 */
  mode: 'standard' | 'scenario';
}

const FOCUS_OPTIONS = ['自我介绍', '经历陈述', '岗位设想', '追问应变', '时间控制'];
const DURATION_OPTIONS = [10, 20, 30];

const LEVEL_LABEL = [
  '',
  '第 1 档 · 基础储备',
  '第 2 档 · 尚需磨炼',
  '第 3 档 · 称职合格',
  '第 4 档 · 优秀骨干',
  '第 5 档 · 卓越领航'
];

const allTargets: Array<{ trackLabel: string; target: InterviewTarget }> = INTERVIEW_TRACKS.flatMap(t =>
  t.targets.map(target => ({ trackLabel: t.label, target }))
);

export const MockInterviewView: React.FC<MockInterviewViewProps> = ({ positions, mode }) => {
  return mode === 'standard' ? (
    <StandardInterviewFlow />
  ) : (
    <div className="anim-fade-in">
      <WorkshopView positions={positions} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 四步流程                                                            */
/* ------------------------------------------------------------------ */

const STEPS = [
  { no: 1, title: '面试需求登记', desc: '目标职务 · 练习环节 · 时长' },
  { no: 2, title: '生成问题清单', desc: '五维指标 × 经历/设想' },
  { no: 3, title: '逐题作答', desc: '结构化陈述 · 实时字数' },
  { no: 4, title: '结果与改进建议', desc: '逐维判档 · 缺口动作' }
];

const StandardInterviewFlow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [targetId, setTargetId] = useState(allTargets[0].target.id);
  const [focusAreas, setFocusAreas] = useState<string[]>(['经历陈述', '岗位设想']);
  const [duration, setDuration] = useState(20);
  const [selfNote, setSelfNote] = useState('临场容易紧张，经历讲得比较碎，缺少具体数据。');

  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQid, setActiveQid] = useState<string>('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof evaluate> | null>(null);

  const activeTarget = allTargets.find(t => t.target.id === targetId)!.target;

  const toggleFocus = (f: string) => {
    audioEngine.play('click');
    setFocusAreas(prev => (prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]));
  };

  const generate = () => {
    audioEngine.play('paper');
    const list = buildQuestionList({
      name: activeTarget.short,
      duty: activeTarget.duty,
      pain: activeTarget.pain,
      org: activeTarget.org
    });
    setQuestions(list);
    setAnswers({});
    setActiveQid(list[0].id);
    setResult(null);
    setStep(2);
  };

  const startAnswer = () => {
    audioEngine.play('click');
    setActiveQid(questions[0]?.id ?? '');
    setStep(3);
  };

  const answerCount = Object.values(answers).filter(v => v.trim().length > 0).length;

  const submit = async () => {
    if (answerCount === 0) return;
    audioEngine.play('subagent');
    setEvaluating(true);
    await new Promise(r => setTimeout(r, 900));
    const evaluated = evaluate(questions, answers);
    setResult(evaluated);
    setEvaluating(false);
    setStep(4);
    audioEngine.play('levelup');
  };

  return (
    <div className="space-y-4">
      {/* 页面标题条 */}
      <div className="sd-box rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] rounded border border-[#d49b55] bg-[#4a2411] px-2 py-0.5 text-[#ffdf79]">
            02-1
          </span>
          <span className="font-serifSc text-sm font-black text-[#3d1c0b]">面试工作台 · 岗位标准出题</span>
          <span className="font-serifSc text-[10.5px] text-stone-500">
            需求登记 · 五维指标 10 问 · 即时判档 · 改进建议
          </span>
        </div>
        <span className="text-[10px] font-serifSc text-stone-500 px-2 py-0.5 rounded bg-[#eedcb1] border border-[#8b5329]/40">
          情境真题见「02-2 情境真题演练」
        </span>
      </div>

      {/* 步骤条 */}
      <div className="sd-box rounded-lg px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {STEPS.map((s, idx) => {
            const done = step > s.no;
            const active = step === s.no;
            return (
              <React.Fragment key={s.no}>
                <div
                  className={`flex items-center gap-2 rounded border px-2.5 py-1 transition-all ${
                    active
                      ? 'border-[#d49b55] bg-[#5b2b14] text-[#ffdf79] shadow-pixel-sm'
                      : done
                      ? 'border-[#487332] bg-[#eaf5e1] text-[#2f5121]'
                      : 'border-[#8b5329]/35 bg-[#eedcb1]/70 text-stone-500'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${
                      active
                        ? 'bg-[#ffdf79] text-[#5b2b14]'
                        : done
                        ? 'bg-[#487332] text-white'
                        : 'bg-[#8b5329]/25 text-[#5b2b14]'
                    }`}
                  >
                    {done ? '✓' : s.no}
                  </span>
                  <span className="font-serifSc text-[11px] font-bold">{s.title}</span>
                  <span className="hidden font-serifSc text-[9.5px] opacity-70 lg:inline">
                    {s.desc}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <span
                    className={`h-[2px] w-4 rounded ${
                      step > s.no ? 'bg-[#487332]' : 'bg-[#8b5329]/30'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 步骤一：需求登记 */}
      {step === 1 && (
        <div className="sd-box anim-fade-up space-y-4 rounded-lg p-4">
          <div className="flex items-center gap-2 border-b border-[#5b3117]/25 pb-2">
            <span className="h-3.5 w-1 bg-[#8b5329]" />
            <h4 className="font-serifSc text-sm font-bold text-[#4a2817]">面试需求登记表</h4>
            <span className="font-serifSc text-[10.5px] text-stone-500">
              学生填写，系统据此从岗位标准库抽取指标与档位要点
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="font-serifSc text-[11px] font-bold text-stone-800">目标职务</label>
              <select
                value={targetId}
                onChange={e => {
                  audioEngine.play('paper');
                  setTargetId(e.target.value);
                }}
                className="w-full rounded border border-[#5b3117] bg-[#fbf2d5] px-2.5 py-1.5 font-serifSc text-xs font-bold text-[#381f13] focus:outline-none"
              >
                {['竞赛小组', '社团招新'].map(group => (
                  <optgroup key={group} label={group}>
                    {allTargets
                      .filter(t => t.trackLabel === group)
                      .map(t => (
                        <option key={t.target.id} value={t.target.id}>
                          {t.target.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <p className="rounded border border-[#8b5329]/30 bg-[#eedcb1]/50 px-2 py-1.5 font-serifSc text-[10.5px] leading-relaxed text-stone-700">
                <span className="font-bold text-[#5b2b14]">职责要点：</span>
                {activeTarget.duty}
                <br />
                <span className="font-bold text-[#5b2b14]">典型卡点：</span>
                {activeTarget.pain}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-serifSc text-[11px] font-bold text-stone-800">
                  希望练习的环节（可多选）
                </label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {FOCUS_OPTIONS.map(f => {
                    const on = focusAreas.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() => toggleFocus(f)}
                        className={`rounded border px-2 py-0.5 font-serifSc text-[10.5px] transition-all ${
                          on
                            ? 'border-[#5b2b14] bg-[#d49b55] font-bold text-[#2b1408]'
                            : 'border-[#8b5329]/40 bg-[#fbf2d5] text-stone-600 hover:bg-[#eedcb1]'
                        }`}
                      >
                        {on ? '✓ ' : ''}
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-serifSc text-[11px] font-bold text-stone-800">
                  可用练习时长
                </label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        audioEngine.play('click');
                        setDuration(d);
                      }}
                      className={`rounded border px-2.5 py-0.5 font-mono text-[10.5px] transition-all ${
                        duration === d
                          ? 'border-[#5b2b14] bg-[#5b2b14] font-bold text-[#ffdf79]'
                          : 'border-[#8b5329]/40 bg-[#fbf2d5] text-stone-600 hover:bg-[#eedcb1]'
                      }`}
                    >
                      {d} 分钟
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="font-serifSc text-[11px] font-bold text-stone-800">
              自评薄弱点（系统会据此调整追问力度）
            </label>
            <textarea
              value={selfNote}
              onChange={e => setSelfNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-[#5b3117] bg-[#fbf2d5] px-2 py-1.5 font-serifSc text-[11px] text-[#381f13] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#5b3117]/20 pt-2">
            <span className="font-serifSc text-[10.5px] text-stone-500">
              练习记录默认不保存，结束后可选择保留或删除（策划书 2.6）
            </span>
            <button onClick={generate} className="sd-btn-gold rounded px-4 py-1.5 font-serifSc text-xs font-bold">
              生成问题清单 →
            </button>
          </div>
        </div>
      )}

      {/* 步骤二：问题清单 */}
      {step === 2 && (
        <div className="sd-box anim-fade-up space-y-3 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5b3117]/25 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-1 bg-[#8b5329]" />
              <h4 className="font-serifSc text-sm font-bold text-[#4a2817]">
                为「{activeTarget.short}」生成的 10 道问题
              </h4>
            </div>
            <span className="font-serifSc text-[10.5px] text-stone-500">
              每个指标两问：先问经历，再问设想 · 练习环节：{focusAreas.join(' / ') || '全环节'} · {duration} 分钟
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {questions.map((q, idx) => {
              const meta = METRIC_CATALOG.find(m => m.id === q.metric)!;
              return (
                <div
                  key={q.id}
                  className="anim-fade-up sd-hover-lift rounded border border-[#8b5329]/35 bg-white/65 p-2.5"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="rounded bg-[#4a2411] px-1.5 py-0.5 font-mono text-[9px] text-[#ffdf79]">
                      Q{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-serifSc text-[10.5px] font-bold text-[#5b2b14]">
                      {meta.short} · {q.kind === 'experience' ? '经历追问' : '岗位设想'}
                    </span>
                    <span className="ml-auto font-mono text-[9px] text-stone-400">
                      权重 {(meta.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="font-serifSc text-[11px] leading-relaxed text-stone-800">{q.text}</p>
                  <p className="mt-1 font-serifSc text-[9.5px] text-[#8b5329]">观察要点：{q.focus}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#5b3117]/20 pt-2">
            <button
              onClick={() => {
                audioEngine.play('click');
                setStep(1);
              }}
              className="rounded border border-[#5b2b14] bg-[#eedcb1] px-3 py-1 font-serifSc text-[11px] text-[#381f13] hover:bg-[#ffdf79]"
            >
              ← 返回修改需求
            </button>
            <button onClick={startAnswer} className="sd-btn-gold rounded px-4 py-1.5 font-serifSc text-xs font-bold">
              开始逐题作答 →
            </button>
          </div>
        </div>
      )}

      {/* 步骤三：作答 */}
      {step === 3 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="sd-box anim-slide-right rounded-lg p-3 lg:col-span-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-serifSc text-xs font-bold text-[#4a2817]">题单</h4>
              <span className="font-mono text-[10px] text-stone-500">
                {answerCount}/{questions.length} 已作答
              </span>
            </div>
            <div className="space-y-1">
              {questions.map((q, idx) => {
                const meta = METRIC_CATALOG.find(m => m.id === q.metric)!;
                const answered = (answers[q.id] || '').trim().length > 0;
                const active = q.id === activeQid;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      audioEngine.play('click');
                      setActiveQid(q.id);
                    }}
                    className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left transition-colors ${
                      active
                        ? 'border-[#d49b55] bg-[#5b2b14] text-[#ffdf79]'
                        : 'border-[#8b5329]/25 bg-[#fbf2d5] text-stone-700 hover:bg-[#eedcb1]'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[8.5px] ${
                        answered
                          ? 'bg-[#487332] text-white'
                          : active
                          ? 'bg-[#ffdf79] text-[#5b2b14]'
                          : 'bg-[#8b5329]/20'
                      }`}
                    >
                      {answered ? '✓' : idx + 1}
                    </span>
                    <span className="truncate font-serifSc text-[10.5px]">
                      {meta.short}·{q.kind === 'experience' ? '经历' : '设想'}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={submit}
              disabled={evaluating || answerCount === 0}
              className={`mt-3 w-full rounded px-3 py-1.5 font-serifSc text-xs font-bold transition-all ${
                evaluating || answerCount === 0
                  ? 'cursor-not-allowed border border-stone-300 bg-stone-200 text-stone-400'
                  : 'sd-btn-gold'
              }`}
            >
              {evaluating ? '模型判档中…' : `提交并生成结果（${answerCount} 题）`}
            </button>
          </div>

          <div className="space-y-3 lg:col-span-8">
            {(() => {
              const q = questions.find(x => x.id === activeQid) ?? questions[0];
              if (!q) return null;
              const meta = METRIC_CATALOG.find(m => m.id === q.metric)!;
              const value = answers[q.id] || '';
              return (
                <>
                  <div key={q.id} className="sd-box anim-fade-up rounded-lg p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#4a2411] px-2 py-0.5 font-mono text-[10px] text-[#ffdf79]">
                        {meta.short} · {q.kind === 'experience' ? '经历追问' : '岗位设想'}
                      </span>
                      <span className="font-serifSc text-[10px] text-stone-500">
                        档位要点：{meta.anchors[2]} / {meta.anchors[4]}
                      </span>
                    </div>
                    <p className="font-serifSc text-sm font-bold leading-relaxed text-stone-900">{q.text}</p>
                    <p className="mt-1.5 rounded border border-amber-300 bg-amber-100/70 px-2 py-1.5 font-serifSc text-[10.5px] text-amber-900">
                      观察要点：{q.focus}
                    </p>
                  </div>

                  <div className="sd-box rounded-lg p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="font-serifSc text-[11px] font-bold text-stone-800">
                        你的回答（建议 120 字以上，包含时间、动作、数据、结果）
                      </label>
                      <span
                        className={`font-mono text-[10px] ${
                          value.length >= 90
                            ? 'text-[#487332]'
                            : value.length > 0
                            ? 'text-amber-700'
                            : 'text-stone-400'
                        }`}
                      >
                        {value.length} 字
                      </span>
                    </div>
                    <textarea
                      value={value}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      rows={8}
                      placeholder="先交代背景与职务，再讲你个人的关键动作，最后给出可核查的数据结果。"
                      className="w-full rounded border border-[#5b2b14] bg-[#fbf2d5] px-2.5 py-2 font-serifSc text-xs leading-relaxed text-[#381f13] focus:outline-none"
                    />
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {meta.keywords.slice(0, 5).map(k => (
                          <span
                            key={k}
                            className={`rounded border px-1.5 py-0.5 font-serifSc text-[9.5px] ${
                              value.includes(k)
                                ? 'border-[#487332] bg-[#eaf5e1] text-[#2f5121]'
                                : 'border-[#8b5329]/30 bg-[#eedcb1]/50 text-stone-500'
                            }`}
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const idx = questions.findIndex(x => x.id === q.id);
                            if (idx > 0) {
                              audioEngine.play('click');
                              setActiveQid(questions[idx - 1].id);
                            }
                          }}
                          className="rounded border border-[#5b2b14] bg-[#eedcb1] px-2 py-0.5 font-serifSc text-[10.5px] hover:bg-[#ffdf79]"
                        >
                          ← 上一题
                        </button>
                        <button
                          onClick={() => {
                            const idx = questions.findIndex(x => x.id === q.id);
                            if (idx < questions.length - 1) {
                              audioEngine.play('click');
                              setActiveQid(questions[idx + 1].id);
                            }
                          }}
                          className="rounded border border-[#5b2b14] bg-[#eedcb1] px-2 py-0.5 font-serifSc text-[10.5px] hover:bg-[#ffdf79]"
                        >
                          下一题 →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 步骤四：结果与建议 */}
      {step === 4 && result && (
        <div className="space-y-4">
          <div className="sd-box anim-pop-in rounded-lg p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-serifSc text-[10px] tracking-[0.2em] text-[#8b5329]">
                  MOCK INTERVIEW REPORT
                </div>
                <h3 className="font-serifSc text-lg font-black text-[#3d1c0b]">
                  {activeTarget.short} · 模拟面试评估报告
                </h3>
                <p className="font-serifSc text-[10.5px] text-stone-600">
                  按岗位标准式(1)折算：S = 100 × Σ(wᵢ × Lᵢ/5)；仅用于练习反馈，不进入正式档案
                </p>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-right">
                  <div className="font-serifSc text-[10px] text-stone-500">综合练习分</div>
                  <div className="font-mono text-4xl font-black leading-none text-[#5b2b14]">
                    {result.total.toFixed(1)}
                  </div>
                </div>
                <span
                  className={`rounded border-2 px-2.5 py-1 font-serifSc text-xs font-bold ${
                    result.level >= 4
                      ? 'border-[#487332] bg-[#eaf5e1] text-[#2f5121]'
                      : result.level === 3
                      ? 'border-[#d49b55] bg-[#fff6de] text-[#8b4a12]'
                      : 'border-[#a93226] bg-red-50 text-[#a93226]'
                  }`}
                >
                  {LEVEL_LABEL[result.level]}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {result.metrics.map((row, idx) => (
              <div
                key={row.meta.id}
                className="sd-box anim-fade-up rounded-lg p-3"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serifSc text-xs font-bold text-[#4a2817]">
                    {row.meta.name}
                    <span className="ml-1 font-mono text-[9.5px] font-normal text-stone-500">
                      权重 {(row.meta.weight * 100).toFixed(0)}%
                    </span>
                  </span>
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(lv => (
                      <span
                        key={lv}
                        className={`h-2.5 w-4 rounded-sm ${
                          lv <= row.level ? 'bg-[#5b2b14]' : 'bg-[#8b5329]/20'
                        }`}
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-1 font-serifSc text-[10.5px] text-stone-700">{row.reason}</p>
                {row.missing.length > 0 && (
                  <div className="mt-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1">
                    <span className="font-serifSc text-[9.5px] font-bold text-amber-900">缺失要点：</span>
                    <span className="font-serifSc text-[9.5px] text-amber-900">
                      {row.missing.join('、')}
                    </span>
                  </div>
                )}
                <div className="mt-1 font-serifSc text-[9.5px] text-stone-500">
                  对应档位：{row.meta.anchors[row.level - 1]}
                </div>
              </div>
            ))}
          </div>

          <div className="sd-box anim-fade-up rounded-lg p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3.5 w-1 bg-[#8b5329]" />
              <h4 className="font-serifSc text-sm font-bold text-[#4a2817]">改进建议（按档位缺口排序）</h4>
            </div>
            <div className="space-y-2">
              {result.advice.map((a, idx) => (
                <div
                  key={a.metricId}
                  className="anim-fade-up rounded border border-[#8b5329]/30 bg-white/65 p-2.5"
                  style={{ animationDelay: `${0.1 + idx * 0.08}s` }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#5b2b14] px-1.5 py-0.5 font-mono text-[9px] text-[#ffdf79]">
                      {idx + 1}
                    </span>
                    <span className="font-serifSc text-[11px] font-bold text-[#5b2b14]">{a.name}</span>
                    <span className="font-mono text-[9.5px] text-stone-500">
                      当前 {a.level} 档 → 目标 4 档
                    </span>
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {a.actions.map(act => (
                      <li key={act} className="flex gap-1.5 font-serifSc text-[10.5px] text-stone-700">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#8b5329]" />
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#5b3117]/20 pt-2">
              <span className="font-serifSc text-[10px] text-stone-500">
                本次练习共作答 {answerCount} 题，用 {duration} 分钟 · 记录默认不保存
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    audioEngine.play('click');
                    setStep(3);
                  }}
                  className="rounded border border-[#5b2b14] bg-[#eedcb1] px-3 py-1 font-serifSc text-[11px] hover:bg-[#ffdf79]"
                >
                  ← 继续修改回答
                </button>
                <button
                  onClick={() => {
                    audioEngine.play('paper');
                    generate();
                  }}
                  className="sd-btn-gold rounded px-3 py-1 font-serifSc text-[11px] font-bold"
                >
                  再来一轮
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 判档计算                                                            */
/* ------------------------------------------------------------------ */

function evaluate(questions: GeneratedQuestion[], answers: Record<string, string>) {
  const metrics = METRIC_CATALOG.map(meta => {
    const qs = questions.filter(q => q.metric === meta.id);
    const judged = qs.map(q => ({
      q,
      answer: answers[q.id] || '',
      ...judgeAnswer(meta, answers[q.id] || '')
    }));
    const answered = judged.filter(j => j.answer.trim().length > 0);
    const avg = answered.length
      ? answered.reduce((s, j) => s + j.level, 0) / answered.length
      : 1;
    const level = Math.max(1, Math.min(5, Math.round(avg)));
    const missing = Array.from(new Set(answered.flatMap(j => j.missing))).slice(0, 3);
    return {
      meta,
      level,
      reason: answered.length
        ? `已作答 ${answered.length} 题，${answered[0].reason}`
        : '该维度未作答，按第 1 档计（缺失项不补平均分）。',
      missing
    };
  });

  const total = metrics.reduce((s, m) => s + m.meta.weight * (m.level / 5), 0) * 100;

  const advice = [...metrics]
    .filter(m => m.level < 5)
    .sort((a, b) => a.level - b.level || b.meta.weight - a.meta.weight)
    .slice(0, 3)
    .map(m => ({
      metricId: m.meta.id as MetricKey,
      name: m.meta.name,
      level: m.level,
      actions: m.meta.gapActions
    }));

  const level = total >= 90 ? 5 : total >= 80 ? 4 : total >= 68 ? 3 : total >= 55 ? 2 : 1;

  return { metrics, total: Math.round(total * 10) / 10, level, advice };
}

export default MockInterviewView;

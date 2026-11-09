import React, { useMemo, useState } from 'react';
import { Position } from '../../types';
import { audioEngine } from '../../services/audioEngine';
import {
  INTERVIEW_TRACKS,
  InterviewTarget,
  InterviewTrack,
  buildScenarios
} from '../../data/interviewTracks';

interface WorkshopViewProps {
  positions: Position[];
}

export const WorkshopView: React.FC<WorkshopViewProps> = ({ positions }) => {
  // 默认停在「竞赛小组 · 组长」
  const [activeTrackId, setActiveTrackId] = useState(INTERVIEW_TRACKS[0].id);
  const activeTrack: InterviewTrack =
    INTERVIEW_TRACKS.find(t => t.id === activeTrackId) || INTERVIEW_TRACKS[0];

  const [activeTargetId, setActiveTargetId] = useState(activeTrack.targets[0].id);
  const activeTarget: InterviewTarget =
    activeTrack.targets.find(t => t.id === activeTargetId) || activeTrack.targets[0];

  // 每个职务都能拿到贴合自身职责的三道情境题
  const scenarios = useMemo(
    () => buildScenarios(activeTrack, activeTarget),
    [activeTrack, activeTarget]
  );

  const linkedPosition = activeTarget.libraryPositionId
    ? positions.find(p => p.id === activeTarget.libraryPositionId)
    : undefined;

  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const currentScenario = scenarios[Math.min(activeScenarioIdx, scenarios.length - 1)];

  // 答题结构化分段输入
  const [situationText, setSituationText] = useState('');
  const [actionText, setActionText] = useState('');
  const [resultText, setResultText] = useState('');
  const [probingAnswer, setProbingAnswer] = useState('');
  const [showProbing, setShowProbing] = useState(false);

  const [evaluating, setEvaluating] = useState(false);
  const [report, setReport] = useState<{
    score: number;
    level: number;
    levelLabel: string;
    situationScore: number;
    actionScore: number;
    resultScore: number;
    probingScore: number;
    factAnalysis: string;
    metricAnalysis: string;
    focusAnalysis: string;
    probingAnalysis: string;
    actionableAdvice: string;
  } | null>(null);

  // 提取纯量化评分核心计算函数
  const computeScoringReport = (
    sText: string,
    aText: string,
    rText: string,
    pText: string,
    probingActive: boolean
  ) => {
    // 1. 情境背景与阻力评估 (满分20分，基准10分)
    let sScore = 10;
    const hasRole = /(骨干|部长|负责人|委员|干事|团支书|班长|组长|副部长|主席|牵头人|统筹人|美编|社员|成员|志愿者|队员|班委)/.test(sText);
    const hasTime = /(大一|大二|大三|上学期|下学期|学年|任期|过去一年|月度|暑期|寒假)/.test(sText);
    const hasConflict = /(阻力|难题|缩减|临时|突发|毁约|遇冷|分歧|冲突|瓶颈|紧迫|匮乏|压力|困难|挑战)/.test(sText);
    if (hasRole) sScore += 3;
    if (hasTime) sScore += 2;
    if (hasConflict) sScore += 3.5;
    if (sText.trim().length >= 40) sScore += 1.5;
    else if (sText.trim().length < 15) sScore -= 3;
    sScore = Math.min(20, Math.max(6, Number(sScore.toFixed(1))));

    // 2. 行动策略与协调组织度评估 (满分30分，基准15分)
    let aScore = 15;
    const actionVerbs = ['梳理', '起草', '走访', '洽谈', '组织', '制定', '搭建', '协调', '复盘', '调研', '统筹', '排摸', '推演', '对接', '联合', '申报', '整理', '自学', '排版', '剪辑', '设计', '产出', '归类', '排期', '请教'];
    let matchedVerbs = 0;
    actionVerbs.forEach(v => {
      if (aText.includes(v)) matchedVerbs += 1;
    });
    aScore += Math.min(6, matchedVerbs * 1.5);

    const hasTeam = /(部员|团队|小组|协同|分工|弹性|结对|轮班|后勤|支持|协作|动员|学长|学姐|同伴|搭档)/.test(aText);
    if (hasTeam) aScore += 4;

    const hasRule = /(预案|公函|规范|底线|制度|章程|流程|安全|保障|备案|标准|优先级|排期)/.test(aText);
    if (hasRule) aScore += 4;

    const hasLogic = /(经过|同时|进而|随后|最终|一方面|另一方面|首先|通过)/.test(aText);
    if (hasLogic) aScore += 1;

    if (aText.trim().length >= 60) aScore += 2;
    else if (aText.trim().length < 20) aScore -= 4;
    aScore = Math.min(30, Math.max(9, Number(aScore.toFixed(1))));

    // 3. 成果量化与成效闭环评估 (满分30分，基准15分)
    let rScore = 15;
    const numberMatches = rText.match(/\d+(\.\d+)?%?|[百千万亿]/g);
    if (numberMatches && numberMatches.length >= 2) rScore += 7;
    else if (numberMatches && numberMatches.length === 1) rScore += 3.5;
    else rScore -= 4;

    const hasHonor = /(校级|院级|优秀|表彰|荣誉|立项|突破|嘉奖|先进|一等奖|二等奖|标兵)/.test(rText);
    if (hasHonor) rScore += 4;

    const hasSustainability = /(留任|传承|满意度|梯队|长效|口碑|复用|辐射|覆盖|复盘|节奏|习惯)/.test(rText);
    if (hasSustainability) rScore += 3;

    const hasClosure = /(全额|最终|达成|吸引|筹集|实现|落地|增长|采用|上线|发布|产出)/.test(rText);
    if (hasClosure) rScore += 1;

    if (rText.trim().length >= 45) rScore += 2;
    else if (rText.trim().length < 15) rScore -= 3;
    rScore = Math.min(30, Math.max(8, Number(rScore.toFixed(1))));

    // 4. 现场追问应变能力评估 (满分20分)
    let pScore = 8;
    if (probingActive && pText.trim().length > 0) {
      pScore = 10;
      const hasPeopleSkill = /(谈心|沟通|疏导|倾听|换位|共识|理解|关怀|激励|调解|安抚)/.test(pText);
      if (hasPeopleSkill) pScore += 4;

      const hasPrinciple = /(底线|原则|纪律|合规|立德|树人|导向|红线|公私)/.test(pText);
      if (hasPrinciple) pScore += 3;

      if (pText.trim().length >= 35) pScore += 3;
      else if (pText.trim().length >= 15) pScore += 1.5;
      pScore = Math.min(20, Math.max(8, Number(pScore.toFixed(1))));
    }

    // 综合加权总分
    const totalScore = Number((sScore + aScore + rScore + pScore).toFixed(1));

    // 档位判定
    let level = 3;
    let levelLabel = '第 3 档 · 称职合格梯队';
    if (totalScore >= 92) {
      level = 5;
      levelLabel = '第 5 档 · 卓越领航骨干';
    } else if (totalScore >= 83) {
      level = 4;
      levelLabel = '第 4 档 · 优秀实务骨干';
    } else if (totalScore >= 70) {
      level = 3;
      levelLabel = '第 3 档 · 称职合格梯队';
    } else if (totalScore >= 58) {
      level = 2;
      levelLabel = '第 2 档 · 尚需实战磨炼';
    } else {
      level = 1;
      levelLabel = '第 1 档 · 基础储备阶段';
    }

    // 细项动态诊断
    let factAnalysis = '';
    if (sScore >= 17) {
      factAnalysis = '事实要素闭环完整，时间跨度、骨干职务与突发阻力均清晰具象，具备真实的实务背景。';
    } else if (sScore >= 13) {
      factAnalysis = '具备基本的经历陈述，但阻力挑战的棘手程度与个人关键关口可进一步深化交代。';
    } else {
      factAnalysis = '背景时间线模糊或缺少正式职务交代，对矛盾阻力的描写较为简略，建议补充背景脉络。';
    }

    let focusAnalysis = '';
    if (aScore >= 25) {
      focusAnalysis = '协调行动有力，展现了高密度的行动抓手、部员协同与制度预案，统筹逻辑严谨。';
    } else if (aScore >= 19) {
      focusAnalysis = '具备基础的推进流程，但在团队弹性分工与危机化解的个人关键抓手上稍显宏观。';
    } else {
      focusAnalysis = '应对策略偏向宏观设想，缺少具体公函、制度或预案抓手，可执行度有待提高。';
    }

    let metricAnalysis = '';
    if (rScore >= 25) {
      metricAnalysis = '量化数据极为扎实，包含多维数字、留任率及荣誉立项，客观佐证力度强。';
    } else if (rScore >= 18) {
      metricAnalysis = '已有初步数据呈现，若能进一步结合留任成长或基线对比等长效指标说服力更佳。';
    } else {
      metricAnalysis = '量化指标偏弱，缺少覆盖人次、资金规模或具体成果数字，建议减少形容词。';
    }

    let probingAnalysis = '';
    if (!probingActive || pText.trim().length === 0) {
      probingAnalysis = '未开启现场追问或未填写追问作答，仅获得基础起评分，建议积极挑战现场追问。';
    } else if (pScore >= 16) {
      probingAnalysis = '应变表现沉着得当，兼具人际换位谈心关怀与工作纪律底线，展现出成熟的心智。';
    } else {
      probingAnalysis = '已初步应对考官提问，若能补充更具体的谈心沟通细节或底线谈判预案会更具说服力。';
    }

    // 针对最低项生成精准改进建议
    const scores = [
      { name: '情境背景', score: (sScore / 20), tip: '强化STAR第一步，交代清楚具体负责的职务与所面临的核心突发矛盾。' },
      { name: '行动策略', score: (aScore / 30), tip: '充实行动动词密度，细化团队弹性分工与抗风险安全预案等实质抓手。' },
      { name: '成果量化', score: (rScore / 30), tip: '引入参与师生人次、物资款项、部员留任率等量化客观数据闭环。' },
      { name: '现场追问', score: (pScore / 20), tip: '主动触发考官追问，展现化解部员情绪的谈心沟通与坚守育人原则的底线。' }
    ];
    scores.sort((a, b) => a.score - b.score);
    const weakest = scores[0];

    let actionableAdvice = `当前相对薄弱环节为【${weakest.name}】，${weakest.tip} 建议遵循事实、抓手、数据三位一体原则持续打磨答辩陈述。`;

    return {
      score: totalScore,
      level,
      levelLabel,
      situationScore: sScore,
      actionScore: aScore,
      resultScore: rScore,
      probingScore: pScore,
      factAnalysis,
      metricAnalysis,
      focusAnalysis,
      probingAnalysis,
      actionableAdvice
    };
  };

  const handleFillSample = () => {
    audioEngine.play('click');
    const { situation: s, action: a, result: r, probing: p } = activeTrack.sample;
    setSituationText(s);
    setActionText(a);
    setResultText(r);
    setShowProbing(true);
    setProbingAnswer(p);
    // 立即实时计算报告，让用户无需二次点击即可看到对应范围的高分示例
    const instantReport = computeScoringReport(s, a, r, p, true);
    setReport(instantReport);
  };

  // 监听输入改动：若当前已有报告或有足够输入内容，立即自动实时重算分数
  React.useEffect(() => {
    const fullText = `${situationText} ${actionText} ${resultText} ${probingAnswer}`.trim();
    if (fullText.length >= 15) {
      const liveReport = computeScoringReport(situationText, actionText, resultText, probingAnswer, showProbing);
      setReport(liveReport);
    }
  }, [situationText, actionText, resultText, probingAnswer, showProbing]);

  const handleEvaluate = async () => {
    const fullText = `${situationText} ${actionText} ${resultText} ${probingAnswer}`.trim();
    if (fullText.length < 20) {
      alert('请完整填写回答内容，包含背景阻力、具体行动与量化结果');
      return;
    }

    setEvaluating(true);
    audioEngine.play('subagent');
    await new Promise(r => setTimeout(r, 650));

    const evaluated = computeScoringReport(situationText, actionText, resultText, probingAnswer, showProbing);
    setReport(evaluated);

    audioEngine.play('levelup');
    setEvaluating(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 顶部标题区 + 目标职务范围选择 */}
      <div className="sd-box p-4 rounded-lg space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#4a2411] text-[#ffdf79] border border-[#d49b55]">
                02-2
              </span>
              <h3 className="font-serifSc font-black text-base text-[#3d1c0b]">
                情境真题演练
              </h3>
              <span className="text-[11px] text-stone-500 font-serifSc">
                竞赛小组 · 社团招新（自动化青协）
              </span>
            </div>
            <p className="text-xs text-stone-600 font-serifSc">
              从真实职务标准生成情境真题，模型判定档位要点，杜绝主观性格评价
            </p>
          </div>

          <div className="text-right min-w-[180px]">
            <div className="text-[10px] text-stone-500 font-serifSc">当前目标职务</div>
            <div className="text-sm font-black text-[#4a2411] font-serifSc leading-tight">
              {activeTarget.name}
            </div>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="px-1.5 py-0.5 rounded bg-[#4a2411] text-[#eedcb1] text-[10px] font-serifSc">
                {activeTarget.tag}
              </span>
              {linkedPosition && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-serifSc">
                  岗位标准库已收录
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 第一层：职务范围（竞赛小组 / 社团招新） */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#5b2b14]/20">
          <span className="text-[11px] font-bold text-[#4a2411] font-serifSc mr-1">
            职务范围：
          </span>
          {INTERVIEW_TRACKS.map(track => {
            const isActive = track.id === activeTrack.id;
            return (
              <button
                key={track.id}
                onClick={() => {
                  audioEngine.play('click');
                  setActiveTrackId(track.id);
                  setActiveTargetId(track.targets[0].id);
                  setActiveScenarioIdx(0);
                  setReport(null);
                  setShowProbing(false);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-serifSc border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55] font-bold shadow-pixel-sm'
                    : 'bg-[#eedcb1] text-[#381f13] border-[#8b5329]/40 hover:bg-[#ffdf79]'
                }`}
                title={track.hint}
              >
                <span className="font-mono text-[10px] opacity-80">{track.code}</span>
                {track.label}
                <span className="font-mono text-[9px] opacity-60">{track.targets.length}岗</span>
              </button>
            );
          })}
        </div>

        {/* 若该范围先选社团，再选职务：展示社团名称层级 */}
        {activeTrack.orgName && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#4a2411] font-serifSc mr-1">
              社团名称：
            </span>
            <span className="px-2.5 py-1 rounded text-[11px] font-serifSc bg-[#d49b55] text-[#2b1408] border border-[#5b2b14] font-bold shadow-pixel-sm">
              {activeTrack.orgName}
            </span>
            <span className="text-[10px] text-stone-500 font-serifSc">
              当前范围仅开放该社团
            </span>
          </div>
        )}

        {/* 第二层：该范围下的具体职务 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#4a2411] font-serifSc mr-1">
            具体职务：
          </span>
          {activeTrack.targets.map(target => {
            const isActive = target.id === activeTarget.id;
            const linked = target.libraryPositionId
              ? positions.some(p => p.id === target.libraryPositionId)
              : false;
            return (
              <button
                key={target.id}
                onClick={() => {
                  audioEngine.play('paper');
                  setActiveTargetId(target.id);
                  setActiveScenarioIdx(0);
                  setReport(null);
                  setShowProbing(false);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-serifSc border transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-[#d49b55] text-[#2b1408] border-[#5b2b14] font-bold shadow-pixel-sm'
                    : 'bg-[#fbf2d5] text-[#5b3117] border-[#8b5329]/40 hover:bg-[#eedcb1]'
                }`}
              >
                {target.short}
                {linked && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#2b1408]' : 'bg-emerald-600'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* 职责与考核侧重提示 */}
        <div className="text-[11px] text-stone-700 font-serifSc bg-[#eedcb1]/50 rounded p-2 border border-[#8b5329]/30 leading-relaxed">
          <span className="font-bold text-[#5b2b14]">职责要点：</span>
          {activeTarget.duty}
          <span className="mx-2 text-[#8b5329]">|</span>
          <span className="font-bold text-[#5b2b14]">能力侧重：</span>
          {activeTarget.focus}
        </div>
      </div>

      {/* 左右分栏：左侧情境答题台，右侧多维能力诊断报告 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 左侧考题推演与作答 */}
        <div className="lg:col-span-7 sd-box p-4 rounded-lg space-y-4">
          
          {/* 题目切换卡槽 */}
          <div className="flex items-center justify-between border-b border-[#5b2b14]/20 pb-2 gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#4a2411] font-serifSc">
              全真模拟考核场景
              <span className="ml-2 font-normal text-[10px] text-stone-500">
                {activeTarget.short} · 共 {scenarios.length} 题
              </span>
            </span>
            <div className="flex gap-1.5">
              {scenarios.map((sc, idx) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    audioEngine.play('click');
                    setActiveScenarioIdx(idx);
                    setReport(null);
                    setShowProbing(false);
                  }}
                  title={sc.title}
                  className={`px-3 py-1 rounded text-xs font-serifSc transition-all border ${
                    activeScenarioIdx === idx
                      ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55] font-bold shadow-pixel-sm'
                      : 'bg-[#eedcb1] text-[#381f13] hover:bg-[#ffdf79] border-[#8b5329]/40'
                  }`}
                >
                  场景 0{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* 考官与考题卡片 */}
          <div className="p-4 rounded-lg bg-[#eedcb1]/40 border-2 border-[#8b5329]/30 text-xs font-serifSc space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-[#5b2b14] font-mono">
                考官角色：{currentScenario.interviewer}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#4a2411] text-[#eedcb1] text-[10px]">
                考核维度：{currentScenario.metric}
              </span>
            </div>

            <div className="text-[10px] text-stone-500">
              目标职务：<strong className="text-[#5b2b14]">{activeTarget.name}</strong>
              <span className="mx-1.5">·</span>
              题眼：{currentScenario.title}
            </div>

            <h4 className="text-sm font-bold text-stone-900 leading-relaxed">
              {currentScenario.question}
            </h4>

            <div className="text-[11px] text-amber-900 bg-amber-100/70 p-2.5 rounded border border-amber-300">
              评分要点指引：{currentScenario.rubricFocus}
            </div>
          </div>

          {/* 结构化回答输入模块 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-serifSc">
              <span className="font-bold text-stone-800">
                结构化答辩陈述（情境行动成果分段）
              </span>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-amber-800 font-bold hover:underline text-[11px]"
              >
                载入「{activeTrack.label}」高分样本
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-stone-700 font-bold mb-1">
                {activeTrack.stageLabels[0]}
              </label>
              <textarea
                value={situationText}
                onChange={e => setSituationText(e.target.value)}
                placeholder="说明当时负责的职务、活动背景以及遇到的具体阻力..."
                rows={2}
                className="w-full p-2 text-xs font-serifSc rounded border border-[#5b2b14] bg-[#fbf2d5] text-[#381f13] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-700 font-bold mb-1">
                {activeTrack.stageLabels[1]}
              </label>
              <textarea
                value={actionText}
                onChange={e => setActionText(e.target.value)}
                placeholder="详细说明你个人采取的行动路径、资源协调方式与组织推进细节..."
                rows={2}
                className="w-full p-2 text-xs font-serifSc rounded border border-[#5b2b14] bg-[#fbf2d5] text-[#381f13] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-700 font-bold mb-1">
                {activeTrack.stageLabels[2]}
              </label>
              <textarea
                value={resultText}
                onChange={e => setResultText(e.target.value)}
                placeholder="给出参与人数、赞助额度、完成周期等具体量化数据..."
                rows={2}
                className="w-full p-2 text-xs font-serifSc rounded border border-[#5b2b14] bg-[#fbf2d5] text-[#381f13] focus:outline-none"
              />
            </div>

            {/* 考官深度追问模块 */}
            <div className="pt-2 border-t border-[#5b2b14]/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-purple-950 font-serifSc">
                  考官现场追问环节
                </span>
                {!showProbing && (
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.play('click');
                      setShowProbing(true);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-purple-100 border border-purple-300 text-purple-900 font-bold"
                  >
                    触发考官深度追问
                  </button>
                )}
              </div>

              {showProbing && (
                <div className="p-2.5 rounded bg-purple-50/80 border border-purple-300 space-y-1.5 animate-fadeIn">
                  <p className="text-xs font-bold text-purple-900">
                    {currentScenario.probingQuestion}
                  </p>
                  <textarea
                    value={probingAnswer}
                    onChange={e => setProbingAnswer(e.target.value)}
                    placeholder="输入针对考官追问的应变陈述..."
                    rows={2}
                    className="w-full p-2 text-xs font-serifSc rounded border border-purple-300 bg-white text-stone-800 focus:outline-none"
                  />
                </div>
              )}
            </div>

          </div>

          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className={`w-full sd-btn-wood py-2.5 rounded text-xs font-serifSc font-bold tracking-wider shadow-pixel ${
              evaluating ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {evaluating ? '智能考官集群正在审阅中...' : '提交答卷并生成多维能力诊断报告'}
          </button>
        </div>

        {/* 右侧考核诊断与建议 */}
        <div className="lg:col-span-5 sd-box p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="border-b border-[#5b2b14]/20 pb-2 mb-3 flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#4a2411] font-serifSc">
                答辩诊断与改进指南
              </h4>
              <span className="text-[10px] text-stone-500 font-serifSc">
                仅供学生自测 · 不列入选拔排名
              </span>
            </div>

            {report ? (
              <div className="space-y-3 text-xs font-serifSc">
                {/* 综合得分与档位卡片 */}
                <div className="p-3.5 rounded bg-[#eedcb1]/70 border border-[#8b5329]/50 flex items-center justify-between shadow-pixel-sm">
                  <div>
                    <span className="text-stone-600 block text-[11px]">本轮全真折算面试得分</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <strong className="text-3xl font-mono font-bold text-[#4a2411]">
                        {report.score}
                      </strong>
                      <span className="text-xs font-bold text-stone-700 font-serifSc">分</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-600 block text-[11px] mb-1">匹配岗位档位</span>
                    <span className="font-mono font-bold text-xs text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded border border-amber-400 shadow-sm inline-block">
                      {report.levelLabel}
                    </span>
                  </div>
                </div>

                {/* STAR 四维得分拆解条 */}
                <div className="p-3 rounded bg-white/90 border border-stone-300 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 border-b border-stone-200 pb-1">
                    <span>STAR 四维能力得分拆解</span>
                    <span className="font-mono text-stone-500">满分 100 分</span>
                  </div>

                  {/* 1. 情境背景 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-700 mb-0.5">
                      <span>情境背景与突发阻力</span>
                      <span className="font-mono font-bold text-[#5b2b14]">{report.situationScore} / 20 分</span>
                    </div>
                    <div className="w-full h-2 rounded bg-stone-200 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded transition-all duration-500"
                        style={{ width: `${(report.situationScore / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 2. 行动策略 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-700 mb-0.5">
                      <span>行动抓手与协调协同</span>
                      <span className="font-mono font-bold text-[#5b2b14]">{report.actionScore} / 30 分</span>
                    </div>
                    <div className="w-full h-2 rounded bg-stone-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded transition-all duration-500"
                        style={{ width: `${(report.actionScore / 30) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 3. 成果量化 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-700 mb-0.5">
                      <span>客观量化与成效闭环</span>
                      <span className="font-mono font-bold text-[#5b2b14]">{report.resultScore} / 30 分</span>
                    </div>
                    <div className="w-full h-2 rounded bg-stone-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded transition-all duration-500"
                        style={{ width: `${(report.resultScore / 30) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 4. 追问应变 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-700 mb-0.5">
                      <span>现场追问与原则应变</span>
                      <span className="font-mono font-bold text-[#5b2b14]">{report.probingScore} / 20 分</span>
                    </div>
                    <div className="w-full h-2 rounded bg-stone-200 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded transition-all duration-500"
                        style={{ width: `${(report.probingScore / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 四项具体诊断 */}
                <div className="space-y-1.5">
                  <div className="p-2 rounded bg-white/80 border border-stone-300">
                    <span className="font-bold text-amber-900 block mb-0.5 text-[11px]">
                      【情境诊断】事实完整度与阻力具象性
                    </span>
                    <p className="text-stone-600 leading-relaxed text-[11px]">
                      {report.factAnalysis}
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/80 border border-stone-300">
                    <span className="font-bold text-blue-900 block mb-0.5 text-[11px]">
                      【策略诊断】行动抓手与团队弹性分工
                    </span>
                    <p className="text-stone-600 leading-relaxed text-[11px]">
                      {report.focusAnalysis}
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/80 border border-stone-300">
                    <span className="font-bold text-emerald-900 block mb-0.5 text-[11px]">
                      【成效诊断】多维量化指标与组织闭环
                    </span>
                    <p className="text-stone-600 leading-relaxed text-[11px]">
                      {report.metricAnalysis}
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/80 border border-stone-300">
                    <span className="font-bold text-purple-900 block mb-0.5 text-[11px]">
                      【应变诊断】现场追问谈心与政治底线
                    </span>
                    <p className="text-stone-600 leading-relaxed text-[11px]">
                      {report.probingAnalysis}
                    </p>
                  </div>
                </div>

                {/* 针对性精进建议 */}
                <div className="p-3 rounded bg-amber-50/90 border border-amber-300 text-amber-950">
                  <strong className="block mb-1 font-bold text-xs text-amber-900">
                    核心精进突破口指引：
                  </strong>
                  <p className="leading-relaxed text-[11px]">
                    {report.actionableAdvice}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-500 font-serifSc space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#eedcb1] border border-[#8b5329] flex items-center justify-center font-mono font-bold text-stone-600">
                  STAR
                </div>
                <p className="leading-relaxed max-w-xs mx-auto">
                  当前范围为「{activeTrack.label} · {activeTarget.short}」，在左侧分段输入答辩内容并点击提交，系统将依据情境背景、协同策略、量化闭环与现场追问四维模型推演打分
                </p>
                <div className="text-[10px] text-stone-400 bg-stone-100 p-2 rounded border border-stone-200 text-left">
                  <span className="font-bold text-stone-600 block mb-1">评分权重分布：</span>
                  1. {activeTrack.stageLabels[0].replace(/^第一阶段：/, '')}（20分）<br/>
                  2. {activeTrack.stageLabels[1].replace(/^第二阶段：/, '')}（30分）<br/>
                  3. {activeTrack.stageLabels[2].replace(/^第三阶段：/, '')}（30分）<br/>
                  4. 现场追问与应变（20分）
                </div>
              </div>
            )}
          </div>

          {/* 底部规则公开明细 */}
          <div className="pt-3 border-t border-[#5b2b14]/20 text-[10px] text-stone-500 font-serifSc flex items-center justify-between">
            <span>依据班委换届、社团竞聘与社团招新面试 STAR 实务模型算分</span>
            <span className="text-[#8b5329] font-bold">拒绝对性格打分 · 纯量化研判</span>
          </div>
        </div>

      </div>

    </div>
  );
};

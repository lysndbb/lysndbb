/**
 * 五维评判指标目录（策划书 2.2 / 附录 J）
 * 模拟面试出题、面试评分表、学生能力发展三处共用同一套指标与档位要点，
 * 保证「材料初审 — 面试评分 — 培养建议」三个环节的判定口径一致。
 */

export type MetricKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5';

export interface MetricCatalogItem {
  id: MetricKey;
  short: string;
  name: string;
  /** 指标口径 */
  scope: string;
  /** 建议权重（主要学生干部岗位） */
  weight: number;
  /** 面试观察要点 */
  interviewFocus: string;
  /** 5 个档位的一句话判定要点 */
  anchors: [string, string, string, string, string];
  /** 经历类提问模板，{name} 目标职务、{duty} 职责、{pain} 痛点 */
  experienceQuestion: string;
  /** 设想类提问模板 */
  visionQuestion: string;
  /** 该维度常用的关键词，用于文本证据识别 */
  keywords: string[];
  /** 该维度不足时的训练动作 */
  gapActions: string[];
}

export const METRIC_CATALOG: MetricCatalogItem[] = [
  {
    id: 'm1',
    short: '德育',
    name: '思想政治与品德',
    scope: '思想汇报针对性、党团学习参与、志愿服务与集体公益的持续性',
    weight: 0.25,
    interviewFocus: '看政治立场是否落到具体行动，公益服务是否持续、有工时与品牌证据',
    anchors: [
      '无任何政治学习与公益记录，仅表达意愿',
      '偶尔参加集体政治学习，志愿服务不足 20 工时',
      '能参加支部学习，志愿时长 20—40 工时但未成常态',
      '思想汇报规范，志愿满 40 工时，表现良好',
      '立场坚定、汇报有深度，志愿满 80 工时或有品牌项目/表彰'
    ],
    experienceQuestion:
      '请结合你在{name}相关工作中的真实经历，说明一次最能体现你服务意识与政治素养的事：当时服务对象是谁、持续多久、产生了什么可核查的记录？',
    visionQuestion:
      '如果由你承担{name}，你打算怎样把思想引领做成同学愿意参与的常态活动，而不是一次性的打卡任务？',
    keywords: ['志愿', '思想', '党', '团', '服务', '工时', '公益', '奉献', '支部', '政治'],
    gapActions: [
      '补齐一段 40 工时以上的持续性志愿服务，并留存省志愿汇打卡记录',
      '每学期提交 2 篇结合自身岗位的思想汇报，避免空泛表态',
      '牵头一次面向班级或社区的公益品牌活动，形成可复用流程'
    ]
  },
  {
    id: 'm2',
    short: '学业',
    name: '学业表现',
    scope: '学分绩点与专业排名、学业预警情况、学科竞赛与科研创新',
    weight: 0.15,
    interviewFocus: '看学业是否守住学生干部底线，是否有竞赛/科研的实证成果',
    anchors: [
      '存在挂科重修或学业预警，不满足任职底线',
      'GPA 专业后 40%，无预警但有科目压线',
      '专业排名前 60%，无挂科，无实质竞赛奖项',
      '专业排名前 30%，有校级竞赛奖项或奖学金',
      '专业排名前 10%，省级以上竞赛奖项或主持科研项目'
    ],
    experienceQuestion:
      '请说明你目前的学业状态（绩点、排名、有无挂科），并举一个你平衡{name}工作与学业的真实例子，成绩是否受到影响？',
    visionQuestion:
      '{name}每周至少占用 8—12 小时，你打算怎样安排课表与备赛/备会节奏？如果期中与工作冲突，你的取舍原则是什么？',
    keywords: ['绩点', 'GPA', '排名', '竞赛', '奖学金', '科研', '课程', '成绩', '挂科', '保研'],
    gapActions: [
      '本学期把专业排名推进到前 30%，优先补最弱的一门核心课',
      '参加一项校级以上学科竞赛并承担可验证的分工',
      '加入教师课题组，完成一个可复现的小任务'
    ]
  },
  {
    id: 'm3',
    short: '履历',
    name: '学生工作经历',
    scope: '任职层级、职责范围、独立牵头事项与团队协作规模',
    weight: 0.3,
    interviewFocus: '看是否有正式职务、是否独立牵头、是否有可核查的协作规模',
    anchors: [
      '无学生工作经历，或仅挂名未履职',
      '担任干事，以执行交办任务为主',
      '担任班委/部门干事，能独立负责一块常规工作',
      '担任部长/班长，独立牵头跨部门项目并有团队分工',
      '担任主席/主要负责人，统筹多部门并形成制度化沉淀'
    ],
    experienceQuestion:
      '请完整讲一段你在{name}中独立牵头的经历：起点是什么、你个人的关键动作是什么、团队如何分工、最后结果如何量化？',
    visionQuestion:
      '针对{duty}这项职责，你判断最大的卡点是「{pain}」。履新前三个月你会用什么顺序解决它？',
    keywords: ['组织', '牵头', '部长', '班委', '统筹', '排期', '分工', '协调', '活动', '团队'],
    gapActions: [
      '主动承接一块可独立负责的常规工作，形成月度台账',
      '牵头一次跨部门协作项目，输出排期表与复盘报告',
      '把过往经历整理成「背景—动作—数据」三段式案例库'
    ]
  },
  {
    id: 'm4',
    short: '匹配',
    name: '岗位匹配与胜任设想',
    scope: '对岗位职责与痛点的理解、履新规划的可执行性、风险预案',
    weight: 0.25,
    interviewFocus: '看是否真的读懂岗位，规划是否有时间表、有资源、有兜底',
    anchors: [
      '说不出岗位职责，设想停留在口号',
      '能复述职责，但规划笼统、无时间表',
      '有基本规划，能说出两三项具体动作',
      '规划分阶段、有量化目标与资源路径',
      '精准命中岗位痛点，含风险预案与可复用机制'
    ],
    experienceQuestion:
      '你理解的{name}最关键的一件事是什么？请用你做过的一件事证明你具备这项能力。',
    visionQuestion:
      '若你履新{name}，前 90 天你打算分几个阶段推进？每个阶段的验收标准是什么？出现「{pain}」时你的兜底方案是什么？',
    keywords: ['岗位', '职责', '规划', '方案', '目标', '落地', '预案', '验收', '痛点', '阶段'],
    gapActions: [
      '访谈 2 位在任骨干，输出一份岗位痛点清单',
      '为心仪岗位写一份 90 天履新计划，含验收标准',
      '准备一套风险预案，覆盖人手、经费、审批三类突发'
    ]
  },
  {
    id: 'm5',
    short: '诚信',
    name: '材料规范与诚信',
    scope: '材料完整性、时间线自洽、数据可核查与表述原创性',
    weight: 0.05,
    interviewFocus: '看数据是否可查、时间线是否自洽、是否回避关键事实',
    anchors: [
      '材料缺项严重，存在明显时间线矛盾',
      '材料基本齐全但多处表述笼统无法核查',
      '材料规范，关键经历可对应证明人',
      '数据完整、时间线自洽，附有原始凭证',
      '全部结论可溯源，主动披露不足与失败经历'
    ],
    experienceQuestion:
      '你材料里提到的某项成果，能否给出具体数据来源与证明人？如果复核人现在就要核验，你能在多长时间内提供？',
    visionQuestion:
      '如果你在{name}任上出现一次工作失误（比如数据报错、活动延期），你会怎样向老师和同学交代？',
    keywords: ['诚信', '真实', '数据', '规范', '材料', '证明', '核实', '凭证', '纪律', '如实'],
    gapActions: [
      '为每项成果补齐时间、数量、证明人三要素',
      '建立个人成果台账，随做随记，避免事后回忆',
      '主动披露一段不成功的经历，训练诚实的复盘表达'
    ]
  }
];

export const metricByKey = (key: MetricKey) =>
  METRIC_CATALOG.find(m => m.id === key) ?? METRIC_CATALOG[0];

export interface GeneratedQuestion {
  id: string;
  metric: MetricKey;
  kind: 'experience' | 'vision';
  title: string;
  text: string;
  focus: string;
}

const fill = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

/** 按目标职务生成 5 指标 × 2 类共 10 道题（策划书 2.3.2 / 3.6） */
export const buildQuestionList = (target: {
  name: string;
  duty: string;
  pain: string;
  org?: string;
}): GeneratedQuestion[] => {
  const vars = {
    name: target.name,
    duty: target.duty,
    pain: target.pain,
    org: target.org ?? ''
  };
  const list: GeneratedQuestion[] = [];
  METRIC_CATALOG.forEach(meta => {
    list.push({
      id: `${meta.id}_exp`,
      metric: meta.id,
      kind: 'experience',
      title: `${meta.short} · 经历追问`,
      text: fill(meta.experienceQuestion, vars),
      focus: meta.interviewFocus
    });
    list.push({
      id: `${meta.id}_vis`,
      metric: meta.id,
      kind: 'vision',
      title: `${meta.short} · 岗位设想`,
      text: fill(meta.visionQuestion, vars),
      focus: meta.interviewFocus
    });
  });
  return list;
};

/** 单指标文本判档：用于模拟面试的即时反馈（1—5 档） */
export const judgeAnswer = (meta: MetricCatalogItem, answer: string) => {
  const text = answer.trim();
  const hit = meta.keywords.filter(k => text.includes(k));
  const hasNumber = /\d/.test(text);
  const hasTime = /(大一|大二|大三|学期|学年|个月|周|工时|任期)/.test(text);
  const hasAction = /(我|牵头|组织|负责|制定|设计|推动|建立|走访|协调|复盘)/.test(text);

  let level = 1;
  if (text.length >= 12) level = 2;
  if (text.length >= 40 && (hit.length >= 1 || hasAction)) level = 3;
  if (text.length >= 60 && hit.length >= 2 && (hasNumber || hasTime)) level = 4;
  if (text.length >= 90 && hit.length >= 3 && hasNumber && hasTime) level = 5;
  if (text.length < 10) level = 1;

  const missing: string[] = [];
  if (!hasTime) missing.push('具体时间跨度（学期 / 月份 / 工时）');
  if (!hasNumber) missing.push('可核查的量化数据（人数、额度、排名、比例）');
  if (!hasAction) missing.push('你个人的关键动作（而不是“我们”）');
  if (hit.length < 2) missing.push(`指标关键词证据（如 ${meta.keywords.slice(0, 4).join(' / ')}）`);
  if (text.length < 60) missing.push('足够的陈述长度（建议 90 秒以上、120 字左右）');

  const hitAnchor = meta.anchors[Math.min(level, 5) - 1];
  return {
    level,
    matched: hit,
    missing,
    anchor: hitAnchor,
    reason: `命中 ${hit.length} 个指标关键词${hasNumber ? '、含量化数据' : '、缺量化数据'}${
      hasTime ? '、时间线清晰' : '、时间线不清晰'
    }，综合判定落在第 ${level} 档。`
  };
};

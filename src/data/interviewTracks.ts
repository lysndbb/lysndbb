/**
 * 模拟面试题库：按「目标职务范围」组织
 * 两大范围：竞赛小组 / 社团招新（自动化青协七大部门）
 * 每个具体职务都有 3 道属于自己的情境真题，
 * 考官角色按职务层级设置：竞赛小组组长由上任组长 / 指导老师 / 辅导员面试，
 * 队员由组长 / 指导老师 / 辅导员面试；社团为对应部门部长 / 副部长 / 辅导员。
 */

export interface ScenarioTemplate {
  id: string;
  interviewer: string;
  metric: string;
  title: string;
  question: string;
  probingQuestion: string;
  rubricFocus: string;
}

export interface InterviewTarget {
  id: string;
  /** 完整职务名称，用于展示 */
  name: string;
  /** 简称，用于题干内插 */
  short: string;
  /** 标签：换届竞聘 / 部长竞聘 / 新生招新 / 骨干竞聘 */
  tag: string;
  org: string;
  duty: string;
  /** 该职务最典型的现实阻力（展示用） */
  pain: string;
  /** 能力侧重 */
  focus: string;
  /** 若与岗位标准库中的岗位对应，则标注其 id */
  libraryPositionId?: string;
  /** 该职务专属的三道情境题 */
  scenarios: ScenarioTemplate[];
}

export interface InterviewTrack {
  id: string;
  code: string;
  label: string;
  hint: string;
  /** 若该范围需先选社团名称，则展示此字段（当前仅开放自动化青协） */
  orgName?: string;
  /** 三段式作答框的标题 */
  stageLabels: [string, string, string];
  /** 高分参考答案样本 */
  sample: {
    situation: string;
    action: string;
    result: string;
    probing: string;
  };
  targets: InterviewTarget[];
}

export interface InterviewScenario {
  id: string;
  interviewer: string;
  metric: string;
  title: string;
  question: string;
  probingQuestion: string;
  rubricFocus: string;
}

const fill = (text: string, t: InterviewTarget): string =>
  text.replace(/\{name\}/g, t.short).replace(/\{org\}/g, t.org);

/** 取出该职务专属的三道真题 */
export const buildScenarios = (track: InterviewTrack, target: InterviewTarget): InterviewScenario[] =>
  target.scenarios.map(s => ({
    id: `${track.id}_${target.id}_${s.id}`,
    interviewer: s.interviewer,
    metric: s.metric,
    title: s.title,
    question: fill(s.question, target),
    probingQuestion: fill(s.probingQuestion, target),
    rubricFocus: fill(s.rubricFocus, target)
  }));

export const INTERVIEW_TRACKS: InterviewTrack[] = [
  /* ---------------------------------------------------------------- 01 竞赛小组 */
  {
    id: 'contest',
    code: '01',
    label: '竞赛小组',
    hint: '组长 · 队员 两类职务',
    stageLabels: ['第一阶段：竞赛背景与具体卡点', '第二阶段：技术方案与协作动作', '第三阶段：成绩数据与复盘沉淀'],
    sample: {
      situation:
        '大二上学期我作为智能车竞赛小组算法负责人，赛前两周主控板烧毁、两名组员因课业退出，队伍只剩三人。',
      action:
        '我重新拆解赛题，把控制任务砍到最小可跑通版本，制定每日联调节点并建立代码仓库与硬件联调日志；同时联系实验室借到备用主控板，带队连续三天完成参数重标定。',
      result:
        '最终以校内选拔第2名、省赛三等奖完赛，代码复现成功率达100%，队伍次年留任4人，并整理出12页调参手册。',
      probing:
        '我先私聊两位退出的组员了解真实压力，把他们的任务拆成可交接的文档，再由我承担最紧急的联调部分，避免情绪扩散。'
    },
    targets: [
      {
        id: 'contest_lead',
        name: '智能车竞赛小组 - 组长（队长）',
        short: '组长',
        tag: '换届竞聘',
        org: '智能车竞赛小组',
        duty: '赛题拆解、进度排期、组内分工、报名参赛与对外协调',
        pain: '赛前两周主控板烧毁、两名队员退出',
        focus: '项目统筹',
        scenarios: [
          {
            id: 'a',
            interviewer: '上任组长',
            metric: '项目统筹与抗压',
            title: '赛前两周队伍塌方',
            question:
              '你刚接任组长，赛前两周主控板烧毁、两名队员因课业退出，只剩三人。你如何把这个项目救回来？',
            probingQuestion: '追问：如果借不到备用板，只能换用性能低一档的型号，你的技术取舍是什么？',
            rubricFocus: '重点看优先级重排、风险信息同步与技术降级方案。'
          },
          {
            id: 'b',
            interviewer: '指导老师',
            metric: '技术决策与规则意识',
            title: '临赛想换技术方案',
            question:
              '距离校赛只剩六周，队里有人主张推翻现有方案改走新路线。作为{name}你如何判断该不该换？依据是什么？',
            probingQuestion: '追问：如果新方案在规则上处于灰色地带、但确实更快，你怎么处理？',
            rubricFocus: '重点看决策依据（剩余工时、验证成本、规则边界）与对团队预期的管理。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '学业与团队稳定',
            title: '核心队员挂科要退队',
            question:
              '队里两名核心队员期中挂科、家长要求退队。作为组长你如何既保住队伍又不耽误他们的学业？',
            probingQuestion: '追问：如果只剩你一个人能顶上，你打算怎么向指导老师和学院交代？',
            rubricFocus: '重点看学业优先的底线、任务再分配方案与对家长、老师的沟通。'
          }
        ]
      },
      {
        id: 'contest_member',
        name: '智能车竞赛小组 - 队员',
        short: '队员',
        tag: '组员选拔',
        org: '智能车竞赛小组',
        duty: '按分工承担算法控制 / 硬件电路 / 视觉感知 / 文档答辩其中一块，配合联调与参赛',
        pain: '分工边界不清、赛前联调频繁返工',
        focus: '专业执行与协作',
        scenarios: [
          {
            id: 'a',
            interviewer: '组长',
            metric: '任务承接与学习能力',
            title: '分到没做过的模块',
            question:
              '你作为新入队的队员，被分到一块从没做过的任务（比如视觉标定或电源设计）。第一周你打算怎么推进，怎么证明自己跟上了？',
            probingQuestion: '追问：如果两周后仍然没有进展，你会主动说吗？怎么说？',
            rubricFocus: '重点看拆解路径（查资料、复现样例、找人请教）、节点意识与主动暴露风险。'
          },
          {
            id: 'b',
            interviewer: '指导老师',
            metric: '方案论证与规范',
            title: '方案被指有隐患',
            question:
              '你提出的电路/算法方案被指导老师指出存在安全隐患或不符合赛规。作为{name}你会怎么回应并修改？',
            probingQuestion: '追问：如果你坚信自己的方案没问题，而老师和组长都不认同，你怎么做？',
            rubricFocus: '重点看证据化论证（实测数据、规则条款）、接受意见的姿态与落地修改。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '时间投入与学业平衡',
            title: '每周12小时怎么保证',
            question:
              '竞赛小组每周至少12小时、周末全天联调。你的课表和作息怎么排？如果和期中考试冲突，你怎么取舍？',
            probingQuestion: '追问：如果组长要求加练到每天4小时，你怎么回应？',
            rubricFocus: '重点看真实的时间盘点、可持续投入与学业底线，忌"我全都愿意"式表态。'
          }
        ]
      }
    ]
  },

  /* ---------------------------------------------------------------- 02 社团招新 */
  {
    id: 'club',
    code: '02',
    label: '社团招新',
    hint: '自动化青协 · 七大部门 · 部长/副部长/辅导员面试',
    orgName: '自动化青协',
    stageLabels: ['第一阶段：部门背景与工作卡点', '第二阶段：推进动作与协同', '第三阶段：量化成效与沉淀'],
    sample: {
      situation:
        '大二我担任青协项目拓展部部长，牵头年度爱心义卖，活动前两周长期合作企业因预算缩减撤资，场地物业也临时提高了审批门槛。',
      action:
        '我带着部员复盘近三年活动社会反响，起草正式合作公函，逐一走访钱塘区两家企业，经三轮洽谈争取到4500元物资赞助，同时与社区签署安全预案并按流程重新报批场地。',
      result: '活动吸引1200余名师生参与，筹得善款6800元全额对接贫困小学，部员留任率达85%，获校级优秀团队称号。',
      probing: '我组织了两次夜间谈心并制作弹性分工表，让备考同学转做后勤支持，确保梯队心齐气顺。'
    },
    targets: [
      {
        id: 'club_presidium',
        name: '自动化青协 - 主席团',
        short: '主席团',
        tag: '换届竞聘',
        org: '自动化学院青年志愿者协会',
        duty: '统筹六大部门、对接学院与社区、年度计划制定与经费分配',
        pain: '五个部门各自为战，年度重点项目两度延期',
        focus: '全局统筹',
        scenarios: [
          {
            id: 'a',
            interviewer: '上任主席 / 指导老师',
            metric: '统筹与治理',
            title: '部门各自为战',
            question:
              '你是{name}成员，五个部门各自为战、年度重点项目两度延期。上任后你如何统筹？',
            probingQuestion: '追问：如果两个部长公开反对你的统一排期，你怎么处理？',
            rubricFocus: '重点看目标对齐机制、例会与排期制度、冲突处理方式。'
          },
          {
            id: 'b',
            interviewer: '指导老师',
            metric: '责任担当',
            title: '重点项目失败谁负责',
            question:
              '年度重点项目失败、志愿者被服务对象投诉。作为{name}你如何界定责任并对外交代？',
            probingQuestion: '追问：如果问题主要出在你自己的决策上，你怎么说？',
            rubricFocus: '重点看担责姿态、事实梳理与可执行的改进承诺。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '资源约束下的取舍',
            title: '经费与场地砍半',
            question:
              '学院把社团经费与场地砍掉一半。作为{name}你如何调整全年计划，并让各部门接受？',
            probingQuestion: '追问：哪些项目你会砍掉、哪些必须保？依据是什么？',
            rubricFocus: '重点看优先级依据、替代资源与对成员的预期管理。'
          }
        ]
      },
      {
        id: 'club_xd',
        name: '自动化青协 - 项目拓展部（项拓）',
        short: '项拓',
        tag: '部长/副部长竞聘',
        org: '自动化学院青年志愿者协会',
        duty: '志愿项目挖掘、校企赞助洽谈与品牌活动孵化',
        pain: '长期合作企业撤资、场地审批被卡',
        focus: '资源拓展',
        libraryPositionId: 'pos_01',
        scenarios: [
          {
            id: 'a',
            interviewer: '项目拓展部部长',
            metric: '资源拓展',
            title: '企业临时撤资',
            question:
              '爱心义卖前两周企业撤资、场地审批被卡。作为{name}你如何补上这个资源缺口？',
            probingQuestion: '追问：如果找不到新赞助，活动要不要缩规模？你怎么向部员说明？',
            rubricFocus: '重点看资源盘点、替代方案与预期管理。'
          },
          {
            id: 'b',
            interviewer: '项目拓展部副部长',
            metric: '带人与复盘',
            title: '部员谈赞助被敷衍',
            question:
              '部员去谈赞助被企业敷衍回来，情绪很低落。作为{name}你如何带他复盘？',
            probingQuestion: '追问：如果他自己不想再去了，你怎么安排？',
            rubricFocus: '重点看复盘方法（对象筛选、话术）与情绪支持。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '合规与底线',
            title: '商业冠名要求',
            question:
              '企业要求活动全程冠名、并在现场售卖产品。作为{name}你怎么处理？',
            probingQuestion: '追问：如果这是唯一的赞助来源，你还坚持这条底线吗？',
            rubricFocus: '重点看校园活动规定、品牌边界与替代方案。'
          }
        ]
      },
      {
        id: 'club_jt',
        name: '自动化青协 - 基础拓展部（基拓）',
        short: '基拓',
        tag: '部长/副部长竞聘',
        org: '自动化学院青年志愿者协会',
        duty: '常态化社区服务点运营、支教陪伴与基础志愿岗位管理',
        pain: '社区服务点报名人数逐月下降',
        focus: '常态运营',
        scenarios: [
          {
            id: 'a',
            interviewer: '基础拓展部部长',
            metric: '项目运营',
            title: '服务点报名越来越少',
            question:
              '社区服务点报名人数从30人掉到8人。作为{name}你如何扭转这个趋势？',
            probingQuestion: '追问：如果部员说"这活太枯燥、没成就感"，你怎么回应？',
            rubricFocus: '重点看需求调研、岗位设计与激励方式。'
          },
          {
            id: 'b',
            interviewer: '基础拓展部副部长',
            metric: '服务延续',
            title: '对接人突然更换',
            question:
              '长期服务的社区突然更换对接人，之前的关系要重建。作为{name}你怎么继续？',
            probingQuestion: '追问：如果新对接人态度冷淡甚至不想合作，你怎么办？',
            rubricFocus: '重点看沟通策略、耐心与备选服务点储备。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '志愿真实性与管理',
            title: '只为时长挂名',
            question:
              '有志愿者报名后从不出现，只为拿志愿时长。作为{name}你怎么管？',
            probingQuestion: '追问：如果对方是学生干部、不好得罪，你处理方式会变吗？',
            rubricFocus: '重点看制度设计（签到、退出机制）与原则性。'
          }
        ]
      },
      {
        id: 'club_zg',
        name: '自动化青协 - 志愿管理部（志管）',
        short: '志管',
        tag: '部长/副部长竞聘',
        org: '自动化学院青年志愿者协会',
        duty: '志愿时长认定、台账维护与志愿汇系统管理',
        pain: '台账与志愿汇记录存在40余条不一致',
        focus: '数据治理',
        scenarios: [
          {
            id: 'a',
            interviewer: '志愿管理部部长',
            metric: '数据治理',
            title: '台账与系统对不上',
            question:
              '志愿时长台账与志愿汇记录有40余条不一致。作为{name}你如何核对并闭环？',
            probingQuestion: '追问：如果差错涉及已评奖评优的同学，你怎么处理？',
            rubricFocus: '重点看核对方法、留痕归档与差错纠正程序。'
          },
          {
            id: 'b',
            interviewer: '志愿管理部副部长',
            metric: '原则与沟通',
            title: '要求补录未参加的时长',
            question:
              '有同学要求补录他并未参加的志愿时长。作为{name}你怎么拒绝又不结怨？',
            probingQuestion: '追问：如果他说"别人都这么干"，你怎么回应？',
            rubricFocus: '重点看规则一致性、拒绝话术与申诉渠道。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '集中压力处理',
            title: '学期末集中补录',
            question:
              '学期末上百条补录申请涌来，截止时间只剩三天。作为{name}你如何安排？',
            probingQuestion: '追问：哪些可以补、哪些坚决不补？界线划在哪？',
            rubricFocus: '重点看分类处理规则、人力调度与统一书面口径。'
          }
        ]
      },
      {
        id: 'club_office',
        name: '自动化青协 - 办公室',
        short: '办公室',
        tag: '部长/副部长竞聘',
        org: '自动化学院青年志愿者协会',
        duty: '物资台账、会议纪要、档案归档与经费报销',
        pain: '物资借用混乱、报销单据常年不全',
        focus: '事务规范',
        scenarios: [
          {
            id: 'a',
            interviewer: '办公室主任',
            metric: '资产与流程',
            title: '物资借用一团乱',
            question:
              '社团物资台账混乱，活动前常找不到设备。作为{name}你如何建立一套真能执行的借用制度？',
            probingQuestion: '追问：如果部长们嫌登记麻烦、直接拿走，你怎么应对？',
            rubricFocus: '重点看台账设计、责任到人与低成本执行方式。'
          },
          {
            id: 'b',
            interviewer: '办公室副主任',
            metric: '文档与会议',
            title: '纪要多头版本',
            question:
              '每次会议纪要有三个版本、事后没人认账。作为{name}你怎么统一？',
            probingQuestion: '追问：如果部长们不愿意在会上确认分工，你怎么办？',
            rubricFocus: '重点看会议流程、责任到人与归档机制。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '财务规范',
            title: '报销单据不全',
            question:
              '活动报销时发票缺失、金额对不上。作为{name}你怎么处理并规范后续流程？',
            probingQuestion: '追问：如果是主席团成员垫付但没留票据，你怎么做？',
            rubricFocus: '重点看财务纪律、补救路径与制度改进。'
          }
        ]
      },
      {
        id: 'club_org',
        name: '自动化青协 - 组织部',
        short: '组织部',
        tag: '部长/副部长竞聘',
        org: '自动化学院青年志愿者协会',
        duty: '招新与内部建设、部门考核、换届交接',
        pain: '招新200人、期末只剩30人',
        focus: '组织建设',
        scenarios: [
          {
            id: 'a',
            interviewer: '组织部部长',
            metric: '招新与留存',
            title: '招新200人期末剩30人',
            question:
              '去年招新200人、期末只剩30人。作为{name}你如何重设招新结构与留存机制？',
            probingQuestion: '追问：如果骨干在大二因学业集体退出，你的应急预案是什么？',
            rubricFocus: '重点看招新漏斗、培养路径与制度化交接。'
          },
          {
            id: 'b',
            interviewer: '组织部副部长',
            metric: '考核公平',
            title: '考核被指看关系',
            question:
              '部门考核被指"看关系"，部员私下议论纷纷。作为{name}你如何让考核可复核？',
            probingQuestion: '追问：如果某位部长坚持给自己人打高分，你怎么处理？',
            rubricFocus: '重点看指标公开、评分留痕与申诉机制。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '换届交接',
            title: '换届后骨干流失',
            question:
              '换届后三名部长同时退出，工作全线断档。作为{name}你如何做交接与补位？',
            probingQuestion: '追问：如何从机制上避免"人走事停"？',
            rubricFocus: '重点看交接清单、文档化与人才储备。'
          }
        ]
      },
      {
        id: 'club_media',
        name: '自动化青协 - 新媒体',
        short: '新媒体',
        tag: '部长/副部长竞聘',
        org: '自动化学院青年志愿者协会',
        duty: '公众号运营、活动海报与短视频、舆情响应',
        pain: '推文数据夸大、物料临期出错',
        focus: '传播运营',
        scenarios: [
          {
            id: 'a',
            interviewer: '新媒体部长',
            metric: '舆情与响应',
            title: '负面评论扩散',
            question:
              '一条推文的负面评论两小时内被转发到多个学院群。作为{name}你的处置顺序是什么？',
            probingQuestion: '追问：如果评论内容部分属实，你删评还是正面回应？',
            rubricFocus: '重点看响应时效、事实核查与统一口径。'
          },
          {
            id: 'b',
            interviewer: '新媒体副部长',
            metric: '交付与应急',
            title: '活动前一晚物料出错',
            question:
              '活动前一晚发现海报日期印错、推文封面尺寸不符。作为{name}你怎么救？',
            probingQuestion: '追问：事后你如何建立交付前的检查清单？',
            rubricFocus: '重点看应急分工、清单化与责任回溯。'
          },
          {
            id: 'c',
            interviewer: '辅导员',
            metric: '内容把关',
            title: '宣传口径与事实不符',
            question:
              '推文把"30人参与"写成了"300人"，且已经发出。作为{name}你怎么处理？',
            probingQuestion: '追问：如果指导老师要求"别声张、悄悄改掉就行"，你怎么回应？',
            rubricFocus: '重点看更正流程、诚信态度与审核机制。'
          }
        ]
      }
    ]
  }
];

/** 依据职务 id 反查其所属范围 */
export const findTrackByTarget = (targetId: string) =>
  INTERVIEW_TRACKS.find(t => t.targets.some(tg => tg.id === targetId));

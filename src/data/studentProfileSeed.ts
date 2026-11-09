import { Candidate, StudentProfile } from '../types';

/**
 * 学生整页档案种子数据。
 * 现有候选人数据只存了评判所需字段，这里按学号确定性生成一份「像高中档案」的完整信息，
 * 保证 40 名学生打开后都有照片位、民族、联系电话、个人经历、老师评语等整页内容，
 * 管理员在此基础上修改并保存。
 */

const hashOf = (text: string): number => {
  let h = 7;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) % 100003;
  }
  return h;
};

const pick = <T,>(list: T[], seed: number, offset = 0): T => list[(seed + offset) % list.length];

const ETHNIC = ['汉族', '汉族', '汉族', '汉族', '回族', '满族', '壮族', '土家族'];
const NATIVE = [
  '浙江杭州',
  '浙江宁波',
  '浙江温州',
  '浙江绍兴',
  '浙江金华',
  '江苏南京',
  '安徽合肥',
  '河南郑州',
  '山东济南',
  '福建福州'
];
const SCHOOL = [
  '浙江省杭州高级中学',
  '杭州市第二中学',
  '宁波市效实中学',
  '浙江省温州中学',
  '绍兴市第一中学',
  '金华第一中学',
  '台州市第一中学',
  '嘉兴市第一中学'
];
const STREET = ['钱塘区学源街', '西湖区文一西路', '滨江区江南大道', '余杭区五常大道', '萧山区市心北路'];
const HOBBY = [
  '长跑与羽毛球',
  '摄影与短视频剪辑',
  '篮球与吉他',
  '书法与阅读',
  '游泳与骑行',
  '辩论与演讲'
];
const SPECIALTY = [
  '活动统筹与公文写作',
  '数据分析与表格建模',
  '海报设计与新媒体运营',
  '电路调试与动手实践',
  '演讲表达与活动主持',
  '志愿服务项目运营'
];
const HEAD_TEACHER = ['周敏', '陈立', '许静', '王慧', '李国强', '沈岚', '叶青'];
const HIGH_ROLE = ['班级学习委员', '班级团支书', '班长', '班级宣传委员', '班级体育委员'];
const SELF_EVAL = [
  '性格踏实、做事有计划，习惯把任务拆成可检查的小节点；不足之处是有时接事过多、容易把自己排得太满，这学期在刻意练习"先排优先级再答应"。',
  '待人真诚、愿意承担琐碎事务，遇到分歧倾向于先听对方把话说完；短板是公开表达时容易紧张，正在通过班会主持和答辩训练补齐。',
  '对新鲜事物保持好奇，愿意在没人做过的事情上先试一步；缺点是细节容易漏，现在养成了交付前逐项对照清单的习惯。',
  '自控力和执行力较强，能长期坚持一件看起来枯燥的事；不足是技术深度还不够，遇到难题容易停在"能用"，正在补底层原理。'
];
const TEACHER_EVAL = [
  '该生思想端正、集体观念强，班级事务从不推诿。学业上稳定在年级前列，做事有交代、有回音，是老师和同学都信得过的学生。',
  '该生性格温和但立场清楚，担任班级职务期间组织过多场活动，遇到突发状况能第一时间到场处理。希望今后在表达上更主动一些。',
  '该生学习自觉性高，善于总结方法，愿意把笔记和经验分享给同学。参加志愿服务持续时间长、不是为凑工时，品格踏实。',
  '该生思维活跃、动手能力强，在竞赛与项目中能承担关键模块。需要注意的是时间分配，避免因投入活动过多影响主干课程。'
];
const COUNSELOR_EVAL = [
  '该生在校期间遵守校纪校规，参与学院志愿服务与班级建设积极，未发现违纪与材料失实情况，同意推荐参加本次学生干部选拔。',
  '该生学习态度端正、集体服务意识较好，本学期参与学院活动 6 次，群众基础良好，建议在岗位匹配中优先考虑其统筹能力。',
  '该生综合素质较好，能与同学协作完成任务，材料所填经历经班级与学院核验一致，予以推荐。'
];

const buildExperiences = (seed: number, school: string): StudentProfile['experiences'] => [
  {
    id: 'exp_1',
    period: '2022.09 - 2025.06',
    org: school,
    role: pick(HIGH_ROLE, seed),
    description:
      '负责班级日常事务与学风建设，组织主题班会与学习互助小组，连续两学期获校级"三好学生"，高三阶段协助班主任完成毕业档案整理。'
  },
  {
    id: 'exp_2',
    period: '2023.09 - 2025.06',
    org: '校青年志愿者协会',
    role: '注册志愿者',
    description: `参与社区科普、图书馆导览与敬老院陪伴等常态化服务，累计志愿工时 ${40 + (seed % 6) * 8} 小时，获校级"优秀志愿者"称号。`
  },
  {
    id: 'exp_3',
    period: '2025.09 - 至今',
    org: '杭州电子科技大学 自动化学院',
    role: pick(['班级团支书', '班级学习委员', '学院青年志愿者协会干事', '班级组织委员'], seed, 2),
    description:
      '参与班级团日活动策划与学院志愿服务品牌项目执行，承担通知传达、材料汇总与现场协调工作，本学期参与活动 6 次、无缺席记录。'
  }
];

const buildAwards = (c: Candidate, seed: number): string[] => {
  const list: string[] = [];
  if (c.metrics.m2.level >= 5) list.push('全国大学生智能车竞赛华东赛区一等奖');
  if (c.metrics.m2.level >= 4) list.push('校级一等奖学金');
  if (c.metrics.m1.level >= 4) list.push('校"优秀青年志愿者"');
  if (c.metrics.m3.level >= 4) list.push('院"优秀学生干部"');
  if (list.length < 2) list.push(pick(['校级"三好学生"', '校征文比赛二等奖', '院学风建设先进个人'], seed));
  if (list.length < 3) list.push('普通话水平测试二级甲等');
  return list.slice(0, 4);
};

export const buildSeedProfile = (c: Candidate): StudentProfile => {
  const seed = hashOf(c.id || c.name);
  const birthYear = 2007 + (seed % 2);
  const month = (seed % 12) + 1;
  const day = (seed % 27) + 1;
  const tail = String(1000 + (seed % 9000)).slice(0, 4);
  const nativePlace = pick(NATIVE, seed);
  const school = pick(SCHOOL, seed, 3);
  const isPreParty = c.composite_score >= 93 && c.metrics.m1.level >= 4;

  return {
    photoUrl: undefined,
    ethnicity: pick(ETHNIC, seed),
    birthDate: `${birthYear}年${month}月${day}日`,
    politicalStatus: isPreParty ? '中共预备党员' : '共青团员',
    nativePlace,
    idNumber: `3301${'*'.repeat(10)}${tail}`,
    phone: `1${pick(['38', '39', '59', '86'], seed)}****${tail}`,
    email: `${c.id}@hdu.edu.cn`,
    address: `${nativePlace.replace(/(市|州)$/, '')}市${pick(STREET, seed)}${100 + (seed % 800)}号`,
    graduationSchool: school,
    health: '良好',
    hobbies: `${pick(HOBBY, seed)}、${pick(HOBBY, seed, 2)}`,
    specialties: pick(SPECIALTY, seed, 1),
    emergencyContact: `父亲 ${pick(['139', '137', '158'], seed)}****${String(2000 + (seed % 7000)).slice(0, 4)}`,
    experiences: buildExperiences(seed, school),
    awards: buildAwards(c, seed),
    selfEvaluation: pick(SELF_EVAL, seed),
    teacherComment: pick(TEACHER_EVAL, seed),
    headTeacher: pick(HEAD_TEACHER, seed),
    counselorComment: pick(COUNSELOR_EVAL, seed)
  };
};

export const ensureProfile = (c: Candidate): Candidate =>
  c.profile ? c : { ...c, profile: buildSeedProfile(c) };

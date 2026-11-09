/**
 * 岗位标准库
 *
 * 唯一数据源：直接由 `interviewTracks.ts` 的「目标职务」派生，
 * 因此「岗位标准 → 当前配置岗位」与「模拟面试 → 目标职务」两处的
 * 职务名称、数量、顺序、分组永远保持一致，不会各自维护而出现分歧。
 *
 * 岗位 id 保持稳定（项拓沿用 pos_01），因为已有申报档案与评分记录
 * 通过 position_id 关联，改名可以，改 id 会断链。
 */

import { Position } from '../types';
import { INTERVIEW_TRACKS, InterviewTarget } from './interviewTracks';

interface PositionPreset {
  /** 岗位标准库中的稳定 id */
  id: string;
  /** 面试分权重 α（综合分 = 面试α + 材料(1-α)） */
  alpha: number;
  /** 拟选拔名额 */
  target_quota: number;
  weights: Position['weights'];
}

/**
 * 以面试目标职务 id 为键的规则预设。
 * 权重之和必须严格等于 1.00（与岗位标准页的校验规则一致）。
 */
const PRESETS: Record<string, PositionPreset> = {
  // 01 竞赛小组
  contest_lead: {
    id: 'pos_02',
    alpha: 0.45,
    target_quota: 1,
    weights: { m1: 0.15, m2: 0.2, m3: 0.3, m4: 0.3, m5: 0.05 }
  },
  contest_member: {
    id: 'pos_03',
    alpha: 0.4,
    target_quota: 4,
    weights: { m1: 0.15, m2: 0.3, m3: 0.15, m4: 0.35, m5: 0.05 }
  },
  // 02 社团招新（自动化青协）
  club_presidium: {
    id: 'pos_04',
    alpha: 0.45,
    target_quota: 2,
    weights: { m1: 0.25, m2: 0.15, m3: 0.3, m4: 0.25, m5: 0.05 }
  },
  club_xd: {
    // 项拓沿用原有 pos_01：在册申报档案均绑定该岗位
    id: 'pos_01',
    alpha: 0.4,
    target_quota: 2,
    weights: { m1: 0.25, m2: 0.15, m3: 0.3, m4: 0.25, m5: 0.05 }
  },
  club_jt: {
    id: 'pos_05',
    alpha: 0.4,
    target_quota: 2,
    weights: { m1: 0.25, m2: 0.2, m3: 0.25, m4: 0.25, m5: 0.05 }
  },
  club_zg: {
    id: 'pos_06',
    alpha: 0.4,
    target_quota: 2,
    weights: { m1: 0.3, m2: 0.15, m3: 0.3, m4: 0.2, m5: 0.05 }
  },
  club_office: {
    id: 'pos_07',
    alpha: 0.35,
    target_quota: 2,
    weights: { m1: 0.25, m2: 0.2, m3: 0.3, m4: 0.2, m5: 0.05 }
  },
  club_org: {
    id: 'pos_08',
    alpha: 0.35,
    target_quota: 2,
    weights: { m1: 0.3, m2: 0.2, m3: 0.25, m4: 0.2, m5: 0.05 }
  },
  club_media: {
    id: 'pos_09',
    alpha: 0.4,
    target_quota: 2,
    weights: { m1: 0.2, m2: 0.15, m3: 0.25, m4: 0.35, m5: 0.05 }
  }
};

/** 未预设的职务使用的权重兜底（避免新增职务时下拉缺项） */
const DEFAULT_PRESET: Omit<PositionPreset, 'id'> = {
  alpha: 0.4,
  target_quota: 1,
  weights: { m1: 0.2, m2: 0.2, m3: 0.25, m4: 0.3, m5: 0.05 }
};

const buildPosition = (trackCode: string, trackLabel: string, target: InterviewTarget): Position => {
  const preset = PRESETS[target.id] ?? {
    id: `pos_${target.id}`,
    ...DEFAULT_PRESET
  };
  return {
    id: preset.id,
    name: target.name,
    category: target.tag,
    department: target.org,
    alpha: preset.alpha,
    description: `负责${target.duty}。典型卡点：${target.pain}。能力侧重：${target.focus}。`,
    weights: { ...preset.weights },
    target_quota: preset.target_quota,
    // 在册申报档案集中于「项拓」岗位，其余岗位暂无人申报
    applicant_count: target.id === 'club_xd' ? 40 : 0,
    interviewTargetId: target.id,
    trackCode,
    trackLabel,
    short: target.short
  };
};

export const POSITION_LIBRARY: Position[] = INTERVIEW_TRACKS.flatMap(track =>
  track.targets.map(target => buildPosition(track.code, track.label, target))
);

/** 按职务范围分组，供下拉框渲染 optgroup */
export const POSITION_GROUPS: { code: string; label: string; items: Position[] }[] =
  INTERVIEW_TRACKS.map(track => ({
    code: track.code,
    label: track.label,
    items: POSITION_LIBRARY.filter(p => p.trackCode === track.code)
  }));

export const findPositionByTarget = (targetId: string): Position | undefined =>
  POSITION_LIBRARY.find(p => p.interviewTargetId === targetId);

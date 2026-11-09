import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Candidate, MetricAssessment, MetricLevel, Position } from '../../types';
import { MetricStars } from '../MetricStars';
import { audioEngine } from '../../services/audioEngine';
import { StudentProfilePage } from './StudentProfilePage';
import { buildSeedProfile, ensureProfile } from '../../data/studentProfileSeed';

interface StudentArchiveViewProps {
  candidates: Candidate[];
  positions: Position[];
  onUpdateCandidate: (candidate: Candidate) => void;
  onAddCandidate: (candidate: Candidate) => void;
}

const METRIC_META = [
  { key: 'm1', label: '德育思政', hint: '党员团员、思想汇报、志愿工时' },
  { key: 'm2', label: '学业学术', hint: '绩点排名、奖学金、竞赛科研' },
  { key: 'm3', label: '学干履历', hint: '任职时长、活动统筹、量化成果' },
  { key: 'm4', label: '胜任设想', hint: '岗位理解、落地方案、时间节点' },
  { key: 'm5', label: '诚信规范', hint: '材料真实性、时间线自洽、盖章佐证' }
] as const;

const DEFAULT_WEIGHTS = { m1: 0.25, m2: 0.15, m3: 0.3, m4: 0.25, m5: 0.05 };

/** 把「2026级自动化1班」拆成年份 + 班级，用于分年级分班级归集 */
const parseMajor = (major: string) => {
  const matched = /^\s*(\d{4})\s*级\s*(.+?)\s*$/.exec(major || '');
  if (matched) {
    return { grade: `${matched[1]}级`, className: matched[2] || '未分班' };
  }
  return { grade: '年级未标注', className: (major || '未分班').trim() };
};

const computeScores = (draft: Candidate, positions: Position[]) => {
  const pos =
    positions.find(p => p.name === draft.position_name) ||
    positions.find(p => p.id === draft.position_id);
  const weights = pos?.weights ?? DEFAULT_WEIGHTS;
  const ratio = METRIC_META.reduce(
    (sum, meta) => sum + (draft.metrics[meta.key].level / 5) * weights[meta.key],
    0
  );
  const material = Math.round(ratio * 1000) / 10;
  const composite = Math.round((0.4 * draft.interview_score + 0.6 * material) * 10) / 10;
  return { material, composite, matchedPosition: pos };
};

const cloneCandidate = (c: Candidate): Candidate => JSON.parse(JSON.stringify(c));

const emptyMetric = (): MetricAssessment => ({
  level: 1,
  evidence: '',
  reason: '人工建档，证据待补充',
  confidence: 0.5
});

interface ClassGroup {
  key: string;
  grade: string;
  className: string;
  list: Candidate[];
  avg: number;
  pending: number;
}

interface ArchiveEditorProps {
  draft: Candidate;
  isNew: boolean;
  positions: Position[];
  error: string | null;
  onChange: (updater: (prev: Candidate) => Candidate) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ArchiveEditor: React.FC<ArchiveEditorProps> = ({
  draft,
  isNew,
  positions,
  error,
  onChange,
  onSave,
  onCancel
}) => {
  const scores = computeScores(draft, positions);
  const knownPosition = positions.some(p => p.name === draft.position_name);

  const patchMetric = (key: (typeof METRIC_META)[number]['key'], patch: Partial<MetricAssessment>) => {
    onChange(prev => ({
      ...prev,
      metrics: { ...prev.metrics, [key]: { ...prev.metrics[key], ...patch } }
    }));
  };

  return (
    <div className="sd-box rounded-lg overflow-hidden ring-2 ring-[#c8862a] ring-offset-2 ring-offset-[#2b1408] shadow-[0_0_24px_rgba(200,134,42,0.25)]">
      <div className="flex items-center justify-between gap-2 bg-[#381a0b] px-3.5 py-2 border-b-2 border-[#d49b55] text-[#fbf2d5]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#200d04] text-[#ffdf79] border border-[#d49b55]">
            {isNew ? '建档' : '修订'}
          </span>
          <span className="flex items-center gap-1.5 rounded border border-[#c8862a] bg-[#fff6de] px-1.5 py-0.5 text-[10px] font-bold font-serifSc text-[#8b4a12]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c8862a]" />
            编辑中
          </span>
          <span className="font-serifSc font-bold text-xs">
            {isNew ? '新建学生档案' : `${draft.name || '未命名'} · 在册档案`}
          </span>
          {!isNew && <span className="font-mono text-[10px] text-[#eedcb1]/60">{draft.id}</span>}
        </div>
        <button
          onClick={onCancel}
          className="shrink-0 rounded border border-[#eedcb1]/40 px-2 py-0.5 text-[11px] font-serifSc text-[#eedcb1]/80 hover:border-[#ffdf79] hover:text-[#ffdf79]"
        >
          关闭 ✕
        </button>
      </div>

      <div className="p-3.5 space-y-3.5 bg-[#fbf2d5]">
        {/* 基本信息 */}
        <div>
          <div className="text-[11px] font-bold text-[#5b2b14] font-serifSc mb-1.5 flex items-center gap-2">
            <span className="w-1 h-3 bg-[#8b5329] inline-block" />
            基本信息（与评判总览同名同源）
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
            <label className="text-[10px] text-stone-600 font-serifSc">
              姓名
              <input
                value={draft.name}
                onChange={e => onChange(prev => ({ ...prev, name: e.target.value }))}
                placeholder="化名"
                className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-[#5b2b14] bg-white text-[#381f13] focus:outline-none"
              />
            </label>
            <label className="text-[10px] text-stone-600 font-serifSc">
              学号
              <input
                value={draft.id}
                disabled={!isNew}
                onChange={e => onChange(prev => ({ ...prev, id: e.target.value }))}
                placeholder="如 26011101"
                className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-[#5b2b14] bg-white text-[#381f13] font-mono focus:outline-none disabled:bg-stone-200 disabled:text-stone-500"
              />
            </label>
            <label className="text-[10px] text-stone-600 font-serifSc">
              性别
              <select
                value={draft.gender}
                onChange={e => onChange(prev => ({ ...prev, gender: e.target.value }))}
                className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-[#5b2b14] bg-white text-[#381f13] focus:outline-none"
              >
                <option value="女">女</option>
                <option value="男">男</option>
              </select>
            </label>
            <label className="text-[10px] text-stone-600 font-serifSc col-span-2">
              年级班级
              <input
                value={draft.major}
                onChange={e => onChange(prev => ({ ...prev, major: e.target.value }))}
                placeholder="2026级自动化1班"
                className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-[#5b2b14] bg-white text-[#381f13] focus:outline-none"
              />
            </label>
            <label className="text-[10px] text-stone-600 font-serifSc">
              现场面试分
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={draft.interview_score}
                onChange={e =>
                  onChange(prev => ({
                    ...prev,
                    interview_score: Math.max(0, Math.min(100, Number(e.target.value) || 0))
                  }))
                }
                className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-[#5b2b14] bg-white text-[#381f13] font-mono focus:outline-none"
              />
            </label>
            <label className="text-[10px] text-stone-600 font-serifSc col-span-2 md:col-span-3 xl:col-span-6">
              申报岗位
              <select
                value={draft.position_name}
                onChange={e => {
                  const picked = positions.find(p => p.name === e.target.value);
                  onChange(prev => ({
                    ...prev,
                    position_name: e.target.value,
                    position_id: picked ? picked.id : prev.position_id
                  }));
                }}
                className="mt-0.5 w-full px-2 py-1 text-xs rounded border border-[#5b2b14] bg-white text-[#381f13] focus:outline-none"
              >
                {!knownPosition && draft.position_name && (
                  <option value={draft.position_name}>{draft.position_name}（未收录）</option>
                )}
                {positions.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* 五维档案 */}
        <div>
          <div className="text-[11px] font-bold text-[#5b2b14] font-serifSc mb-1.5 flex items-center gap-2">
            <span className="w-1 h-3 bg-[#8b5329] inline-block" />
            五维证据档案（档位 + 原文摘录）
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {METRIC_META.map(meta => {
              const metric = draft.metrics[meta.key];
              return (
                <div key={meta.key} className="p-2 rounded border border-[#8b5329]/35 bg-white/70">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-stone-800">{meta.label}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(lv => (
                        <button
                          key={lv}
                          type="button"
                          onClick={() => {
                            audioEngine.play('click');
                            patchMetric(meta.key, { level: lv as MetricLevel });
                          }}
                          className={`w-5 h-5 rounded text-[10px] font-mono border transition-all ${
                            metric.level === lv
                              ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55] font-bold'
                              : 'bg-[#eedcb1]/60 text-[#8b5329] border-[#8b5329]/30 hover:bg-[#ffdf79]'
                          }`}
                        >
                          {lv}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={metric.evidence}
                    onChange={e => patchMetric(meta.key, { evidence: e.target.value })}
                    placeholder={`${meta.hint}……`}
                    rows={2}
                    className="w-full px-2 py-1 text-[11px] leading-snug rounded border border-[#5b2b14]/60 bg-[#fbf2d5] text-[#381f13] focus:outline-none resize-y"
                  />
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono mt-0.5">
                    <span>{meta.hint}</span>
                    <span>置信度 {(metric.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 折算预览 */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-serifSc">
          <span className="px-2 py-1 rounded bg-[#eedcb1] border border-[#8b5329]/40 text-[#5b2b14]">
            材料初评 <strong className="font-mono text-[#381f13]">{scores.material}</strong>
          </span>
          <span className="px-2 py-1 rounded bg-[#eedcb1] border border-[#8b5329]/40 text-[#5b2b14]">
            综合总分{' '}
            <strong className="font-mono text-purple-900">{scores.composite}</strong>
          </span>
          <span className="text-[10px] text-stone-500">
            权重取自
            {scores.matchedPosition
              ? `「${scores.matchedPosition.name}」标准配比`
              : '系统默认配比（该岗位未收录标准）'}
            · 综合 = 面试 40% + 材料 60%
          </span>
        </div>

        {error && (
          <div className="px-2.5 py-1.5 rounded bg-red-100 border border-red-400 text-[11px] text-red-800 font-serifSc">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-3.5 flex items-center justify-between gap-2 border-t-2 border-[#c8862a]/60 bg-[#fbf2d5] px-3.5 py-2 shadow-[0_-6px_16px_rgba(120,70,10,0.15)]">
          <span className="text-[10px] text-stone-600 font-serifSc">
            保存后同步至评判总览、仲裁复核与凭据导出中的同名档案
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCancel}
              className="px-3 py-1 rounded text-[11px] font-serifSc border border-[#5b2b14] bg-[#eedcb1] text-[#381f13] hover:bg-[#ffdf79]"
            >
              放弃
            </button>
            <button
              onClick={onSave}
              className="px-3 py-1 rounded text-[11px] font-serifSc sd-btn-gold"
            >
              {isNew ? '建档入册' : '保存修订'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentArchiveView: React.FC<StudentArchiveViewProps> = ({
  candidates,
  positions,
  onUpdateCandidate,
  onAddCandidate
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'id' | 'name'>('score');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<{ grade: string; className: string } | null>(null);
  const [draft, setDraft] = useState<Candidate | null>(null);
  const [draftIsNew, setDraftIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [editedIds, setEditedIds] = useState<string[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (draft) {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [draft?.id, draftIsNew]);

  const classGroups = useMemo<ClassGroup[]>(() => {
    const map = new Map<string, ClassGroup>();
    candidates.forEach(c => {
      const { grade, className } = parseMajor(c.major);
      const key = `${grade}|${className}`;
      const exist = map.get(key);
      if (exist) {
        exist.list.push(c);
      } else {
        map.set(key, { key, grade, className, list: [c], avg: 0, pending: 0 });
      }
    });
    return Array.from(map.values()).map(g => {
      const list = [...g.list].sort((a, b) => b.composite_score - a.composite_score);
      return {
        ...g,
        list,
        avg: Math.round((list.reduce((s, c) => s + c.composite_score, 0) / list.length) * 10) / 10,
        pending: list.filter(c => c.status === 'pending_review').length
      };
    });
  }, [candidates]);

  const gradeGroups = useMemo(() => {
    const map = new Map<string, ClassGroup[]>();
    classGroups.forEach(g => {
      const arr = map.get(g.grade) ?? [];
      arr.push(g);
      map.set(g.grade, arr);
    });
    return Array.from(map.entries())
      .map(([name, classes]) => ({
        name,
        classes: [...classes].sort((a, b) =>
          a.className.localeCompare(b.className, 'zh-CN', { numeric: true })
        ),
        count: classes.reduce((s, c) => s + c.list.length, 0),
        avg:
          Math.round(
            (classes.reduce((s, c) => s + c.avg * c.list.length, 0) /
              Math.max(1, classes.reduce((s, c) => s + c.list.length, 0))) *
              10
          ) / 10
      }))
      .sort((a, b) => b.name.localeCompare(a.name, 'zh-CN', { numeric: true }));
  }, [classGroups]);

  const keyword = search.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    return classGroups
      .filter(g => gradeFilter === 'all' || g.grade === gradeFilter)
      .filter(g => !classFilter || (g.grade === classFilter.grade && g.className === classFilter.className))
      .map(g => {
        const list = g.list
          .filter(c => {
            if (!keyword) return true;
            return (
              c.name.toLowerCase().includes(keyword) ||
              c.id.toLowerCase().includes(keyword) ||
              c.major.toLowerCase().includes(keyword) ||
              c.position_name.toLowerCase().includes(keyword)
            );
          })
          .sort((a, b) => {
            if (sortBy === 'id') return a.id.localeCompare(b.id, 'zh-CN', { numeric: true });
            if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-CN');
            return b.composite_score - a.composite_score;
          });
        return { ...g, list };
      })
      .filter(g => g.list.length > 0);
  }, [classGroups, gradeFilter, classFilter, keyword, sortBy]);

  const visibleCount = visibleGroups.reduce((s, g) => s + g.list.length, 0);
  const totalClasses = classGroups.length;

  const openEdit = (c: Candidate) => {
    if (!adminMode) {
      setToast('当前为只读模式：请先开启「管理员模式」再修订档案');
      return;
    }
    audioEngine.play('paper');
    setDraftIsNew(false);
    setError(null);
    setDraft(cloneCandidate(c));
  };

  const openProfile = (c: Candidate) => {
    audioEngine.play('paper');
    setDraft(null);
    setViewingId(c.id);
  };

  const openCreate = () => {
    if (!adminMode) {
      setToast('当前为只读模式：请先开启「管理员模式」再新建档案');
      return;
    }
    audioEngine.play('paper');
    const grade = gradeFilter !== 'all' ? gradeFilter : gradeGroups[0]?.name ?? '2026级';
    const majorPrefix = classFilter ? `${classFilter.grade}${classFilter.className}` : `${grade}`;
    const firstPos = positions[0];
    setDraftIsNew(true);
    setError(null);
    setDraft({
      id: '',
      student_id: '',
      name: '',
      gender: '女',
      major: majorPrefix,
      position_id: firstPos?.id ?? '',
      position_name: firstPos?.name ?? '',
      qualified: true,
      qualification_issue: null,
      status: 'completed',
      review_reason: null,
      interview_score: 0,
      interview_notes: '',
      original_text: {},
      metrics: {
        m1: emptyMetric(),
        m2: emptyMetric(),
        m3: emptyMetric(),
        m4: emptyMetric(),
        m5: emptyMetric()
      },
      material_score: 0,
      composite_score: 0
    });
  };

  const closeEditor = () => {
    audioEngine.play('click');
    setDraft(null);
    setDraftIsNew(false);
    setError(null);
  };

  const handleSave = () => {
    if (!draft) return;
    const name = draft.name.trim();
    const major = draft.major.trim();
    const sid = draft.id.trim();

    if (!name) {
      setError('请填写学生姓名（系统内统一使用化名）。');
      return;
    }
    if (!/^\d{4}\s*级.+$/.test(major)) {
      setError('年级班级需按「2026级自动化1班」格式填写，才能正确归入年级与班级。');
      return;
    }
    if (!sid) {
      setError('请填写学号，用于与申报材料、改判记录对齐。');
      return;
    }
    if (draftIsNew && candidates.some(c => c.id === sid)) {
      setError(`学号 ${sid} 已存在档案，请核对后再建档。`);
      return;
    }

    const { material, composite } = computeScores(draft, positions);
    const next: Candidate = {
      ...draft,
      id: sid,
      student_id: sid,
      name,
      major,
      material_score: material,
      composite_score: composite,
      profile: draft.profile ?? buildSeedProfile({ ...draft, id: sid, name, major })
    };

    if (draftIsNew) {
      onAddCandidate(next);
      setToast(`已为 ${name} 建档，归入 ${major}`);
    } else {
      onUpdateCandidate(next);
      setToast(`${name} 的档案已更新`);
    }
    setEditedIds(prev => (prev.includes(next.id) ? prev : [...prev, next.id]));
    setDraft(null);
    setDraftIsNew(false);
    setError(null);
    audioEngine.play('paper');
  };

  const viewingCandidate = viewingId ? candidates.find(c => c.id === viewingId) : undefined;

  /* 整页档案视图 */
  if (viewingCandidate) {
    return (
      <StudentProfilePage
        key={viewingCandidate.id}
        candidate={ensureProfile(viewingCandidate)}
        positions={positions}
        adminMode={adminMode}
        onToggleAdmin={() => {
          audioEngine.play('click');
          setAdminMode(v => !v);
        }}
        onBack={() => setViewingId(null)}
        onSave={c => {
          onUpdateCandidate(c);
          setToast(`${c.name} 的档案已保存`);
          setEditedIds(prev => (prev.includes(c.id) ? prev : [...prev, c.id]));
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* 标题区 */}
      <div className="sd-box p-4 rounded-lg flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#4a2411] text-[#ffdf79] border border-[#d49b55]">
              [03]
            </span>
            <h3 className="font-serifSc font-black text-base text-[#3d1c0b]">学生档案</h3>
            <span className="text-[11px] text-stone-500 font-serifSc">
              分年级 · 分班级 · 整页档案
            </span>
          </div>
          <p className="text-xs text-stone-600 font-serifSc">
            点开「档案」查看整页信息（照片、民族、联系电话、个人经历、师长评语等），管理员模式开启后可逐项修改
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-1 rounded bg-[#eedcb1] border border-[#8b5329]/40 text-[10px] font-serifSc text-[#5b2b14]">
            <strong className="font-mono">{gradeGroups.length}</strong> 个年级
          </span>
          <span className="px-2 py-1 rounded bg-[#eedcb1] border border-[#8b5329]/40 text-[10px] font-serifSc text-[#5b2b14]">
            <strong className="font-mono">{totalClasses}</strong> 个班级
          </span>
          <span className="px-2 py-1 rounded bg-[#eedcb1] border border-[#8b5329]/40 text-[10px] font-serifSc text-[#5b2b14]">
            <strong className="font-mono">{candidates.length}</strong> 份档案
          </span>
          <button
            onClick={() => {
              audioEngine.play('click');
              setAdminMode(v => !v);
            }}
            className={`flex items-center gap-2 rounded border-2 px-3 py-1.5 text-[11px] font-serifSc transition-all ${
              adminMode
                ? 'border-[#1f3a14] bg-[#2f5121] font-bold text-[#eaf5e1] shadow-pixel-sm'
                : 'border-[#8b5329]/60 bg-[#eedcb1] text-[#5b2b14] hover:border-[#5b2b14] hover:bg-[#ffdf79]'
            }`}
            title={adminMode ? '点击关闭管理员权限（回到只读）' : '开启后可修订档案字段'}
          >
            <span className="relative flex h-2 w-2">
              {adminMode && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a8e08a] opacity-80" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  adminMode ? 'bg-[#a8e08a]' : 'bg-stone-400'
                }`}
              />
            </span>
            <span
              className={`relative h-3.5 w-7 rounded-full border transition-colors ${
                adminMode ? 'border-[#a8e08a] bg-[#487332]' : 'border-stone-400 bg-stone-300'
              }`}
            >
              <span
                className={`absolute top-[1px] h-2.5 w-2.5 rounded-full bg-white transition-all ${
                  adminMode ? 'left-[14px]' : 'left-[2px]'
                }`}
              />
            </span>
            管理员模式{adminMode ? '· 已开启' : '· 只读'}
          </button>
          <button
            onClick={openCreate}
            className={`px-3 py-1 rounded text-[11px] font-serifSc ${
              adminMode
                ? 'sd-btn-gold'
                : 'border border-dashed border-[#8b5329]/50 bg-[#eedcb1] text-stone-500 hover:border-[#8b5329]'
            }`}
          >
            ＋ 新建档案{adminMode ? '' : ' · 需管理员'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="px-3 py-2 rounded border-2 border-[#487332] bg-[#eaf5e1] text-[11px] text-[#2f5121] font-serifSc flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#487332]" />
          {toast}
        </div>
      )}

      {adminMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-[#487332] bg-[#eef7e6] px-3 py-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#487332] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2f5121]" />
          </span>
          <span className="rounded bg-[#2f5121] px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-[#eaf5e1]">
            ADMIN
          </span>
          <span className="text-[11px] font-serifSc font-bold text-[#2f5121]">
            管理员权限已开启 · 可修订 / 新建档案
          </span>
          <span className="text-[11px] font-serifSc text-[#2f5121]/80">
            点行尾「修订」可改基本信息与五维证据，点「档案」进入整页编辑（照片 / 经历 / 评语）
          </span>
          <button
            onClick={() => {
              audioEngine.play('click');
              setAdminMode(false);
            }}
            className="ml-auto rounded border border-[#2f5121] px-2 py-0.5 text-[10.5px] font-serifSc text-[#2f5121] hover:bg-[#2f5121] hover:text-[#eaf5e1]"
          >
            退出管理员模式
          </button>
        </div>
      )}

      {/* 筛选条 */}
      <div className="sd-box p-3 rounded-lg flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名、学号、班级或岗位"
            className="px-3 py-1.5 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] placeholder-stone-400 focus:outline-none w-56 font-serifSc"
          />
          <select
            value={sortBy}
            onChange={e => {
              audioEngine.play('click');
              setSortBy(e.target.value as 'score' | 'id' | 'name');
            }}
            className="px-2.5 py-1.5 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] focus:outline-none font-serifSc"
          >
            <option value="score">按综合分降序</option>
            <option value="id">按学号升序</option>
            <option value="name">按姓名排序</option>
          </select>
          <button
            onClick={() => {
              audioEngine.play('paper');
              setGradeFilter('all');
              setClassFilter(null);
              setSearch('');
            }}
            className="px-2.5 py-1.5 text-xs rounded border border-[#5b3117] bg-[#eedcb1] text-[#381f13] hover:bg-[#ffdf79] font-serifSc"
          >
            重置筛选
          </button>
        </div>
        <span className="text-[11px] text-stone-600 font-serifSc">
          当前视图 <strong className="font-mono text-[#5b3117]">{visibleGroups.length}</strong> 个班级 ·
          <strong className="font-mono text-[#5b3117]"> {visibleCount}</strong> 名学生
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[212px_1fr] gap-4 items-start">
        {/* 左：年级 / 班级目录 */}
        <div className="sd-box rounded-lg p-2 space-y-2 lg:sticky lg:top-[72px] max-h-[calc(100vh-96px)] overflow-y-auto">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-[#4a2411] font-serifSc">年级 / 班级目录</span>
            <button
              onClick={() => {
                audioEngine.play('click');
                setGradeFilter('all');
                setClassFilter(null);
              }}
              className={`text-[10px] font-serifSc px-1.5 py-0.5 rounded border ${
                gradeFilter === 'all' && !classFilter
                  ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55]'
                  : 'bg-[#eedcb1] text-[#5b2b14] border-[#8b5329]/40 hover:bg-[#ffdf79]'
              }`}
            >
              全部
            </button>
          </div>

          {gradeGroups.map(grade => (
            <div key={grade.name} className="rounded border border-[#8b5329]/40 overflow-hidden">
              <button
                onClick={() => {
                  audioEngine.play('paper');
                  setGradeFilter(grade.name);
                  setClassFilter(null);
                }}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-serifSc border-b transition-colors ${
                  gradeFilter === grade.name && !classFilter
                    ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55]'
                    : 'bg-[#eedcb1] text-[#4a2411] border-[#8b5329]/30 hover:bg-[#ffdf79]'
                }`}
              >
                <span className="font-bold">{grade.name}</span>
                <span className="ml-auto font-mono text-[10px] opacity-70">{grade.count}人</span>
              </button>
              <div className="bg-[#fbf2d5] divide-y divide-[#8b5329]/20">
                {grade.classes.map(cls => {
                  const active =
                    classFilter?.grade === cls.grade && classFilter?.className === cls.className;
                  return (
                    <button
                      key={cls.key}
                      onClick={() => {
                        audioEngine.play('click');
                        setGradeFilter(cls.grade);
                        setClassFilter({ grade: cls.grade, className: cls.className });
                      }}
                      className={`w-full flex items-center gap-1 pl-3.5 pr-2 py-1 text-[11px] font-serifSc transition-colors ${
                        active
                          ? 'bg-[#ffdf79]/70 text-[#381f13] font-bold border-l-2 border-[#8b5329]'
                          : 'text-stone-700 hover:bg-[#eedcb1] border-l-2 border-transparent'
                      }`}
                    >
                      <span className="truncate">{cls.className}</span>
                      <span className="ml-auto font-mono text-[10px] text-stone-500">
                        {cls.list.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 右：名册 + 编辑器 */}
        <div className="space-y-4 min-w-0">
          {draft && (
            <div ref={editorRef}>
              <ArchiveEditor
                draft={draft}
                isNew={draftIsNew}
                positions={positions}
                error={error}
                onChange={updater => setDraft(prev => (prev ? updater(prev) : prev))}
                onSave={handleSave}
                onCancel={closeEditor}
              />
            </div>
          )}

          {visibleGroups.length === 0 && (
            <div className="sd-box rounded-lg p-8 text-center text-xs text-stone-500 font-serifSc">
              当前筛选条件下没有匹配的在册档案，试试重置筛选条件。
            </div>
          )}

          {visibleGroups.map(group => (
            <div key={group.key} className="sd-box rounded-lg overflow-hidden">
              {/* 班级条 */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#381a0b] px-3 py-2 border-b-2 border-[#d49b55] text-[#fbf2d5]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#200d04] text-[#ffdf79] border border-[#d49b55]">
                    {group.grade}
                  </span>
                  <span className="font-serifSc font-bold text-xs">{group.className}</span>
                  <span className="text-[10px] font-mono text-[#eedcb1]/70">
                    {group.list.length} 人
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#eedcb1]/80">
                  <span>班均 {group.avg}</span>
                  <span className="text-[#8b5329]">|</span>
                  <span>待复核 {group.pending}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#eedcb1] text-[#4a2411] border-b border-[#8b5329]/50 font-serifSc">
                    <tr>
                      <th className="py-1.5 px-2.5">学生</th>
                      <th className="py-1.5 px-2.5">学号 / 性别</th>
                      <th className="py-1.5 px-2.5">申报岗位</th>
                      <th className="py-1.5 px-2.5 text-center">材料</th>
                      <th className="py-1.5 px-2.5 text-center">面试</th>
                      <th className="py-1.5 px-2.5 text-center">综合</th>
                      <th className="py-1.5 px-2.5">品级</th>
                      <th className="py-1.5 px-2.5 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5b3117]/20 font-serifSc text-stone-800 bg-[#fbf2d5]">
                    {group.list.map(c => {
                      const isEditing = draft?.id === c.id && !draftIsNew;
                      const wasEdited = editedIds.includes(c.id);
                      return (
                        <tr
                          key={c.id}
                          className={`transition-colors ${
                            isEditing
                              ? 'bg-amber-200/60'
                              : c.status === 'pending_review'
                              ? 'bg-red-50/60 hover:bg-amber-100/60'
                              : 'hover:bg-amber-100/60'
                          }`}
                        >
                          <td className="py-2 px-2.5 font-bold text-[#4a2817] whitespace-nowrap">
                            <button
                              onClick={() => openProfile(c)}
                              className="inline-flex items-center gap-1.5 hover:underline decoration-dotted"
                              title="打开整页档案"
                            >
                              {c.profile?.photoUrl ? (
                                <img
                                  src={c.profile.photoUrl}
                                  alt={c.name}
                                  className="w-5 h-5 rounded-full object-cover border border-[#8b5329]/50"
                                />
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-[#eedcb1] border border-[#8b5329]/50 text-[10px] text-[#8b5329] flex items-center justify-center">
                                  {c.name.slice(0, 1)}
                                </span>
                              )}
                              {c.name}
                            </button>
                            {wasEdited && (
                              <span className="ml-1 px-1 rounded bg-[#487332]/15 text-[#487332] text-[9px] border border-[#487332]/40">
                                已修订
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-stone-600 font-mono whitespace-nowrap">
                            {c.id} · {c.gender}
                          </td>
                          <td className="py-2 px-2.5 text-stone-700 max-w-[190px] truncate" title={c.position_name}>
                            {c.position_name}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#8b5329]">
                            {c.material_score}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono text-stone-700">
                            {c.interview_score}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-sm text-purple-900">
                            {c.composite_score}
                          </td>
                          <td className="py-2 px-2.5">
                            <MetricStars
                              score={c.composite_score}
                              isPendingReview={c.status === 'pending_review'}
                            />
                          </td>
                          <td className="py-2 px-2.5 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => openProfile(c)}
                              className="px-2 py-0.5 rounded border border-[#8b5329] bg-[#fbf2d5] text-[#5b2b14] hover:bg-[#ffdf79] text-[11px] font-serifSc"
                            >
                              档案
                            </button>
                            <button
                              onClick={() => openEdit(c)}
                              title={adminMode ? '修订该档案' : '需先开启管理员模式才能修订'}
                              className={`px-2 py-0.5 rounded border text-[11px] font-serifSc transition-colors ${
                                isEditing
                                  ? 'border-[#d49b55] bg-[#5b2b14] font-bold text-[#ffdf79]'
                                  : adminMode
                                  ? 'border-[#5b3117] bg-[#eedcb1] text-[#381f13] hover:bg-[#ffdf79]'
                                  : 'cursor-not-allowed border-stone-300 bg-stone-200 text-stone-400'
                              }`}
                            >
                              修订
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="text-[10px] text-[#eedcb1]/50 font-serifSc px-1">
            档案字段与评判总览同源，修订结果会同步至仲裁复核与凭据导出；当前为演示态，刷新页面后回到初始数据。
          </div>
        </div>
      </div>
    </div>
  );
};

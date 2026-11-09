import React, { useEffect, useMemo, useState } from 'react';
import { Candidate, MetricLevel, Position, StudentExperience, StudentProfile } from '../../types';
import { MetricStars } from '../MetricStars';
import { audioEngine } from '../../services/audioEngine';
import { ensureProfile } from '../../data/studentProfileSeed';

interface StudentProfilePageProps {
  candidate: Candidate;
  positions: Position[];
  adminMode: boolean;
  onToggleAdmin: () => void;
  onBack: () => void;
  onSave: (candidate: Candidate) => void;
}

const METRIC_META = [
  { key: 'm1', label: '德育思政' },
  { key: 'm2', label: '学业学术' },
  { key: 'm3', label: '学干履历' },
  { key: 'm4', label: '胜任设想' },
  { key: 'm5', label: '诚信规范' }
] as const;

const DEFAULT_WEIGHTS = { m1: 0.25, m2: 0.15, m3: 0.3, m4: 0.25, m5: 0.05 };

const cloneCandidate = (c: Candidate): Candidate => JSON.parse(JSON.stringify(ensureProfile(c)));

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

const parseMajor = (major: string) => {
  const matched = /^\s*(\d{4})\s*级\s*(.+?)\s*$/.exec(major || '');
  if (matched) return { grade: `${matched[1]}级`, className: matched[2] || '未分班' };
  return { grade: '年级未标注', className: (major || '未分班').trim() };
};

interface FieldProps {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  span?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  editing,
  onChange,
  placeholder,
  mono,
  span
}) => (
  <div
    className={`flex min-h-[34px] border-r border-b border-[#8b5329]/30 ${span ?? ''} ${
      editing ? 'bg-[#fff9e6]' : ''
    }`}
  >
    <div
      className={`w-[78px] shrink-0 px-2 py-1.5 text-[10.5px] font-bold border-r flex items-center gap-1 ${
        editing
          ? 'bg-[#f6dca6] text-[#7a3d0a] border-[#c8862a]/60'
          : 'bg-[#eedcb1]/55 text-[#4a2411] border-[#8b5329]/25'
      }`}
    >
      <span className="truncate">{label}</span>
      {editing && <span className="text-[9px] leading-none text-[#b06a10]">✎</span>}
    </div>
    <div className="flex-1 min-w-0 px-2 py-1 flex items-center">
      {editing ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || `请输入${label}`}
          className={`w-full rounded border border-[#c8862a]/80 bg-white px-1.5 py-0.5 text-[11.5px] text-[#381f13] placeholder-stone-400 shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] focus:border-[#b06a10] focus:outline-none focus:ring-2 focus:ring-[#c8862a]/30 ${
            mono ? 'font-mono' : ''
          }`}
        />
      ) : (
        <span className={`break-all text-[11.5px] text-[#381f13] ${mono ? 'font-mono' : ''}`}>
          {value || '—'}
        </span>
      )}
    </div>
  </div>
);

const SectionTitle: React.FC<{ num: string; title: string; extra?: React.ReactNode }> = ({
  num,
  title,
  extra
}) => (
  <div className="flex items-center gap-2 mt-4 mb-1.5">
    <span className="w-5 h-5 rounded-sm bg-[#5b2b14] text-[#ffdf79] text-[10px] font-mono flex items-center justify-center">
      {num}
    </span>
    <h4 className="font-serifSc font-bold text-xs text-[#3d1c0b] tracking-wider">{title}</h4>
    <div className="flex-1 h-[1px] bg-[#8b5329]/35" />
    {extra}
  </div>
);

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  candidate,
  positions,
  adminMode,
  onToggleAdmin,
  onBack,
  onSave
}) => {
  const [draft, setDraft] = useState<Candidate>(() => cloneCandidate(candidate));
  const [editing, setEditing] = useState(false);
  const [photoBroken, setPhotoBroken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState('');

  const profile = draft.profile as StudentProfile;
  const scores = useMemo(() => computeScores(draft, positions), [draft, positions]);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(cloneCandidate(candidate)),
    [draft, candidate]
  );

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(''), 2400);
    return () => clearTimeout(timer);
  }, [flash]);

  const patch = (updater: (prev: Candidate) => Candidate) => setDraft(prev => updater(prev));

  const patchProfile = (updater: (prev: StudentProfile) => StudentProfile) =>
    setDraft(prev => ({
      ...prev,
      profile: updater(prev.profile as StudentProfile)
    }));

  const handlePhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      patchProfile(p => ({ ...p, photoUrl: result }));
      setPhotoBroken(false);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!draft.name.trim()) {
      setError('姓名不能为空。');
      return;
    }
    if (!draft.major.trim()) {
      setError('年级班级不能为空。');
      return;
    }
    const nextProfile: StudentProfile = {
      ...profile,
      experiences: profile.experiences.filter(
        exp => exp.period.trim() || exp.org.trim() || exp.role.trim() || exp.description.trim()
      ),
      awards: profile.awards.map(a => a.trim()).filter(Boolean),
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      updatedBy: '管理员_戚墨然'
    };
    const next: Candidate = {
      ...draft,
      material_score: scores.material,
      composite_score: scores.composite,
      profile: nextProfile
    };
    onSave(next);
    setDraft(next);
    setEditing(false);
    setError(null);
    setFlash('档案已保存，并同步至评判总览与凭据导出');
    audioEngine.play('paper');
  };

  const cancel = () => {
    setDraft(cloneCandidate(candidate));
    setEditing(false);
    setError(null);
    setPhotoBroken(false);
    audioEngine.play('click');
  };

  const startEdit = () => {
    if (!adminMode) {
      setFlash('当前为只读身份，请先开启右上角「管理员模式」');
      return;
    }
    setDraft(cloneCandidate(candidate));
    setEditing(true);
    audioEngine.play('paper');
  };

  const { grade, className } = parseMajor(draft.major);
  const archiveNo = `HDU-AUTO-2026-${draft.id.slice(-4)}`;

  return (
    <div className="space-y-4">
      {/* 编辑态常驻提示条（滚动时吸顶，避免忘记保存） */}
      {editing && (
        <div className="sticky top-[58px] z-20">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-[#c8862a] bg-[#fff6de]/97 px-3 py-2 shadow-[0_6px_20px_rgba(120,70,10,0.28)] backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8862a] opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#b06a10]" />
            </span>
            <span className="font-serifSc font-black text-[13px] tracking-wide text-[#8b4a12]">
              编辑模式进行中
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                dirty
                  ? 'border-[#8b4a12] bg-[#c8862a] text-[#fff6de]'
                  : 'border-[#c8862a]/50 bg-[#eedcb1] text-[#8b4a12]'
              }`}
            >
              {dirty ? '有改动 · 未保存' : '暂无改动'}
            </span>
            <span className="hidden truncate text-[11px] font-serifSc text-[#8b4a12]/85 md:inline">
              正在修改 {draft.name || '未命名'} 的档案 · 保存后同步评判总览 / 仲裁复核 / 凭据导出
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={cancel}
                className="rounded border border-[#5b2b14] bg-[#eedcb1] px-2.5 py-1 text-[11px] font-serifSc text-[#381f13] hover:bg-[#ffdf79]"
              >
                放弃修改
              </button>
              <button onClick={save} className="sd-btn-gold rounded px-3.5 py-1 text-[11px] font-serifSc">
                保存档案
              </button>
            </div>
          </div>
        </div>
      )}

      {!editing && adminMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#487332]/60 bg-[#eef7e6] px-3 py-1.5">
          <span className="rounded bg-[#2f5121] px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-[#eaf5e1]">
            ADMIN
          </span>
          <span className="text-[11px] font-serifSc font-bold text-[#2f5121]">管理员权限已开启</span>
          <span className="text-[11px] font-serifSc text-[#2f5121]/80">
            点右上角「编辑档案」可修改本页全部字段（照片 / 个人经历 / 获奖 / 评语 / 五维证据）
          </span>
        </div>
      )}

      {/* 顶部工具条 */}
      <div
        className={`sd-box flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 ${
          editing ? 'ring-1 ring-[#c8862a]/70' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              audioEngine.play('click');
              onBack();
            }}
            className="px-2.5 py-1 rounded text-[11px] font-serifSc border border-[#5b3117] bg-[#eedcb1] text-[#381f13] hover:bg-[#ffdf79]"
          >
            ← 返回名册
          </button>
          <span className="font-serifSc text-[11px] text-stone-600 truncate">
            学生能力发展 <span className="text-[#8b5329]">/</span> 学生档案{' '}
            <span className="text-[#8b5329]">/</span> {grade}
            {className} <span className="text-[#8b5329]">/</span>{' '}
            <strong className="text-[#4a2411]">{draft.name}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {flash && (
            <span className="px-2 py-1 rounded bg-[#eaf5e1] border border-[#487332] text-[10.5px] text-[#2f5121] font-serifSc">
              {flash}
            </span>
          )}

          <button
            onClick={() => {
              audioEngine.play('click');
              onToggleAdmin();
            }}
            className={`flex items-center gap-2 rounded border-2 px-3 py-1.5 text-[11.5px] font-serifSc transition-all ${
              adminMode
                ? 'border-[#1f3a14] bg-[#2f5121] font-bold text-[#eaf5e1] shadow-pixel-sm'
                : 'border-[#8b5329]/60 bg-[#eedcb1] text-[#5b2b14] hover:border-[#5b2b14] hover:bg-[#ffdf79]'
            }`}
            title={adminMode ? '点击关闭管理员权限（回到只读）' : '开启后可编辑档案字段'}
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

          {editing ? (
            <>
              <span className="rounded border border-[#c8862a] bg-[#fff6de] px-2 py-1 text-[10.5px] font-bold font-serifSc text-[#8b4a12]">
                编辑中
              </span>
              <button
                onClick={cancel}
                className="rounded border border-[#5b2b14] bg-[#eedcb1] px-2.5 py-1 text-[11px] font-serifSc text-[#381f13] hover:bg-[#ffdf79]"
              >
                放弃
              </button>
              <button
                onClick={save}
                className="sd-btn-gold rounded px-3 py-1 text-[11px] font-serifSc"
              >
                保存档案
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className={`rounded px-3 py-1 text-[11px] font-serifSc ${
                adminMode
                  ? 'sd-btn-gold'
                  : 'border border-dashed border-[#8b5329]/50 bg-[#eedcb1] text-stone-500 hover:border-[#8b5329] hover:text-[#5b2b14]'
              }`}
            >
              {adminMode ? '编辑档案' : '编辑档案 · 需管理员'}
            </button>
          )}
        </div>
      </div>

      {/* 档案纸张 */}
      <div
        className={`sd-box rounded-lg overflow-hidden transition-shadow ${
          editing
            ? 'ring-2 ring-[#c8862a] ring-offset-2 ring-offset-[#f6ead0] shadow-[0_0_28px_rgba(200,134,42,0.22)]'
            : ''
        }`}
      >
        {/* 抬头 */}
        <div className="px-4 sm:px-6 pt-4 pb-3 bg-gradient-to-b from-[#fbf2d5] to-[#f6ead0] border-b-4 border-double border-[#5b2b14]/70">
          {editing && (
            <div className="mb-1.5 flex items-center justify-center gap-2 rounded border border-[#c8862a]/70 bg-[#fff6de] py-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c8862a]" />
              <span className="font-serifSc text-[10px] font-bold tracking-[0.2em] text-[#8b4a12]">
                编辑中 · 修改后请点「保存档案」写入
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="text-[9px] tracking-[0.3em] text-[#8b5329]/70 font-mono">
              HANGZHOU DIANZI UNIVERSITY · STUDENT ARCHIVE
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-[#8b5329]">
              <span>档案编号 {archiveNo}</span>
              <span className="text-[#8b5329]/50">|</span>
              <span>密级：内部 · 仅限评审</span>
            </div>
          </div>
          <h2 className="text-center font-serifSc font-black text-xl sm:text-2xl tracking-[0.35em] text-[#3d1c0b] mt-1">
            学 生 档 案
          </h2>
          <p className="text-center text-[11px] text-stone-600 font-serifSc mt-0.5">
            自动化学院 · 2026级新生干部选拔在册档案（与评判总览同源）
          </p>
        </div>

        <div className="p-4 sm:p-5">
          {/* 照片 + 概要 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="shrink-0">
              <div className="w-[122px] h-[156px] rounded-sm border-2 border-[#5b2b14] bg-[#eedcb1] overflow-hidden flex items-center justify-center shadow-[inset_0_0_14px_rgba(139,83,41,0.28)] relative">
                {profile.photoUrl && !photoBroken ? (
                  <img
                    src={profile.photoUrl}
                    alt={`${draft.name}证件照`}
                    className="w-full h-full object-cover"
                    onError={() => setPhotoBroken(true)}
                  />
                ) : (
                  <div className="text-center">
                    <div className="font-serifSc text-4xl font-black text-[#8b5329]/45">
                      {draft.name.slice(0, 1) || '?'}
                    </div>
                    <div className="text-[9px] text-[#8b5329]/60 mt-1 font-serifSc">
                      证件照待采集
                    </div>
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-[#381a0b]/70 text-[#eedcb1] py-0.5 font-serifSc">
                  一寸免冠照
                </span>
              </div>

              {editing && (
                <div className="mt-1.5 space-y-1 w-[122px]">
                  <label className="block text-center text-[10px] py-1 rounded border border-[#5b3117] bg-[#eedcb1] text-[#381f13] cursor-pointer hover:bg-[#ffdf79] font-serifSc">
                    上传照片
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handlePhoto(e.target.files?.[0])}
                    />
                  </label>
                  <input
                    value={profile.photoUrl?.startsWith('data:') ? '' : profile.photoUrl ?? ''}
                    onChange={e => {
                      setPhotoBroken(false);
                      patchProfile(p => ({ ...p, photoUrl: e.target.value }));
                    }}
                    placeholder="或粘贴图片链接"
                    className="w-full px-1 py-0.5 text-[9px] rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)]/70 text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30"
                  />
                  {profile.photoUrl && (
                    <button
                      onClick={() => patchProfile(p => ({ ...p, photoUrl: undefined }))}
                      className="w-full text-[9px] py-0.5 rounded border border-[#a93226]/50 text-[#a93226] hover:bg-red-50 font-serifSc"
                    >
                      清除照片
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-serifSc font-black text-2xl text-[#3d1c0b] tracking-wider">
                  {draft.name || '未命名'}
                </span>
                <span className="text-[11px] font-mono text-stone-600">学号 {draft.id}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#eedcb1] border border-[#8b5329]/40 text-[10px] font-serifSc text-[#5b2b14]">
                  {grade} · {className}
                </span>
                <MetricStars score={draft.composite_score} isPendingReview={draft.status === 'pending_review'} />
              </div>
              <p className="text-[11px] text-stone-700 font-serifSc mt-1">
                申报岗位：<strong className="text-[#4a2411]">{draft.position_name}</strong>
              </p>

              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <div className="px-2 py-1 rounded bg-[#eedcb1]/70 border border-[#8b5329]/35 text-center">
                  <div className="text-[9px] text-stone-600 font-serifSc">材料初评</div>
                  <div className="font-mono font-bold text-[#8b5329]">{scores.material}</div>
                </div>
                <div className="px-2 py-1 rounded bg-[#eedcb1]/70 border border-[#8b5329]/35 text-center">
                  <div className="text-[9px] text-stone-600 font-serifSc">现场面试</div>
                  <div className="font-mono font-bold text-stone-700">{draft.interview_score}</div>
                </div>
                <div className="px-2 py-1 rounded bg-[#eedcb1]/70 border border-[#8b5329]/35 text-center">
                  <div className="text-[9px] text-stone-600 font-serifSc">综合总分</div>
                  <div className="font-mono font-bold text-purple-900 text-sm">{scores.composite}</div>
                </div>
                <div className="px-2 py-1 rounded bg-[#eedcb1]/70 border border-[#8b5329]/35 text-center">
                  <div className="text-[9px] text-stone-600 font-serifSc">在册状态</div>
                  <div className="text-[11px] font-serifSc font-bold text-[#2f5121]">
                    {draft.status === 'pending_review' ? '待复核' : '已归档'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 一、基本信息 */}
          <SectionTitle num="一" title="基本信息" extra={<span className="text-[9px] text-stone-500 font-serifSc">共 18 项 · 与高中档案信息项对齐</span>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 border-t border-l border-[#8b5329]/30">
            <Field
              label="姓名"
              value={draft.name}
              editing={editing}
              onChange={v => patch(prev => ({ ...prev, name: v }))}
            />
            <Field
              label="性别"
              value={draft.gender}
              editing={editing}
              onChange={v => patch(prev => ({ ...prev, gender: v }))}
              placeholder="男 / 女"
            />
            <Field
              label="民族"
              value={profile.ethnicity}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, ethnicity: v }))}
            />
            <Field
              label="出生年月"
              value={profile.birthDate}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, birthDate: v }))}
            />
            <Field
              label="政治面貌"
              value={profile.politicalStatus}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, politicalStatus: v }))}
            />
            <Field
              label="籍贯"
              value={profile.nativePlace}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, nativePlace: v }))}
            />
            <Field
              label="身份证号"
              value={profile.idNumber}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, idNumber: v }))}
              mono
            />
            <Field
              label="联系电话"
              value={profile.phone}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, phone: v }))}
              mono
            />
            <Field
              label="电子邮箱"
              value={profile.email}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, email: v }))}
              mono
            />
            <Field
              label="毕业中学"
              value={profile.graduationSchool}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, graduationSchool: v }))}
              span="sm:col-span-2"
            />
            <Field
              label="健康状况"
              value={profile.health}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, health: v }))}
            />
            <Field
              label="家庭住址"
              value={profile.address}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, address: v }))}
              span="sm:col-span-2 xl:col-span-3"
            />
            <Field
              label="兴趣爱好"
              value={profile.hobbies}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, hobbies: v }))}
            />
            <Field
              label="特长"
              value={profile.specialties}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, specialties: v }))}
            />
            <Field
              label="紧急联系人"
              value={profile.emergencyContact}
              editing={editing}
              onChange={v => patchProfile(p => ({ ...p, emergencyContact: v }))}
            />
            <Field
              label="年级班级"
              value={draft.major}
              editing={editing}
              onChange={v => patch(prev => ({ ...prev, major: v }))}
              placeholder="2026级自动化1班"
              span="sm:col-span-2"
            />
            <Field
              label="申报岗位"
              value={draft.position_name}
              editing={editing}
              onChange={v => {
                const picked = positions.find(p => p.name === v);
                patch(prev => ({
                  ...prev,
                  position_name: v,
                  position_id: picked ? picked.id : prev.position_id
                }));
              }}
              placeholder="填写或粘贴岗位全称"
            />
          </div>

          {/* 二、个人经历 */}
          <SectionTitle
            num="二"
            title="个人经历"
            extra={
              editing ? (
                <button
                  onClick={() => {
                    audioEngine.play('click');
                    patchProfile(p => ({
                      ...p,
                      experiences: [
                        ...p.experiences,
                        {
                          id: `exp_${Date.now()}`,
                          period: '',
                          org: '',
                          role: '',
                          description: ''
                        }
                      ]
                    }));
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-[#5b3117] bg-[#eedcb1] hover:bg-[#ffdf79] font-serifSc"
                >
                  ＋ 添加一段
                </button>
              ) : (
                <span className="text-[9px] text-stone-500 font-serifSc">
                  共 {profile.experiences.length} 段
                </span>
              )
            }
          />
          <div className="space-y-2">
            {profile.experiences.map((exp: StudentExperience, idx) => (
              <div
                key={exp.id}
                className="rounded border border-[#8b5329]/30 bg-white/55 p-2"
              >
                {editing ? (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <input
                        value={exp.period}
                        onChange={e =>
                          patchProfile(p => ({
                            ...p,
                            experiences: p.experiences.map(x =>
                              x.id === exp.id ? { ...x, period: e.target.value } : x
                            )
                          }))
                        }
                        placeholder="起止时间 2022.09 - 2025.06"
                        className="px-1.5 py-1 text-[11px] rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] font-mono focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30"
                      />
                      <input
                        value={exp.org}
                        onChange={e =>
                          patchProfile(p => ({
                            ...p,
                            experiences: p.experiences.map(x =>
                              x.id === exp.id ? { ...x, org: e.target.value } : x
                            )
                          }))
                        }
                        placeholder="单位 / 学校"
                        className="px-1.5 py-1 text-[11px] rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30"
                      />
                      <input
                        value={exp.role}
                        onChange={e =>
                          patchProfile(p => ({
                            ...p,
                            experiences: p.experiences.map(x =>
                              x.id === exp.id ? { ...x, role: e.target.value } : x
                            )
                          }))
                        }
                        placeholder="担任职务 / 角色"
                        className="px-1.5 py-1 text-[11px] rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30"
                      />
                    </div>
                    <textarea
                      value={exp.description}
                      onChange={e =>
                        patchProfile(p => ({
                          ...p,
                          experiences: p.experiences.map(x =>
                            x.id === exp.id ? { ...x, description: e.target.value } : x
                          )
                        }))
                      }
                      rows={2}
                      placeholder="具体做了什么、取得什么结果"
                      className="w-full px-1.5 py-1 text-[11px] rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30 resize-y"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          patchProfile(p => ({
                            ...p,
                            experiences: p.experiences.filter(x => x.id !== exp.id)
                          }))
                        }
                        className="text-[10px] px-1.5 py-0.5 rounded border border-[#a93226]/50 text-[#a93226] hover:bg-red-50 font-serifSc"
                      >
                        删除此段
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-[104px] shrink-0 text-[10.5px] font-mono text-[#8b5329]">
                      {exp.period || '—'}
                      <div className="text-[9px] text-stone-400 mt-0.5">第 {idx + 1} 段</div>
                    </div>
                    <div className="flex-1 min-w-0 border-l border-[#8b5329]/30 pl-3">
                      <div className="text-[11.5px] font-bold text-[#4a2411] font-serifSc">
                        {exp.org} <span className="text-[#8b5329]">·</span> {exp.role}
                      </div>
                      <p className="text-[11px] text-stone-700 leading-relaxed mt-0.5">
                        {exp.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 三、获奖情况 */}
          <SectionTitle
            num="三"
            title="获奖与证书"
            extra={
              editing ? (
                <button
                  onClick={() =>
                    patchProfile(p => ({ ...p, awards: [...p.awards, ''] }))
                  }
                  className="text-[10px] px-1.5 py-0.5 rounded border border-[#5b3117] bg-[#eedcb1] hover:bg-[#ffdf79] font-serifSc"
                >
                  ＋ 添加一项
                </button>
              ) : (
                <span className="text-[9px] text-stone-500 font-serifSc">
                  共 {profile.awards.length} 项
                </span>
              )
            }
          />
          {editing ? (
            <div className="space-y-1.5">
              {profile.awards.map((award, idx) => (
                <div key={`award_${idx}`} className="flex items-center gap-1.5">
                  <span className="w-4 text-[10px] font-mono text-[#8b5329]">{idx + 1}.</span>
                  <input
                    value={award}
                    onChange={e =>
                      patchProfile(p => ({
                        ...p,
                        awards: p.awards.map((a, i) => (i === idx ? e.target.value : a))
                      }))
                    }
                    placeholder="奖项 / 证书名称"
                    className="flex-1 px-1.5 py-1 text-[11px] rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30"
                  />
                  <button
                    onClick={() =>
                      patchProfile(p => ({ ...p, awards: p.awards.filter((_, i) => i !== idx) }))
                    }
                    className="text-[10px] px-1.5 py-0.5 rounded border border-[#a93226]/50 text-[#a93226] hover:bg-red-50 font-serifSc"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {profile.awards.map((award, idx) => (
                <li key={`award_view_${idx}`} className="flex items-start gap-1.5 text-[11px] text-stone-800 font-serifSc">
                  <span className="mt-1 w-1 h-1 rounded-full bg-[#8b5329] shrink-0" />
                  {award}
                </li>
              ))}
            </ul>
          )}

          {/* 四、自我评价与师长评语 */}
          <SectionTitle num="四" title="自我评价与师长评语" />
          <div className="rounded border border-[#8b5329]/30 bg-white/55 divide-y divide-[#8b5329]/25">
            <div className="p-2.5">
              <div className="text-[10.5px] font-bold text-[#5b2b14] font-serifSc mb-1">自我评价</div>
              {editing ? (
                <textarea
                  value={profile.selfEvaluation}
                  onChange={e => patchProfile(p => ({ ...p, selfEvaluation: e.target.value }))}
                  rows={3}
                  className="w-full px-2 py-1 text-[11px] leading-relaxed rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30 resize-y"
                />
              ) : (
                <p className="text-[11px] leading-relaxed text-stone-800 font-serifSc">
                  {profile.selfEvaluation}
                </p>
              )}
            </div>

            <div className="p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] font-bold text-[#5b2b14] font-serifSc">
                  班主任评语
                </span>
                <span className="text-[10px] text-stone-600 font-serifSc">
                  班主任：
                  {editing ? (
                    <input
                      value={profile.headTeacher}
                      onChange={e => patchProfile(p => ({ ...p, headTeacher: e.target.value }))}
                      className="ml-1 w-20 px-1 py-0.5 text-[10px] rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30"
                    />
                  ) : (
                    <strong className="text-[#4a2411]">{profile.headTeacher}</strong>
                  )}
                </span>
              </div>
              {editing ? (
                <textarea
                  value={profile.teacherComment}
                  onChange={e => patchProfile(p => ({ ...p, teacherComment: e.target.value }))}
                  rows={3}
                  className="w-full px-2 py-1 text-[11px] leading-relaxed rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30 resize-y"
                />
              ) : (
                <p className="text-[11px] leading-relaxed text-stone-800 font-serifSc">
                  {profile.teacherComment}
                </p>
              )}
            </div>

            <div className="p-2.5">
              <div className="text-[10.5px] font-bold text-[#5b2b14] font-serifSc mb-1">
                辅导员意见
              </div>
              {editing ? (
                <textarea
                  value={profile.counselorComment}
                  onChange={e => patchProfile(p => ({ ...p, counselorComment: e.target.value }))}
                  rows={2}
                  className="w-full px-2 py-1 text-[11px] leading-relaxed rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30 resize-y"
                />
              ) : (
                <p className="text-[11px] leading-relaxed text-stone-800 font-serifSc">
                  {profile.counselorComment}
                </p>
              )}
            </div>
          </div>

          {/* 五、五维证据与成绩 */}
          <SectionTitle
            num="五"
            title="五维证据档案与成绩"
            extra={
              <span className="text-[9px] text-stone-500 font-serifSc">
                权重来源：{scores.matchedPosition ? scores.matchedPosition.name : '系统默认配比'}
              </span>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {METRIC_META.map(meta => {
              const metric = draft.metrics[meta.key];
              return (
                <div key={meta.key} className="p-2 rounded border border-[#8b5329]/30 bg-white/55">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-stone-800 font-serifSc">
                      {meta.label}
                    </span>
                    {editing ? (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(lv => (
                          <button
                            key={lv}
                            onClick={() =>
                              patch(prev => ({
                                ...prev,
                                metrics: {
                                  ...prev.metrics,
                                  [meta.key]: { ...prev.metrics[meta.key], level: lv as MetricLevel }
                                }
                              }))
                            }
                            className={`w-5 h-5 rounded text-[10px] font-mono border ${
                              metric.level === lv
                                ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55] font-bold'
                                : 'bg-[#eedcb1]/60 text-[#8b5329] border-[#8b5329]/30 hover:bg-[#ffdf79]'
                            }`}
                          >
                            {lv}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <MetricStars level={metric.level} />
                    )}
                  </div>
                  {editing ? (
                    <textarea
                      value={metric.evidence}
                      onChange={e =>
                        patch(prev => ({
                          ...prev,
                          metrics: {
                            ...prev.metrics,
                            [meta.key]: { ...prev.metrics[meta.key], evidence: e.target.value }
                          }
                        }))
                      }
                      rows={2}
                      className="mt-1 w-full px-1.5 py-1 text-[11px] leading-snug rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] text-[#381f13] focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30 resize-y"
                    />
                  ) : (
                    <p className="mt-1 text-[11px] leading-snug text-stone-700 font-serifSc">
                      {metric.evidence || '—'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {editing && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-serifSc">
              <label className="text-stone-600">
                现场面试分
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={draft.interview_score}
                  onChange={e =>
                    patch(prev => ({
                      ...prev,
                      interview_score: Math.max(0, Math.min(100, Number(e.target.value) || 0))
                    }))
                  }
                  className="mt-0.5 w-full px-1.5 py-1 text-[11px] rounded border border-[#c8862a]/80 bg-white shadow-[inset_0_1px_2px_rgba(139,83,41,0.12)] font-mono focus:outline-none focus:border-[#b06a10] focus:ring-2 focus:ring-[#c8862a]/30"
                />
              </label>
              <div className="px-2 py-1 rounded bg-[#eedcb1]/70 border border-[#8b5329]/35">
                <div className="text-[9px] text-stone-600">材料初评（自动折算）</div>
                <div className="font-mono font-bold text-[#8b5329]">{scores.material}</div>
              </div>
              <div className="px-2 py-1 rounded bg-[#eedcb1]/70 border border-[#8b5329]/35">
                <div className="text-[9px] text-stone-600">综合总分（自动折算）</div>
                <div className="font-mono font-bold text-purple-900">{scores.composite}</div>
              </div>
              <div className="px-2 py-1 rounded bg-[#eedcb1]/70 border border-[#8b5329]/35">
                <div className="text-[9px] text-stone-600">折算规则</div>
                <div className="text-[10px] text-stone-700">面试 40% + 材料 60%</div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-2 px-2.5 py-1.5 rounded bg-red-100 border border-red-400 text-[11px] text-red-800 font-serifSc">
              {error}
            </div>
          )}

          {/* 维护记录与签字 */}
          <div className="mt-4 pt-2.5 border-t border-dashed border-[#8b5329]/40 flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-stone-500 font-mono">
            <span>
              最近维护：{profile.updatedAt ? `${profile.updatedAt} · ${profile.updatedBy}` : '2026-09-08 · 系统建档'}
            </span>
            <span>建档来源：申报材料自动解析 + 人工补录</span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-serifSc text-stone-600">
            <div className="border border-dashed border-[#8b5329]/45 rounded h-14 px-2 py-1 bg-white/40">
              学生签名（化名）
              <div className="text-[9px] text-stone-400 mt-4">确认档案信息真实有效</div>
            </div>
            <div className="border border-dashed border-[#8b5329]/45 rounded h-14 px-2 py-1 bg-white/40">
              班主任签字
              <div className="text-[9px] text-stone-400 mt-4">{profile.headTeacher} · 已核验</div>
            </div>
            <div className="border border-dashed border-[#8b5329]/45 rounded h-14 px-2 py-1 bg-white/40">
              学院意见
              <div className="text-[9px] text-stone-400 mt-4">自动化学院学生工作办公室（盖章）</div>
            </div>
          </div>

          <p className="mt-3 text-[9.5px] text-stone-500 font-serifSc leading-relaxed">
            说明：本档案与「评判总览」共用同一份学生数据，管理员在此修改后将同步至仲裁复核与凭据导出；
            身份证号、联系方式默认脱敏展示，仅限评审授权范围内使用。当前为演示环境，刷新页面后回到初始档案。
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { AuditLog, Candidate, Position } from '../../types';
import { audioEngine } from '../../services/audioEngine';

interface ComplianceViewProps {
  candidates: Candidate[];
  positions: Position[];
  auditLogs: AuditLog[];
  onGoToBench: () => void;
}

const GANTT = [
  { phase: '指标梳理与现场访谈', start: 1, span: 2, owner: '刘裕', deliverable: '五维指标与档位定义 v1' },
  { phase: '解析模块与文本清洗', start: 3, span: 3, owner: '任富康', deliverable: '段落级解析 + 证据句定位' },
  { phase: '判档算分与一致性校准', start: 6, span: 3, owner: '刘裕', deliverable: '40 份样本校准报告' },
  { phase: '前端三页与导出留痕', start: 9, span: 3, owner: '朱晨', deliverable: '规则/上传/结果/复核/导出' },
  { phase: '对照测试与演示准备', start: 12, span: 2, owner: '戚墨然', deliverable: '测试报告 + 可演示原型' }
];

const MILESTONES = [
  { week: 5, label: '解析模块完成' },
  { week: 10, label: '校准报告完成' },
  { week: 13, label: '原型可演示' }
];

const PRIVACY_MATRIX = [
  { role: '管理员', scope: '规则模板 · 岗位权重 · 账号授权', raw: '可上传', id: '完整', log: '可查' },
  { role: '复核人', scope: '被指派样本的原文与档位', raw: '只读', id: '脱敏', log: '可查' },
  { role: '评审组', scope: '排名总表与分项明细', raw: '不可见', id: '脱敏', log: '不可查' },
  { role: '学生本人', scope: '本人档案与培养建议', raw: '仅本人材料', id: '脱敏', log: '申诉记录' }
];

export const ComplianceView: React.FC<ComplianceViewProps> = ({
  candidates,
  positions,
  auditLogs,
  onGoToBench
}) => {
  const [tab, setTab] = useState<'risk' | 'gantt' | 'privacy'>('risk');

  /* ---------- 异常标记四类 ---------- */
  const anomalies = useMemo(() => {
    const parseFail = candidates.filter(c => c.status === 'failed');
    const noEvidence = candidates.filter(c =>
      (['m1', 'm2', 'm3', 'm4', 'm5'] as const).some(k => !c.metrics[k].evidence?.trim())
    );
    const contradict = candidates.filter(c => {
      const levels = (['m1', 'm2', 'm3', 'm4', 'm5'] as const).map(k => c.metrics[k].level);
      const avg = levels.reduce((s, v) => s + v, 0) / 5;
      const implied = (avg / 5) * 100;
      return Math.abs(implied - c.material_score) > 12;
    });
    const conflict = candidates.filter(c =>
      (['m1', 'm2', 'm3', 'm4', 'm5'] as const).some(k => c.metrics[k].confidence < 0.7)
    );
    return [
      {
        key: 'parse',
        title: '解析失败',
        desc: '文件损坏、扫描件无文本层或格式不受支持，正文未能抽取。',
        list: parseFail,
        tone: 'border-[#a93226] bg-[#fdecea] text-[#a93226]'
      },
      {
        key: 'evidence',
        title: '证据句缺失',
        desc: '模型给出档位但未能在原文定位可引用句子，复核人无法核验。',
        list: noEvidence,
        tone: 'border-[#c47b2a] bg-[#fdf1e0] text-[#8a4f0d]'
      },
      {
        key: 'contradiction',
        title: '档位与总分矛盾',
        desc: '逐项档位折算的理论分与实际材料分相差超过 12 分，疑似权重或档位写入异常。',
        list: contradict,
        tone: 'border-[#b08a2a] bg-[#fbf6dd] text-[#6f5510]'
      },
      {
        key: 'conflict',
        title: '段落判断冲突',
        desc: '同一份材料不同段落的判定互相矛盾，或单项置信度低于 0.70。',
        list: conflict,
        tone: 'border-[#487332] bg-[#eaf5e1] text-[#2f5121]'
      }
    ];
  }, [candidates]);

  /* ---------- 录取线与双重仲裁 ---------- */
  const quota = Math.min(
    positions.reduce((s, p) => s + p.target_quota, 0),
    candidates.length
  );
  const sorted = [...candidates].sort((a, b) => b.composite_score - a.composite_score);
  const cutoff = sorted[Math.max(quota - 1, 0)]?.composite_score ?? 60;
  const band = sorted.filter(c => Math.abs(c.composite_score - cutoff) <= cutoff * 0.05);

  const dualList = band.map(c => {
    const seed = Number(c.id.slice(-2)) || 7;
    const diff = seed % 3 === 0 ? 2 : seed % 3 === 1 ? 0 : 1;
    return { candidate: c, diff, third: diff > 1 };
  });

  const openAnomalies = anomalies.reduce((s, a) => s + a.list.length, 0);
  const thirdCount = dualList.filter(d => d.third).length;

  const tabs = [
    { id: 'risk' as const, label: '异常与仲裁', hint: '四类异常标记 · 录取线上下 5% 双评' },
    { id: 'gantt' as const, label: '13 周实施计划', hint: '五阶段甘特与三个里程碑' },
    { id: 'privacy' as const, label: '数据与隐私', hint: '角色授权矩阵与留痕规则' }
  ];

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="sd-box anim-fade-up rounded-lg p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded border border-[#d49b55] bg-[#4a2411] px-2 py-0.5 font-mono text-[10px] text-[#ffdf79]">
                [04]
              </span>
              <h3 className="font-serifSc text-base font-black text-[#3d1c0b]">质量与合规控制台</h3>
              <span className="font-serifSc text-[10.5px] text-stone-500">
                异常标记 · 双重评判仲裁 · 改判留痕 · 隐私分级
              </span>
            </div>
            <p className="font-serifSc text-xs text-stone-600">
              系统只给建议档位与理由，改档与否决权始终在复核人手里；每一次改动都可追溯到人、到时间、到理由
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Chip label="待处理异常" value={openAnomalies} tone="danger" />
            <Chip label="进入第三人裁定" value={thirdCount} tone="warn" />
            <Chip label="改判记录" value={auditLogs.length} tone="ok" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#5b3117]/20 pt-2">
          {tabs.map(t => (
            <button
              key={t.id}
              title={t.hint}
              onClick={() => {
                audioEngine.play('click');
                setTab(t.id);
              }}
              className={`rounded border px-2.5 py-1 font-serifSc text-[11px] transition-all ${
                tab === t.id
                  ? 'border-[#d49b55] bg-[#5b2b14] font-bold text-[#ffdf79] shadow-pixel-sm'
                  : 'border-[#8b5329]/40 bg-[#eedcb1] text-[#381f13] hover:bg-[#ffdf79]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'risk' && (
        <div className="space-y-4">
          {/* 四类异常 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {anomalies.map((a, idx) => (
              <div
                key={a.key}
                className="sd-box anim-fade-up sd-hover-lift rounded-lg p-3"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 font-serifSc text-[10px] font-bold ${a.tone}`}>
                    {a.title}
                  </span>
                  <span className="ml-auto font-mono text-lg font-black text-[#5b2b14]">
                    {a.list.length}
                  </span>
                  <span className="font-serifSc text-[9.5px] text-stone-500">例</span>
                </div>
                <p className="mt-1 font-serifSc text-[10px] leading-relaxed text-stone-600">{a.desc}</p>
                <div className="mt-1.5 space-y-0.5">
                  {a.list.slice(0, 3).map(c => (
                    <div key={c.id} className="flex items-center gap-1.5 font-serifSc text-[10px] text-stone-700">
                      <span className="h-1 w-1 rounded-full bg-[#8b5329]" />
                      {c.name}
                      <span className="font-mono text-[9px] text-stone-400">{c.id}</span>
                      <span className="ml-auto font-mono text-[9px] text-[#8b5329]">
                        综合 {c.composite_score}
                      </span>
                    </div>
                  ))}
                  {a.list.length === 0 && (
                    <div className="font-serifSc text-[10px] text-[#487332]">当前批次无此类异常</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 双重仲裁 */}
          <div className="sd-box anim-fade-up rounded-lg p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
                <span className="h-3 w-1 bg-[#8b5329]" />
                双重评判仲裁区间
              </h4>
              <span className="rounded bg-[#eedcb1] px-1.5 py-0.5 font-mono text-[9.5px] text-[#5b2b14]">
                录取线 {cutoff.toFixed(1)} · 区间 ±5%（{Math.max(0, cutoff * 0.95).toFixed(1)} ~{' '}
                {(cutoff * 1.05).toFixed(1)}）
              </span>
            </div>

            <div className="mb-3">
              <div className="relative h-9 rounded border border-[#8b5329]/30 bg-[#eedcb1]/50">
                <div
                  className="absolute inset-y-0 rounded bg-[#487332]/15"
                  style={{
                    left: `${Math.max(0, 50 - 8)}%`,
                    width: '16%'
                  }}
                />
                <div className="absolute inset-y-0 left-1/2 w-[2px] bg-[#a93226]" />
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full pb-0.5 font-mono text-[9px] text-[#a93226]">
                  录取线
                </span>
                {dualList.map(d => {
                  const pos = Math.max(
                    2,
                    Math.min(98, 50 + ((d.candidate.composite_score - cutoff) / (cutoff * 0.05)) * 8)
                  );
                  return (
                    <span
                      key={d.candidate.id}
                      title={`${d.candidate.name} ${d.candidate.composite_score}`}
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#5b2b14] bg-[#d49b55]"
                      style={{ left: `${pos}%` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              {dualList.length === 0 && (
                <div className="font-serifSc text-[10.5px] text-stone-500">
                  本批次没有落在录取线 ±5% 区间内的样本，无需触发双人复核。
                </div>
              )}
              {dualList.map((d, idx) => (
                <div
                  key={d.candidate.id}
                  className="anim-fade-up flex flex-wrap items-center gap-2 rounded border border-[#8b5329]/25 bg-white/70 px-2 py-1.5"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <span className="font-serifSc text-[10.5px] font-bold text-stone-800">{d.candidate.name}</span>
                  <span className="font-mono text-[9.5px] text-stone-500">{d.candidate.id}</span>
                  <span className="font-mono text-[10px] text-[#8b5329]">综合 {d.candidate.composite_score}</span>
                  <span className="font-serifSc text-[9.5px] text-stone-600">
                    两位复核人档位差 {d.diff} 档
                  </span>
                  <span
                    className={`ml-auto rounded border px-1.5 py-0.5 font-serifSc text-[9px] ${
                      d.third
                        ? 'border-[#a93226] bg-red-50 text-[#a93226]'
                        : 'border-[#487332] bg-[#eaf5e1] text-[#2f5121]'
                    }`}
                  >
                    {d.third ? '差 >1 档 · 进入第三人裁定' : '差 ≤1 档 · 取平均后复核确认'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#5b3117]/20 pt-2">
              <span className="font-serifSc text-[9.5px] text-stone-500">
                规则：区间内样本由两位复核人独立给档，相差超过一档由第三人裁定并留痕
              </span>
              <button
                onClick={() => {
                  audioEngine.play('click');
                  onGoToBench();
                }}
                className="sd-btn-gold rounded px-3 py-1 font-serifSc text-[10.5px] font-bold"
              >
                进入复核仲裁 →
              </button>
            </div>
          </div>

          {/* 改判留痕 */}
          <div className="sd-box anim-fade-up rounded-lg p-3.5">
            <h4 className="mb-2 flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
              <span className="h-3 w-1 bg-[#8b5329]" />
              改判留痕（最近记录）
            </h4>
            <div className="space-y-1.5">
              {auditLogs.slice(0, 6).map((log, idx) => (
                <div
                  key={log.id}
                  className="anim-fade-up flex flex-wrap items-center gap-2 rounded border border-[#8b5329]/25 bg-white/65 px-2 py-1.5"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <span className="font-mono text-[9.5px] text-stone-500">{log.timestamp}</span>
                  <span className="font-serifSc text-[10.5px] font-bold text-stone-800">{log.operator}</span>
                  <span className="font-serifSc text-[10px] text-stone-600">{log.action}</span>
                  <span className="font-serifSc text-[10px] text-stone-700">
                    {log.targetStudentName} · {log.metricId.toUpperCase()} {log.oldLevel}→{log.newLevel} 档
                  </span>
                  <span className="ml-auto max-w-[46%] truncate font-serifSc text-[9.5px] text-stone-500">
                    理由：{log.reason}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="font-serifSc text-[10.5px] text-stone-500">暂无改判记录。</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'gantt' && (
        <div className="sd-box anim-fade-up rounded-lg p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
              <span className="h-3 w-1 bg-[#8b5329]" />
              十三周实施计划（五阶段 · 三里程碑）
            </h4>
            <span className="font-serifSc text-[10px] text-stone-500">
              里程碑：{MILESTONES.map(m => `W${m.week} ${m.label}`).join(' · ')}
            </span>
          </div>

          {/* 周刻度 */}
          <div className="mb-1 flex pl-[190px]">
            {Array.from({ length: 13 }).map((_, i) => (
              <div key={i} className="flex-1 text-center font-mono text-[8.5px] text-stone-400">
                {i + 1}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {GANTT.map((g, idx) => (
              <div key={g.phase} className="anim-fade-up flex items-center gap-2" style={{ animationDelay: `${idx * 0.07}s` }}>
                <div className="w-[186px] shrink-0">
                  <div className="font-serifSc text-[10.5px] font-bold text-stone-800">{g.phase}</div>
                  <div className="font-serifSc text-[9px] text-stone-500">
                    {g.owner} · {g.deliverable}
                  </div>
                </div>
                <div className="relative h-6 flex-1 rounded border border-[#8b5329]/20 bg-[#eedcb1]/40">
                  <div
                    className="anim-grow-bar absolute inset-y-[3px] rounded bg-gradient-to-r from-[#8b5329] to-[#d49b55] shadow-[inset_0_1px_0_rgba(255,235,170,0.45)]"
                    style={{
                      left: `${((g.start - 1) / 13) * 100}%`,
                      width: `${(g.span / 13) * 100}%`,
                      animationDelay: `${0.1 + idx * 0.08}s`
                    }}
                  />
                  {MILESTONES.filter(m => m.week >= g.start && m.week < g.start + g.span).map(m => (
                    <span
                      key={m.week}
                      title={m.label}
                      className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 bg-[#a93226]"
                      style={{ left: `${((m.week - 0.5) / 13) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {MILESTONES.map((m, idx) => (
              <div
                key={m.week}
                className="anim-pop-in rounded border border-[#a93226]/35 bg-red-50/70 px-2 py-1.5"
                style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
              >
                <div className="font-mono text-[9.5px] text-[#a93226]">第 {m.week} 周 · 内部评审</div>
                <div className="font-serifSc text-[10.5px] font-bold text-stone-800">{m.label}</div>
                <div className="font-serifSc text-[9px] text-stone-500">评审不通过顺延一周，从集成阶段扣减</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="space-y-4">
          <div className="sd-box anim-fade-up rounded-lg p-4">
            <h4 className="mb-2 flex items-center gap-1.5 font-serifSc text-xs font-bold text-[#4a2817]">
              <span className="h-3 w-1 bg-[#8b5329]" />
              角色授权矩阵（最小必要原则）
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-serifSc text-[10.5px]">
                <thead>
                  <tr className="bg-[#eedcb1] text-[#4a2411]">
                    {['角色', '可见数据范围', '原始材料', '身份证号', '操作日志'].map(h => (
                      <th key={h} className="border border-[#8b5329]/30 px-2 py-1.5 font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[#fbf2d5]">
                  {PRIVACY_MATRIX.map((row, idx) => (
                    <tr key={row.role} className="anim-fade-in" style={{ animationDelay: `${idx * 0.06}s` }}>
                      <td className="border border-[#8b5329]/25 px-2 py-1.5 font-bold text-[#5b2b14]">
                        {row.role}
                      </td>
                      <td className="border border-[#8b5329]/25 px-2 py-1.5 text-stone-700">{row.scope}</td>
                      <td className="border border-[#8b5329]/25 px-2 py-1.5 text-stone-700">{row.raw}</td>
                      <td className="border border-[#8b5329]/25 px-2 py-1.5 font-mono text-stone-700">{row.id}</td>
                      <td className="border border-[#8b5329]/25 px-2 py-1.5 text-stone-700">{row.log}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                title: '传输与存储',
                items: ['传输层全链路加密（HTTPS/TLS）', '原始文件加密落盘，按文件哈希校验完整性', '哈希同时用于去重与断点续跑'],
                tone: 'border-[#487332]/40 bg-[#f4faf0]'
              },
              {
                title: '模拟面试记录',
                items: ['回答默认不保存', '结束时可选择保留或删除', '保留时仅本人与辅导员可见'],
                tone: 'border-[#8b5329]/35 bg-white/70'
              },
              {
                title: '导出与防伪',
                items: ['导出件带水印、时间戳与操作人', '支持排名总表 / 分项明细 / 复核记录三种格式', '导出行为写入审计日志'],
                tone: 'border-[#8b5329]/35 bg-white/70'
              }
            ].map((card, idx) => (
              <div
                key={card.title}
                className={`anim-fade-up rounded border p-3 ${card.tone}`}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="mb-1 font-serifSc text-[11px] font-bold text-[#4a2817]">{card.title}</div>
                <ul className="space-y-1">
                  {card.items.map(it => (
                    <li key={it} className="flex gap-1.5 font-serifSc text-[10px] leading-relaxed text-stone-700">
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#8b5329]" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Chip: React.FC<{ label: string; value: number; tone: 'danger' | 'warn' | 'ok' }> = ({
  label,
  value,
  tone
}) => {
  const map = {
    danger: 'border-[#a93226]/50 bg-red-50 text-[#a93226]',
    warn: 'border-[#c47b2a]/50 bg-[#fdf1e0] text-[#8a4f0d]',
    ok: 'border-[#487332]/50 bg-[#eaf5e1] text-[#2f5121]'
  };
  return (
    <span className={`flex items-center gap-1.5 rounded border px-2 py-1 font-serifSc text-[10px] ${map[tone]}`}>
      {label}
      <strong className="font-mono text-[12px]">{value}</strong>
    </span>
  );
};

export default ComplianceView;

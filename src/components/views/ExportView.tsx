import React, { useState } from 'react';
import { Candidate, AuditLog } from '../../types';
import { audioEngine } from '../../services/audioEngine';

interface ExportViewProps {
  candidates: Candidate[];
  auditLogs: AuditLog[];
}

export const ExportView: React.FC<ExportViewProps> = ({
  candidates,
  auditLogs
}) => {
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [exportType, setExportType] = useState<'ranking' | 'metrics' | 'audit'>('ranking');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = (format: 'csv' | 'json') => {
    audioEngine.play('coin');

    let filename = '';
    let content = '';
    const nowStr = new Date().toISOString().slice(0, 10);

    if (exportType === 'ranking') {
      filename = `杭电学生职务选拔_排名总表_${nowStr}.${format}`;
      if (format === 'json') {
        const data = candidates.map(c => ({
          学号: c.id,
          姓名: c.name,
          专业: c.major,
          岗位: c.position_name,
          材料初审分: c.material_score,
          现场面试分: c.interview_score,
          综合总分: c.composite_score,
          状态: c.status === 'pending_review' ? '待复核' : '已完成',
          防伪水印: includeWatermark ? 'E-Judge.AI 2026 官方防伪数据认证' : undefined
        }));
        content = JSON.stringify(data, null, 2);
      } else {
        const header = '学号,姓名,专业,申报岗位,材料初审分,现场面试分,综合总分,状态\n';
        const rows = candidates
          .map(
            c =>
              `${c.id},${c.name},${c.major},${c.position_name},${c.material_score},${c.interview_score},${c.composite_score},${c.status}`
          )
          .join('\n');
        content = '\uFEFF' + header + rows;
      }
    } else if (exportType === 'metrics') {
      filename = `杭电学生职务选拔_分项明细证据库_${nowStr}.${format}`;
      if (format === 'json') {
        content = JSON.stringify(
          candidates.map(c => ({
            学号: c.id,
            姓名: c.name,
            指标详情: c.metrics,
            证据句: includeEvidence ? c.metrics : '已省略'
          })),
          null,
          2
        );
      } else {
        const header = '学号,姓名,德育档位,学业档位,履历档位,胜任档位,合规档位\n';
        const rows = candidates
          .map(
            c =>
              `${c.id},${c.name},${c.metrics.m1.level},${c.metrics.m2.level},${c.metrics.m3.level},${c.metrics.m4.level},${c.metrics.m5.level}`
          )
          .join('\n');
        content = '\uFEFF' + header + rows;
      }
    } else {
      filename = `杭电职务选拔_人工改档审计留痕_${nowStr}.${format}`;
      if (format === 'json') {
        content = JSON.stringify(auditLogs, null, 2);
      } else {
        const header = '时间,操作人,学生姓名,指标,原档位,新档位,改判依据\n';
        const rows = auditLogs
          .map(
            l =>
              `${l.timestamp},${l.operator},${l.targetStudentName},${l.metricId},${l.oldLevel},${l.newLevel},${l.reason}`
          )
          .join('\n');
        content = '\uFEFF' + header + rows;
      }
    }

    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`已成功导出并触发下载：${filename}`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* 顶部指引 */}
      <div className="sd-box p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <img src="/images/icons/scroll.jpg" alt="导出卷轴" className="w-7 h-7 rounded border-2 border-[#8b5329] object-cover shadow" />
            <h3 className="font-serifSc font-bold text-base text-[#4a2817]">
              数据导出与官方防伪凭据工坊
            </h3>
          </div>
          <p className="text-xs text-stone-600 font-serifSc">
            提供可溯源的选拔总表、带段号证据明细以及复核改判流水，支持防伪水印与时间戳印记
          </p>
        </div>

        <span className="text-xs font-mono text-[#8b5329] font-bold">
          遵循《中华人民共和国数据安全法》
        </span>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-100 border-2 border-emerald-500 text-emerald-900 rounded font-serifSc text-xs flex items-center justify-between animate-fadeIn">
          <span>✓ {downloadSuccess}</span>
          <button onClick={() => setDownloadSuccess(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* 导出卡片配置 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            type: 'ranking' as const,
            title: '排名综合总表',
            desc: '包含全部申报学生的材料初审分、现场面试分、综合得分与排位，用于公示与党团联席会议决议。',
            iconImg: '/images/icons/scroll.jpg'
          },
          {
            type: 'metrics' as const,
            title: '分项明细与证据链库',
            desc: '包含五大维度1至5档档位、逐字原文摘录与段落定位编号，作为支撑结论的实锤客观材料。',
            iconImg: '/images/icons/quill.jpg'
          },
          {
            type: 'audit' as const,
            title: '人工复核审计存证流水',
            desc: '包含全部改判记录、修改前后档位、操作人签名与改档必填理由，全流程闭环应对学生复议。',
            iconImg: '/images/badges/shield.jpg'
          }
        ].map(card => {
          const isSelected = exportType === card.type;
          return (
            <div
              key={card.type}
              onClick={() => {
                audioEngine.play('paper');
                setExportType(card.type);
              }}
              className={`sd-box p-4 rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                isSelected ? 'ring-2 ring-[#8b5329] shadow-pixel' : 'hover:border-stone-400'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <img src={card.iconImg} alt={card.title} className="w-6 h-6 rounded border border-[#8b5329] object-cover" />
                  <h4 className="font-bold text-sm text-[#4a2817] font-serifSc">
                    {card.title}
                  </h4>
                </div>
                <p className="text-xs text-stone-600 font-serifSc leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-[#5b3117]/20 flex items-center justify-between text-xs font-serifSc mt-3">
                <span className={isSelected ? 'text-amber-800 font-bold' : 'text-stone-400'}>
                  {isSelected ? '● 当前选择' : '点击勾选'}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {card.type === 'audit' ? `${auditLogs.length}条日志` : `${candidates.length}份档案`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 导出参数选项与动作栏 */}
      <div className="sd-box p-5 rounded-lg space-y-4">
        <h4 className="font-bold text-sm text-[#4a2817] font-serifSc border-b border-[#5b3117]/30 pb-2">
          防伪选项与格式配置
        </h4>

        <div className="flex flex-wrap items-center gap-6 text-xs font-serifSc">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEvidence}
              onChange={e => setIncludeEvidence(e.target.checked)}
              className="accent-[#8b5329] w-4 h-4 cursor-pointer"
            />
            <span className="font-bold text-stone-800">导出数据中携带申报材料逐字原文证据句</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeWatermark}
              onChange={e => setIncludeWatermark(e.target.checked)}
              className="accent-[#8b5329] w-4 h-4 cursor-pointer"
            />
            <span className="font-bold text-stone-800">嵌入杭电数智职务评判官方防伪安全印记</span>
          </label>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleDownload('csv')}
            className="sd-btn-wood px-5 py-2 rounded text-xs font-pixel shadow-pixel flex items-center gap-2"
          >
            <span className="font-pixel text-[11px]">⤓</span>
            <span>导出标准 CSV 表格</span>
          </button>

          <button
            onClick={() => handleDownload('json')}
            className="sd-btn-gold px-5 py-2 rounded text-xs font-pixel shadow-pixel flex items-center gap-2"
          >
            <span className="font-pixel text-[11px]">✦</span>
            <span>导出结构化 JSON 证据全集</span>
          </button>
        </div>
      </div>

    </div>
  );
};

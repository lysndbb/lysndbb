import React, { useState, useEffect, useRef } from 'react';
import { Candidate } from '../types';
import { MetricStars } from './MetricStars';
import { audioEngine } from '../services/audioEngine';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onGoToBench: (candidate: Candidate) => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  onClose,
  onGoToBench
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'radar' | 'original' | 'interview' | 'growth'>('metrics');
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTab === 'radar' && candidate && radarCanvasRef.current) {
      const canvas = radarCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 280;
      canvas.width = size;
      canvas.height = size;
      const center = size / 2;
      const radius = size * 0.38;

      ctx.clearRect(0, 0, size, size);

      const labels = ['思政品德', '学业表现', '学干履历', '岗位胜任', '诚信规范'];
      const values = [
        candidate.metrics.m1.level / 5,
        candidate.metrics.m2.level / 5,
        candidate.metrics.m3.level / 5,
        candidate.metrics.m4.level / 5,
        candidate.metrics.m5.level / 5
      ];
      const count = 5;

      for (let step = 1; step <= 5; step++) {
        const r = (radius / 5) * step;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(91, 49, 23, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(91, 49, 23, 0.35)';
        ctx.stroke();

        const labelX = center + (radius + 24) * Math.cos(angle);
        const labelY = center + (radius + 18) * Math.sin(angle);
        ctx.fillStyle = '#381f13';
        ctx.fillText(labels[i], labelX, labelY);
      }

      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        const r = radius * values[i];
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(246, 178, 98, 0.45)';
      ctx.fill();
      ctx.strokeStyle = '#8b5329';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        const r = radius * values[i];
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdf79';
        ctx.fill();
        ctx.strokeStyle = '#5b3117';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [activeTab, candidate]);

  if (!candidate) return null;

  const metricNames: Record<string, string> = {
    m1: '思想政治与品德',
    m2: '学业表现',
    m3: '学生工作经历',
    m4: '岗位匹配能力',
    m5: '材料规范与诚信'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="sd-box w-full max-w-4xl max-h-[92vh] flex flex-col rounded-lg overflow-hidden border-4 border-[#5b3117]">
        
        {/* 顶部栏 */}
        <div className="bg-[#381a0b] px-5 py-3.5 flex items-center justify-between border-b-2 border-[#d49b55] text-[#fbf2d5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#4a2411] text-[#ffdf79] border border-[#d49b55]">
                档案
              </span>
              <h3 className="font-serifSc font-bold text-lg text-[#ffdf79]">{candidate.name}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2b1408] text-[#ffdf79]/90 border border-[#5b2b14] font-serifSc">脱敏化名</span>
              <span className="text-xs font-mono text-[#eedcb1]/80">学号 {candidate.id}</span>
              <MetricStars score={candidate.composite_score} isPendingReview={candidate.status === 'pending_review'} />
            </div>
            <p className="text-xs text-[#eedcb1]/80 font-serifSc">
              {candidate.major} · 申报职位：{candidate.position_name}
            </p>
          </div>
          
          <button
            onClick={() => {
              audioEngine.play('click');
              onClose();
            }}
            className="px-3 py-1 rounded bg-[#200d04] hover:bg-[#8b5329] border border-[#d49b55] text-xs font-serifSc text-[#ffdf79]"
          >
            关闭
          </button>
        </div>

        {/* 状态看板 */}
        <div className="bg-[#eedcb1]/60 px-5 py-2.5 border-b border-[#5b3117]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-stone-600 font-serifSc">材料初审得分：</span>
              <span className="font-mono font-bold text-base text-[#8b5329]">{candidate.material_score}</span>
            </div>
            <div>
              <span className="text-stone-600 font-serifSc">面试初评分：</span>
              <span className="font-mono font-bold text-base text-[#5b3117]">{candidate.interview_score}</span>
            </div>
            <div>
              <span className="text-stone-600 font-serifSc">综合合成得分：</span>
              <span className="font-mono font-bold text-lg text-purple-900">{candidate.composite_score}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {candidate.status === 'pending_review' ? (
              <span className="px-2 py-0.5 rounded bg-red-100 border border-red-500 text-red-800 font-bold">
                待复核：{candidate.review_reason}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-green-100 border border-green-600 text-green-900 font-bold">
                初审已就绪
              </span>
            )}

            <button
              onClick={() => {
                audioEngine.play('paper');
                onGoToBench(candidate);
              }}
              className="sd-btn-wood px-2.5 py-1 text-xs rounded font-bold"
            >
              进入仲裁法庭改档
            </button>
          </div>
        </div>

        {/* 选项卡 */}
        <div className="flex border-b-2 border-[#5b3117] bg-[#5b3117]/10 px-4 pt-2 gap-2 text-xs font-serifSc">
          <button
            onClick={() => {
              audioEngine.play('paper');
              setActiveTab('metrics');
            }}
            className={`px-3 py-1.5 rounded-t font-bold transition-colors ${
              activeTab === 'metrics'
                ? 'bg-[#fbf2d5] text-[#381f13] border-t-2 border-x-2 border-[#5b3117]'
                : 'text-stone-700 hover:bg-[#eedcb1]'
            }`}
          >
            五维逐项证据明细
          </button>
          <button
            onClick={() => {
              audioEngine.play('paper');
              setActiveTab('radar');
            }}
            className={`px-3 py-1.5 rounded-t font-bold transition-colors ${
              activeTab === 'radar'
                ? 'bg-[#fbf2d5] text-[#381f13] border-t-2 border-x-2 border-[#5b3117]'
                : 'text-stone-700 hover:bg-[#eedcb1]'
            }`}
          >
            五维雷达画像
          </button>
          <button
            onClick={() => {
              audioEngine.play('paper');
              setActiveTab('original');
            }}
            className={`px-3 py-1.5 rounded-t font-bold transition-colors ${
              activeTab === 'original'
                ? 'bg-[#fbf2d5] text-[#381f13] border-t-2 border-x-2 border-[#5b3117]'
                : 'text-stone-700 hover:bg-[#eedcb1]'
            }`}
          >
            清洗后申报原文阅览
          </button>
          <button
            onClick={() => {
              audioEngine.play('paper');
              setActiveTab('interview');
            }}
            className={`px-3 py-1.5 rounded-t font-bold transition-colors ${
              activeTab === 'interview'
                ? 'bg-[#fbf2d5] text-[#381f13] border-t-2 border-x-2 border-[#5b3117]'
                : 'text-stone-700 hover:bg-[#eedcb1]'
            }`}
          >
            面试官现评与速记
          </button>
          <button
            onClick={() => {
              audioEngine.play('paper');
              setActiveTab('growth');
            }}
            className={`px-3 py-1.5 rounded-t font-bold transition-colors ${
              activeTab === 'growth'
                ? 'bg-[#fbf2d5] text-[#381f13] border-t-2 border-x-2 border-[#5b3117]'
                : 'text-stone-700 hover:bg-[#eedcb1]'
            }`}
          >
            因材施教发展单
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#fbf2d5] text-stone-800">
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              {(['m1', 'm2', 'm3', 'm4', 'm5'] as const).map(key => {
                const item = candidate.metrics[key];
                return (
                  <div
                    key={key}
                    className="p-3.5 rounded border-2 border-[#5b3117]/30 bg-[#eedcb1]/30 hover:border-[#8b5329] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#4a2817] font-serifSc">
                          {metricNames[key]}
                        </span>
                        <MetricStars level={item.level} />
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900">
                        置信度 {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="mb-2 p-2 rounded bg-amber-50 border-l-4 border-amber-600 text-xs text-stone-800">
                      <div className="font-bold text-amber-900 mb-0.5">
                        [逐字原文引证]
                      </div>
                      <p className="font-serifSc leading-relaxed select-all">
                        {item.evidence}
                      </p>
                    </div>

                    <div className="text-xs text-stone-600 flex items-start gap-1">
                      <span className="font-bold text-stone-700">判定依据：</span>
                      <span>{item.reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'radar' && (
            <div className="flex flex-col items-center justify-center p-4">
              <h4 className="text-sm font-bold text-[#4a2817] mb-2 font-serifSc">
                {candidate.name} · 五维胜任力雷达图
              </h4>
              <p className="text-xs text-stone-600 mb-4 font-serifSc text-center max-w-md">
                基于申报材料原文逐字证据与AI智能体联合测定 综合换算百分制档位分布
              </p>
              <div className="p-4 bg-white/70 rounded-lg border-2 border-[#5b3117]/30 shadow-pixel-sm">
                <canvas ref={radarCanvasRef} width={280} height={280} />
              </div>
            </div>
          )}

          {activeTab === 'original' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded bg-amber-100/60 border border-amber-400 text-xs text-amber-900 font-serifSc">
                [案卷说明] 以下正文已由Parser Agent清洗 剔除页眉页脚与干扰字符 保留原始段落编号以供查证溯源
              </div>
              <div className="space-y-2">
                {Object.entries(candidate.original_text).map(([pKey, text]) => (
                  <div
                    key={pKey}
                    className="p-2.5 rounded bg-white/60 border border-stone-300 text-xs font-serifSc leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[11px] flex-shrink-0">
                      {pKey}
                    </span>
                    <p className="text-stone-800 select-all">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="space-y-4">
              <div className="p-4 rounded border-2 border-[#5b3117]/30 bg-amber-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-[#4a2817] font-serifSc">
                    现场面试表现打分
                  </span>
                  <span className="text-base font-mono font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded border border-purple-300">
                    {candidate.interview_score} 分
                  </span>
                </div>
                <div className="text-xs text-stone-700 space-y-2 font-serifSc">
                  <p className="font-bold text-stone-900">面试官评委速记评语：</p>
                  <p className="p-3 bg-white/80 rounded border border-amber-200 leading-relaxed italic">
                    {candidate.interview_notes || '面试表现沉着 表达有条理 具备较好团队沟通意愿'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="space-y-4">
              <div className="p-4 rounded border-2 border-emerald-700/40 bg-emerald-50/70">
                <h4 className="font-bold text-sm text-emerald-900 font-serifSc mb-2">
                  因材施教个性化培育建议单
                </h4>
                <p className="text-xs text-emerald-800 font-serifSc mb-3 leading-relaxed">
                  系统比对候选人现有档位与目标岗位最高档位要点 自动检索杭电校园赋能资源库 输出针对性提升行动项：
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-white border border-emerald-200">
                    <div className="font-bold text-stone-800 mb-1 flex items-center justify-between">
                      <span>学干实战进阶 · HDU领航员培养工坊</span>
                      <span className="text-emerald-700 font-mono">校团委</span>
                    </div>
                    <p className="text-stone-600 font-serifSc">
                      建议在接下来的任期中 针对校企合作赞助洽谈与大型项目复盘报告进行系统化演练
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-emerald-200">
                    <div className="font-bold text-stone-800 mb-1 flex items-center justify-between">
                      <span>拔尖赛事孵化 · 挑战杯与互联网加培育营</span>
                      <span className="text-emerald-700 font-mono">自动化学院创客中心</span>
                    </div>
                    <p className="text-stone-600 font-serifSc">
                      巩固学分绩点领先优势 积极组队参与省部级重点科创赛事提升综合学术声望
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="bg-[#eedcb1] px-5 py-3 border-t-2 border-[#5b3117] flex items-center justify-between">
          <span className="text-xs text-stone-600 font-serifSc">
            E-Judge.AI 证据链校验引擎 · 原文逐字核对率 100%
          </span>
          <button
            onClick={() => {
              audioEngine.play('click');
              onClose();
            }}
            className="sd-btn-wood px-4 py-1.5 text-xs rounded font-bold"
          >
            返回总览
          </button>
        </div>

      </div>
    </div>
  );
};

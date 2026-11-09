import React, { useState, useEffect } from 'react';
import { SubAgentStatus, Candidate } from '../../types';
import { subAgentOrchestrator } from '../../services/subAgentSystem';
import { audioEngine } from '../../services/audioEngine';

interface ParallelAgentLabProps {
  onCandidateGenerated: (candidate: Candidate) => void;
}

export const ParallelAgentLab: React.FC<ParallelAgentLabProps> = ({
  onCandidateGenerated
}) => {
  const [agents, setAgents] = useState<SubAgentStatus[]>(subAgentOrchestrator.getAgents());
  const [logs, setLogs] = useState<string[]>(subAgentOrchestrator.getGlobalLogs());
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('civic_ethics');

  useEffect(() => {
    const unsubscribe = subAgentOrchestrator.subscribe((newAgents, newLogs) => {
      setAgents([...newAgents]);
      setLogs([...newLogs]);
    });
    return () => unsubscribe();
  }, []);

  const handleRunPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    audioEngine.play('subagent');

    const sampleName = `李航峰_${Math.floor(Math.random() * 900 + 100)}`;
    const sampleText = `【政治表现与思想汇报】
本人为中共预备党员 思想上紧跟党的方针政策 定期向党组织提交思想汇报共计4篇。
【志愿服务与集体奉献】
注册于志愿汇APP 累计志愿工时达128小时 担任2025年杭州马拉松钱塘赛段骨干志愿者 获评校级优秀青年志愿者标兵称号。
【学业与竞赛学术】
大二学年专业综合排名4/120 处于前5% 荣获校级综合一等奖学金。带领团队获得全国大学生智能汽车竞赛华东赛区一等奖。
【学生干部履历】
担任自动化学院青年志愿者协会项目拓展部副部长满一年 独立策划大型志愿助残服务三场 累计动员部员与志愿者160余人次。
【岗位胜任与工作设想】
若担任项目拓展部部长 将重点深化校企合作基地 拓展两个常态化志愿服务工坊 形成可复制的项目孵化流程手册。
【诚信自述】
本申报材料所述全部任职、志愿时长与比赛获奖均真实有效 提供证明备查。`;

    try {
      const result = await subAgentOrchestrator.evaluateTextParallel(
        sampleName,
        `2305${Math.floor(Math.random() * 8999 + 1000)}`,
        '自动化2302班',
        sampleText,
        'pos_01'
      );
      audioEngine.play('levelup');
      onCandidateGenerated(result);
    } catch {
      audioEngine.play('alert');
    } finally {
      setIsRunning(false);
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  return (
    <div className="space-y-6">
      
      {/* 顶部概览与并发启动栏 */}
      <div className="sd-box p-5 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl text-[#f6b262] font-pixel">✦</span>
            <h3 className="font-serifSc font-bold text-base text-[#4a2817]">
              多智能体并行协作控制大厅
            </h3>
            <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-400 text-amber-900 text-xs font-mono font-bold">
              8个专业子Agent并发运行中
            </span>
          </div>
          <p className="text-xs text-stone-600 font-serifSc">
            解构、德育、学业、履历、胜任、合规五维智能体通过独立线程并发抽取证据，仲裁与发展规划智能体实时巡检
          </p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={isRunning}
          className={`sd-btn-gold px-5 py-2.5 rounded font-pixel text-xs flex items-center gap-2 ${
            isRunning ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
          }`}
        >
          <span>{isRunning ? '⏳' : '✦'}</span>
          <span>{isRunning ? '智能体并行作业中...' : '并发调度全新样本评判'}</span>
        </button>
      </div>

      {/* 8大子智能体阵列卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {agents.map(agent => {
          const isSelected = selectedAgentId === agent.id;
          const statusBg =
            agent.status === 'running'
              ? 'bg-amber-100 border-amber-500'
              : agent.status === 'alert'
              ? 'bg-red-100 border-red-500'
              : 'bg-white/80 border-stone-300';

          return (
            <div
              key={agent.id}
              onClick={() => {
                audioEngine.play('click');
                setSelectedAgentId(agent.id);
              }}
              className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer ${statusBg} ${
                isSelected ? 'ring-2 ring-[#8b5329] shadow-pixel-sm' : 'hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.avatar}</span>
                  <div>
                    <h4 className="font-bold text-xs text-[#381f13] font-serifSc">
                      {agent.name}
                    </h4>
                    <span className="text-[10px] text-stone-500 font-mono">
                      @{agent.id}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    agent.status === 'running'
                      ? 'bg-amber-200 text-amber-900 animate-pulse'
                      : agent.status === 'alert'
                      ? 'bg-red-200 text-red-900'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {agent.status === 'running'
                    ? '并发计算中'
                    : agent.status === 'alert'
                    ? '触发预警'
                    : '就绪'}
                </span>
              </div>

              <p className="text-[11px] text-stone-600 mb-2 font-serifSc line-clamp-1">
                {agent.specialty}
              </p>

              {/* 进度条 */}
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    agent.status === 'running'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${agent.progress}%` }}
                />
              </div>

              <div className="text-[10px] text-stone-500 font-mono truncate">
                {agent.currentTask || '待命状态'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 下方分栏：左侧当前选中Agent特写与内部逻辑，右侧全局终端并发日志 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 选中子智能体深度监控 */}
        <div className="lg:col-span-5 sd-box p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#5b3117]/30 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedAgent.avatar}</span>
                <div>
                  <h4 className="font-bold text-sm text-[#4a2817] font-serifSc">
                    {selectedAgent.name} 独立工作舱
                  </h4>
                  <span className="text-xs text-stone-600 font-serifSc">
                    专注职能：{selectedAgent.specialty}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#eedcb1] text-[#5b3117]">
                单机状态：{selectedAgent.status}
              </span>
            </div>

            <div className="space-y-3 text-xs font-serifSc text-stone-700">
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">
                  子智能体并行提示词设定：
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed font-mono">
                  严格执行角色边界约束，仅针对申报材料中对应指标进行1至5档位判定与逐字引证，严禁捏造事实，严禁跨指标评分。
                </p>
              </div>

              <div>
                <span className="font-bold text-stone-800 block mb-1">
                  子Agent本地推理日志：
                </span>
                <div className="bg-[#2b180d] text-[#eedcb1] p-3 rounded font-mono text-[11px] h-48 overflow-y-auto space-y-1">
                  {selectedAgent.log.map((line, idx) => (
                    <div key={idx} className="leading-tight text-amber-200/90">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#5b3117]/20 flex items-center justify-between text-xs text-stone-500 font-serifSc">
            <span>支持多线程上下文隔离</span>
            <span className="font-mono text-emerald-800 font-bold">100% 结构化返回</span>
          </div>
        </div>

        {/* 全局并发协同终端流式日志 */}
        <div className="lg:col-span-7 sd-box p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#5b3117]/30 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <img src="/images/icons/scroll.jpg" alt="广播卷轴" className="w-5 h-5 rounded border border-[#8b5329] object-cover" />
                <h4 className="font-bold text-sm text-[#4a2817] font-serifSc">
                  智能体集群协同广播总线
                </h4>
              </div>
              <button
                onClick={() => {
                  audioEngine.play('paper');
                  subAgentOrchestrator.evaluateTextParallel(
                    '若溪',
                    '26010099',
                    '2026级智能科学与技术1班',
                    '担任班级团支书 志愿工时85小时 绩点前10% 组织团日活动多次',
                    'pos_01'
                  );
                }}
                className="px-2 py-0.5 rounded border border-[#5b3117] text-xs font-serifSc hover:bg-amber-100 text-[#5b3117]"
              >
                注入测试数据
              </button>
            </div>

            <div className="bg-[#1c1109] border-2 border-[#5b3117] rounded-lg p-3 h-72 overflow-y-auto font-mono text-xs space-y-1.5 shadow-inner">
              {logs.map((log, index) => {
                const isWarning = log.includes('预警') || log.includes('复核');
                const isSuccess = log.includes('完成') || log.includes('通过');
                return (
                  <div
                    key={index}
                    className={`leading-relaxed ${
                      isWarning
                        ? 'text-red-400 font-bold'
                        : isSuccess
                        ? 'text-emerald-400'
                        : 'text-[#f6b262]'
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#5b3117]/20 flex items-center justify-between text-xs text-stone-600 font-serifSc">
            <span>多智能体并行事件通道 · 毫秒级流式分发</span>
            <span className="font-mono text-amber-900 font-bold">无死锁安全保障</span>
          </div>
        </div>

      </div>

    </div>
  );
};

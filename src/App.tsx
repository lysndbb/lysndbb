import React, { useState } from 'react';
import { Candidate, Position, AuditLog } from './types';
import { INITIAL_CANDIDATES, INITIAL_POSITIONS } from './data/mockData';
import { ensureProfile } from './data/studentProfileSeed';
import { Sidebar, NAV_MODULES, findModuleByTab } from './components/Sidebar';
import { LeavesCanvas } from './components/LeavesCanvas';
import { CandidateModal } from './components/CandidateModal';
import { ArchiveView } from './components/views/ArchiveView';
import { ParallelAgentLab } from './components/views/ParallelAgentLab';
import { TasksView } from './components/views/TasksView';
import { CodexView } from './components/views/CodexView';
import { BenchView } from './components/views/BenchView';
import { InterviewSheetView } from './components/views/InterviewSheetView';
import { MockInterviewView } from './components/views/MockInterviewView';
import { GrowthView } from './components/views/GrowthView';
import { ComplianceView } from './components/views/ComplianceView';
import { StudentArchiveView } from './components/views/StudentArchiveView';
import { ExportView } from './components/views/ExportView';
import { TestsView } from './components/views/TestsView';
import { audioEngine } from './services/audioEngine';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('archive');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    INITIAL_CANDIDATES.map(ensureProfile)
  );
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'audit_init_1',
      timestamp: '09:20:15',
      operator: '复核人_戚墨然',
      action: '人工改判确认',
      targetStudentId: '26011102',
      targetStudentName: '景和',
      metricId: 'm3',
      oldLevel: 2,
      newLevel: 3,
      reason: '补充查验项目总结盖章原件，核准计入正式骨干任职',
      verified: true
    }
  ]);

  const [activeModalCandidate, setActiveModalCandidate] = useState<Candidate | null>(null);
  const [benchSelectedId, setBenchSelectedId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const pendingCount = candidates.filter(c => c.status === 'pending_review').length;

  const handleUpdateCandidate = (updated: Candidate) => {
    setCandidates(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const handleAddCandidate = (newOne: Candidate) => {
    setCandidates(prev => [newOne, ...prev]);
  };

  const handleAddAuditLog = (log: AuditLog) => {
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleUpdateWeights = (posId: string, weights: Position['weights']) => {
    setPositions(prev =>
      prev.map(p => (p.id === posId ? { ...p, weights } : p))
    );
    setCandidates(prev =>
      prev.map(c => {
        if (c.position_id !== posId) return c;
        const m = c.metrics;
        const ratioSum =
          (m.m1.level / 5) * weights.m1 +
          (m.m2.level / 5) * weights.m2 +
          (m.m3.level / 5) * weights.m3 +
          (m.m4.level / 5) * weights.m4 +
          (m.m5.level / 5) * weights.m5;
        const materialScore = parseFloat((ratioSum * 100).toFixed(1));
        const alpha = 0.4;
        const compositeScore = parseFloat(
          (alpha * c.interview_score + (1 - alpha) * materialScore).toFixed(1)
        );
        return {
          ...c,
          material_score: materialScore,
          composite_score: compositeScore
        };
      })
    );
  };

  const handleGoToBench = (c: Candidate) => {
    setActiveModalCandidate(null);
    setBenchSelectedId(c.id);
    setCurrentTab('bench');
  };

  const tabTitles: Record<string, string> = {
    archive: '评判名册总表与分项证据档案',
    agents: '多智能体并行协作调度控制大厅',
    tasks: '申报材料解析清洗与任务调度流水线',
    codex: '岗位标准库与五维规则配比工坊',
    sheet: '面试官逐项给档与综合分折算',
    bench: '复核仲裁法庭与人工改判留痕',
    workshop: '面试需求登记与五维指标出题判档',
    scenario: '按目标职务抽题的全真情境演练',
    students: '在册学生档案分年级分班级维护',
    growth: '因材施教发展规划与育人建议单',
    export: '数据凭据导出与防伪溯源水印',
    compliance: '异常标记 · 双重仲裁 · 隐私分级 · 实施计划',
    tests: '系统鲁棒性与40份样本对照基准'
  };

  const activeModule = findModuleByTab(currentTab) ?? NAV_MODULES[0];
  const activeItem = activeModule.items.find(i => i.id === currentTab);

  return (
    <div className="min-h-screen bg-[#24130a] text-[#381f13] flex font-serifSc selection:bg-[#f6b262] selection:text-[#381f13]">
      {/* 飘落枫叶动效 */}
      <LeavesCanvas />

      {/* 左侧可收起竖向星露谷木质侧边栏 */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingCount={pendingCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const nextVal = !soundEnabled;
          setSoundEnabled(nextVal);
          audioEngine.setEnabled(nextVal);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 右侧主工作区 */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 轻量顶部横梁：四大模块导航 + 当前页签面包屑 + 环境状态 */}
        <header className="h-14 bg-[#2b1408]/95 border-b-2 border-[#4a2411] px-4 sm:px-6 flex items-center justify-between gap-4 text-xs text-[#eedcb1] backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#4a2411] text-[#ffdf79] border border-[#d49b55] shrink-0">
              {activeModule.code}
            </span>
            <span className="font-bold tracking-wider text-[#ffdf79] shrink-0 font-serifSc">
              {activeModule.label}
            </span>
            <span className="text-[#8b5329] shrink-0">/</span>
            <span className="text-[#eedcb1]/80 truncate font-serifSc">
              {activeItem?.label || '评判总览'}
            </span>
            <span className="hidden xl:inline text-[11px] text-[#eedcb1]/45 truncate">
              · {tabTitles[currentTab] || '评判大厅'}
            </span>
          </div>

          {/* 四大模块切换：桌面端 */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {NAV_MODULES.map(mod => {
              const isActive = mod.id === activeModule.id;
              const badge = mod.items.reduce(
                (sum, i) => sum + (i.id === 'bench' ? pendingCount : 0),
                0
              );
              return (
                <button
                  key={mod.id}
                  onClick={() => setCurrentTab(mod.items[0].id)}
                  title={mod.hint}
                  className={`relative px-2.5 py-1 rounded text-[11px] font-serifSc border transition-all tracking-wide ${
                    isActive
                      ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55] font-bold shadow-[inset_0_2px_4px_rgba(255,255,255,0.12)]'
                      : 'bg-[#381a0b]/50 text-[#eedcb1]/70 border-transparent hover:bg-[#4a2411] hover:text-[#ffdf79]'
                  }`}
                >
                  {mod.label}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#a93226] animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#eedcb1]/80 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden sm:inline text-[#ffdf79] font-serifSc">2026级新生干部选拔初审季</span>
          </div>
        </header>

        {/* 主体视窗 */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 z-20">
          <div key={currentTab} className="anim-page">
          {currentTab === 'archive' && (
            <ArchiveView
              candidates={candidates}
              onSelectCandidate={c => setActiveModalCandidate(c)}
              onGoToBench={handleGoToBench}
            />
          )}

          {currentTab === 'agents' && (
            <ParallelAgentLab
              onCandidateGenerated={c => handleAddCandidate(c)}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              positions={positions}
              onAddCandidate={handleAddCandidate}
              onGoToArchive={() => setCurrentTab('archive')}
            />
          )}

          {currentTab === 'codex' && (
            <CodexView
              positions={positions}
              onUpdateWeights={handleUpdateWeights}
            />
          )}

          {currentTab === 'sheet' && (
            <InterviewSheetView
              candidates={candidates}
              positions={positions}
              onUpdateCandidate={handleUpdateCandidate}
            />
          )}

          {currentTab === 'bench' && (
            <BenchView
              candidates={candidates}
              auditLogs={auditLogs}
              onUpdateCandidate={handleUpdateCandidate}
              onAddAuditLog={handleAddAuditLog}
              preSelectedCandidateId={benchSelectedId}
            />
          )}

          {currentTab === 'workshop' && (
            <MockInterviewView positions={positions} mode="standard" />
          )}

          {currentTab === 'scenario' && (
            <MockInterviewView positions={positions} mode="scenario" />
          )}

          {currentTab === 'students' && (
            <StudentArchiveView
              candidates={candidates}
              positions={positions}
              onUpdateCandidate={handleUpdateCandidate}
              onAddCandidate={handleAddCandidate}
            />
          )}

          {currentTab === 'growth' && (
            <GrowthView candidates={candidates} />
          )}

          {currentTab === 'export' && (
            <ExportView
              candidates={candidates}
              auditLogs={auditLogs}
            />
          )}

          {currentTab === 'compliance' && (
            <ComplianceView
              candidates={candidates}
              positions={positions}
              auditLogs={auditLogs}
              onGoToBench={() => setCurrentTab('bench')}
            />
          )}

          {currentTab === 'tests' && (
            <TestsView />
          )}
          </div>
        </main>

        {/* 底部极简隐私合规说明栏 */}
        <footer className="mt-auto bg-[#1f0e05] border-t-2 border-[#4a2411] py-3 text-center text-[11px] text-[#eedcb1]/60 z-20 font-serifSc">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-2">
            <img src="/images/badges/shield.jpg" alt="隐私" className="w-3.5 h-3.5 rounded object-cover inline-block" />
            <span>出于隐私考虑，我们这边只放化名</span>
          </div>
        </footer>
      </div>

      {/* 详情与证据链弹窗 */}
      <CandidateModal
        candidate={activeModalCandidate}
        onClose={() => setActiveModalCandidate(null)}
        onGoToBench={handleGoToBench}
      />
    </div>
  );
};

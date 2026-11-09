import React, { useEffect, useState } from 'react';
import { audioEngine } from '../services/audioEngine';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export interface NavItem {
  id: string;
  label: string;
  badge?: number;
}

export interface NavModule {
  id: string;
  code: string;
  label: string;
  hint: string;
  items: NavItem[];
}

/** 导航四大模块：岗位匹配度评估 / 模拟面试 / 学生能力发展 / 系统 */
export const NAV_MODULES: NavModule[] = [
  {
    id: 'match',
    code: '01',
    label: '岗位匹配度评估',
    hint: '名册总览 · 材料解析 · 标准配比 · 仲裁复核',
    items: [
      { id: 'archive', label: '评判总览' },
      { id: 'tasks', label: '申报材料' },
      { id: 'codex', label: '岗位标准' },
      { id: 'sheet', label: '面试评分表' },
      { id: 'bench', label: '仲裁复核' },
      { id: 'export', label: '凭据导出' }
    ]
  },
  {
    id: 'interview',
    code: '02',
    label: '模拟面试',
    hint: '面试工作台 · 情境真题演练',
    items: [
      { id: 'workshop', label: '面试工作台' },
      { id: 'scenario', label: '情境真题演练' }
    ]
  },
  {
    id: 'growth',
    code: '03',
    label: '学生能力发展',
    hint: '学生档案 · 因材施教',
    items: [
      { id: 'students', label: '学生档案' },
      { id: 'growth', label: '能力发展规划' }
    ]
  },
  {
    id: 'system',
    code: '04',
    label: '系统',
    hint: '智能体调度 · 质量合规 · 基准验证',
    items: [
      { id: 'agents', label: '并行智能体' },
      { id: 'compliance', label: '质量与合规' },
      { id: 'tests', label: '基准验证' }
    ]
  }
];

/** 根据页签反查其所属模块 */
export const findModuleByTab = (tabId: string): NavModule | undefined =>
  NAV_MODULES.find(m => m.items.some(i => i.id === tabId));

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  pendingCount,
  soundEnabled,
  onToggleSound,
  collapsed,
  onToggleCollapse
}) => {
  const activeModuleId = findModuleByTab(currentTab)?.id ?? NAV_MODULES[0].id;

  // 模块展开状态：默认只展开当前页签所在模块，其余收拢
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => ({
    [activeModuleId]: true
  }));

  // 切换页签（含外部跳转）时，自动展开其所属模块
  useEffect(() => {
    setOpenModules(prev => (prev[activeModuleId] ? prev : { ...prev, [activeModuleId]: true }));
  }, [activeModuleId]);

  const withBadge = (items: NavItem[]): NavItem[] =>
    items.map(i => (i.id === 'bench' ? { ...i, badge: pendingCount } : i));

  const handleSelect = (tabId: string) => {
    audioEngine.play('click');
    onTabChange(tabId);
  };

  const toggleModule = (moduleId: string) => {
    audioEngine.play('paper');
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  return (
    <aside
      className={`sticky top-0 h-screen z-40 bg-[#2b1408] border-r-4 border-[#4a2411] shadow-[4px_0_16px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all duration-300 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* 顶部系统名牌 */}
      <div className="min-h-0 flex flex-col">
        <div className="p-3 border-b-2 border-[#4a2411] bg-[#220e04] flex items-center justify-between shrink-0">
          {!collapsed ? (
            <div
              className="cursor-pointer"
              onClick={() => handleSelect('archive')}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#4a2411] border border-[#d49b55] font-pixel text-[10px] text-[#ffdf79] flex items-center justify-center">
                  EJ
                </span>
                <span className="font-serifSc font-black text-sm text-[#ffdf79] tracking-wider">
                  E-Judge
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#381a0b] text-[#d49b55] border border-[#5b2b14] font-mono">
                  2026
                </span>
              </div>
              <p className="text-[10px] text-[#eedcb1]/60 font-serifSc mt-0.5 tracking-wider">
                学生职务数智评判系统
              </p>
            </div>
          ) : (
            <div
              className="mx-auto w-8 h-8 rounded bg-[#4a2411] border border-[#d49b55] font-pixel text-xs text-[#ffdf79] flex items-center justify-center cursor-pointer"
              onClick={() => handleSelect('archive')}
              title="E-Judge.AI 2026"
            >
              EJ
            </div>
          )}
        </div>

        {/* 导航：四大模块分组 */}
        <nav className="p-2 space-y-1.5 mt-1 overflow-y-auto">
          {NAV_MODULES.map(mod => {
            const items = withBadge(mod.items);
            const isModuleActive = activeModuleId === mod.id;
            const isOpen = collapsed ? true : Boolean(openModules[mod.id]);
            const moduleBadge = items.reduce((sum, i) => sum + (i.badge || 0), 0);

            /* 收起态：只显示模块序号，点击直达该模块首页 */
            if (collapsed) {
              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelect(items[0].id)}
                  className={`relative w-full py-2.5 rounded border font-serifSc text-[11px] flex items-center justify-center transition-all ${
                    isModuleActive
                      ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55] font-bold shadow-[inset_0_2px_4px_rgba(255,255,255,0.12)]'
                      : 'bg-[#381a0b]/40 text-[#eedcb1]/70 hover:bg-[#4a2411] hover:text-[#ffdf79] border-transparent'
                  }`}
                  title={`${mod.code} ${mod.label}`}
                >
                  <span className="font-mono text-[10px]">{mod.code}</span>
                  {moduleBadge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#a93226] animate-pulse" />
                  )}
                </button>
              );
            }

            return (
              <div key={mod.id} className="rounded border border-[#3d1a09] bg-[#200d04]/50 overflow-hidden">
                {/* 模块标题条 */}
                <button
                  onClick={() => {
                    if (items.length === 1) {
                      handleSelect(items[0].id);
                      return;
                    }
                    toggleModule(mod.id);
                  }}
                  className={`w-full flex items-center gap-1.5 px-2 py-2 transition-colors border-b ${
                    isModuleActive
                      ? 'bg-[#4a2411] border-[#d49b55]/70 text-[#ffdf79]'
                      : 'bg-[#2f160a] border-[#3d1a09] text-[#eedcb1]/80 hover:bg-[#3d1e0e] hover:text-[#ffdf79]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      isModuleActive
                        ? 'bg-[#200d04] text-[#ffdf79] border-[#d49b55]'
                        : 'bg-[#1a0a03] text-[#d49b55] border-[#3d1a09]'
                    }`}
                  >
                    {mod.code}
                  </span>
                  <span className="font-serifSc font-bold text-xs tracking-wider truncate">
                    {mod.label}
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    {moduleBadge > 0 && (
                      <span className="px-1 rounded-full bg-[#a93226] text-white text-[9px] font-mono font-bold animate-pulse">
                        {moduleBadge}
                      </span>
                    )}
                    {items.length > 1 && (
                      <span className="text-[9px] text-[#d49b55] w-2 text-center">
                        {isOpen ? '▾' : '▸'}
                      </span>
                    )}
                  </span>
                </button>

                {/* 模块内页签 */}
                {isOpen && (
                  <div className="py-1">
                    {items.map(item => {
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                          title={mod.hint}
                          className={`w-full flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-[11px] font-serifSc transition-all border-l-2 ${
                            isActive
                              ? 'bg-[#5b2b14] text-[#ffdf79] font-bold border-l-[#ffdf79]'
                              : 'text-[#eedcb1]/70 border-l-transparent hover:bg-[#381a0b] hover:text-[#ffdf79] hover:border-l-[#8b5329]'
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full shrink-0 ${
                              isActive ? 'bg-[#ffdf79]' : 'bg-[#8b5329]/60'
                            }`}
                          />
                          <span className="tracking-wide truncate">{item.label}</span>
                          {Boolean(item.badge && item.badge > 0) && (
                            <span className="ml-auto px-1 rounded-full bg-[#a93226] text-white text-[9px] font-mono font-bold animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 底部折叠切换与音效控制 */}
      <div className="p-2 border-t-2 border-[#4a2411] bg-[#220e04] space-y-1.5 shrink-0">
        <button
          onClick={() => {
            onToggleSound();
            if (!soundEnabled) audioEngine.play('click');
          }}
          className={`w-full py-1.5 text-xs font-serifSc rounded border flex items-center justify-center transition-colors ${
            soundEnabled
              ? 'bg-[#4a2411] border-[#d49b55] text-[#ffdf79]'
              : 'bg-[#1b0a03] border-[#381a0b] text-stone-500'
          }`}
          title={soundEnabled ? '音效已开' : '静音模式'}
        >
          {!collapsed ? (soundEnabled ? '音效开启' : '静音中') : soundEnabled ? '音' : '静'}
        </button>

        <button
          onClick={() => {
            audioEngine.play('paper');
            onToggleCollapse();
          }}
          className="w-full py-1 text-[11px] font-serifSc rounded bg-[#381a0b] hover:bg-[#4a2411] text-[#eedcb1]/80 hover:text-[#ffdf79] border border-[#5b2b14] flex items-center justify-center"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {!collapsed ? '收起侧边栏 ◀' : '▶'}
        </button>
      </div>
    </aside>
  );
};

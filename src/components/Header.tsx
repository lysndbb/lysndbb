import React from 'react';
import { audioEngine } from '../services/audioEngine';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  pendingCount,
  soundEnabled,
  onToggleSound
}) => {
  const tabs: { id: string; label: string; code: string; badge?: number }[] = [
    { id: 'archive', label: '岗位匹配度评估', code: '01', badge: pendingCount },
    { id: 'workshop', label: '模拟面试', code: '02' },
    { id: 'growth', label: '学生能力发展', code: '03' },
    { id: 'agents', label: '系统', code: '04' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#2b1408] border-b-4 border-[#4a2411] shadow-[0_4px_16px_rgba(0,0,0,0.6)] text-[#fbf2d5]">
      {/* 顶部细腻木质装饰条 */}
      <div className="h-1 bg-gradient-to-r from-[#7a3e1d] via-[#d49b55] to-[#7a3e1d]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          
          {/* 左侧系统标识：质朴厚重的星露谷手作铜木铭牌 */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              audioEngine.play('click');
              onTabChange('archive');
            }}
          >
            <div className="w-10 h-10 rounded bg-[#4a2411] border-2 border-[#d49b55] flex items-center justify-center shadow-[2px_2px_0px_#180a04] group-hover:border-[#ffdf79] transition-colors">
              <span className="font-pixel text-xs text-[#d49b55] group-hover:text-[#ffdf79]">EJ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serifSc font-black text-sm tracking-wide text-[#ffdf79] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  E-Judge.AI
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3d1c0b] text-[#d49b55] border border-[#5b2b14] font-mono tracking-wider">
                  HDU STUDIO
                </span>
              </div>
              <p className="text-[11px] text-[#eedcb1]/75 font-serifSc tracking-wider">
                学生职务智能评判系统 · 多智能体协同
              </p>
            </div>
          </div>

          {/* 中间桌面端选项卡：仿星露谷游戏背包触感木质卡扣 */}
          <nav className="hidden lg:flex items-end space-x-1.5 h-full pt-2">
            {tabs.map(tab => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    audioEngine.play('click');
                    onTabChange(tab.id);
                  }}
                  className={`relative px-3.5 py-2 rounded-t-md text-xs font-serifSc transition-all flex items-center gap-1.5 border-t-2 border-x-2 select-none ${
                    isActive
                      ? 'sd-tab-wood-active font-bold z-10 translate-y-[2px]'
                      : 'sd-tab-wood-inactive z-0'
                  }`}
                >
                  <span
                    className={`font-pixel text-[9px] px-1 py-0.2 rounded border shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] ${
                      isActive
                        ? 'bg-[#381f13] text-[#f6b262] border-[#7a3e1d]'
                        : 'bg-[#1c0c05] text-[#eedcb1]/50 border-[#381a0b]'
                    }`}
                  >
                    {tab.code}
                  </span>
                  <span className="tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {tab.label}
                  </span>
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-b from-[#c0392b] to-[#78281f] text-[#ffdf79] border border-[#f6b262] text-[9px] font-pixel shadow-[1px_1px_2px_rgba(0,0,0,0.7)] animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 右侧：环境时钟与音效控制（已彻底确认无金币显示） */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded bg-[#1f0e05] border border-[#4a2411] text-[#eedcb1]/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
              <span className="w-2 h-2 rounded-full bg-[#487332] animate-pulse shadow-[0_0_6px_#487332]" />
              <span className="font-serifSc text-[11px] tracking-wider text-[#eedcb1]">下沙校区 · 评判就绪</span>
            </div>

            <button
              onClick={() => {
                onToggleSound();
                if (!soundEnabled) audioEngine.play('click');
              }}
              className={`px-2.5 py-1 rounded text-xs font-serifSc border transition-colors flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-[#4a2411] border-[#d49b55] text-[#ffdf79] shadow-pixel-sm'
                  : 'bg-[#1f0e05] border-[#4a2411] text-stone-500'
              }`}
            >
              <span className="text-[10px]">{soundEnabled ? '音效开' : '静音'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 窄屏或移动端导航 */}
      <div className="lg:hidden flex items-center overflow-x-auto px-3 py-2 space-x-1.5 bg-[#200d04] border-t-2 border-[#4a2411]">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                audioEngine.play('click');
                onTabChange(tab.id);
              }}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded font-serifSc flex items-center gap-1.5 border-2 transition-all select-none ${
                isActive
                  ? 'sd-tab-wood-active font-bold'
                  : 'sd-tab-wood-inactive'
              }`}
            >
              <span
                className={`font-pixel text-[9px] px-1 py-0.2 rounded border ${
                  isActive
                    ? 'bg-[#381f13] text-[#f6b262] border-[#7a3e1d]'
                    : 'bg-[#1c0c05] text-[#eedcb1]/50 border-[#381a0b]'
                }`}
              >
                {tab.code}
              </span>
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-b from-[#c0392b] to-[#78281f] text-[#ffdf79] border border-[#f6b262] text-[9px] font-pixel">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

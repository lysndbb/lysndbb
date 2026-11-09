import React from 'react';

interface MetricStarsProps {
  score?: number;
  level?: number;
  isPendingReview?: boolean;
  showText?: boolean;
}

export const MetricStars: React.FC<MetricStarsProps> = ({
  score,
  level,
  isPendingReview,
  showText = true
}) => {
  if (isPendingReview) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#3b0f0b] border border-[#a93226] text-[#ffb4a2] text-[11px] font-mono shadow-pixel-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[#e74c3c] animate-pulse" />
        {showText && <span>待复核</span>}
      </span>
    );
  }

  if (level !== undefined) {
    const levelColors = [
      '',
      'bg-stone-700 text-stone-300 border-stone-600',
      'bg-amber-950 text-amber-300 border-amber-800',
      'bg-slate-800 text-slate-200 border-slate-500',
      'bg-[#5b3117] text-[#ffdf79] border-[#d49b55]',
      'bg-[#3b1259] text-[#e8b4f8] border-[#a855f7]'
    ];

    return (
      <div className="inline-flex items-center gap-1">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${levelColors[level] || 'bg-stone-800 text-stone-300'}`}
        >
          {level} 档
        </span>
      </div>
    );
  }

  if (score !== undefined) {
    if (score >= 90) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#3b1259] border border-[#a855f7] text-[#e8b4f8] text-[11px] font-bold shadow-pixel-sm">
          <span className="w-1.5 h-1.5 rounded-sm bg-[#c084fc] shadow-[0_0_6px_#c084fc]" />
          {showText && <span>铱星品级</span>}
        </span>
      );
    }
    if (score >= 85) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4a2817] border border-[#f6b262] text-[#ffdf79] text-[11px] font-bold shadow-pixel-sm">
          <span className="w-1.5 h-1.5 rounded-sm bg-[#f6b262] shadow-[0_0_6px_#f6b262]" />
          {showText && <span>金星品级</span>}
        </span>
      );
    }
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e293b] border border-[#94a3b8] text-[#e2e8f0] text-[11px] font-bold shadow-pixel-sm">
          <span className="w-1.5 h-1.5 rounded-sm bg-[#94a3b8]" />
          {showText && <span>银星品级</span>}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#291b10] border border-[#6b4226] text-[#d49b55] text-[11px]">
        <span>常规初选</span>
      </span>
    );
  }

  return null;
};

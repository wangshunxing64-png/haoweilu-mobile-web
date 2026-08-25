import React from 'react';

interface DesignSystemInspectorProps {
  active: boolean;
}

export const DesignSystemInspector: React.FC<DesignSystemInspectorProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* 16px (33rpx) Left Margin Guide */}
      <div className="absolute left-[16px] top-0 bottom-0 w-[1px] bg-red-500/50 border-r border-dashed border-red-500 flex flex-col justify-start">
        <span className="bg-red-600 text-white text-[10px] px-1 py-0.5 rounded-br font-mono">
          边距: 16px (33rpx)
        </span>
      </div>

      {/* 16px (33rpx) Right Margin Guide */}
      <div className="absolute right-[16px] top-0 bottom-0 w-[1px] bg-red-500/50 border-l border-dashed border-red-500 flex flex-col items-end justify-start">
        <span className="bg-red-600 text-white text-[10px] px-1 py-0.5 rounded-bl font-mono">
          边距: 16px (33rpx)
        </span>
      </div>

      {/* 52px Mobile Web Navigation Bar Guide */}
      <div className="absolute top-[38px] left-0 right-0 h-[52px] border-y border-dashed border-blue-500/60 bg-blue-500/5">
        <span className="absolute right-4 top-1 bg-blue-600 text-white text-[10px] px-1 py-0.5 rounded font-mono">
          网页导航: 52px
        </span>
      </div>

      {/* Bottom TabBar / CTA Guide */}
      <div className="absolute bottom-0 left-0 right-0 h-[64px] border-t border-dashed border-emerald-500/70 bg-emerald-500/5">
        <span className="absolute right-4 top-1 bg-emerald-600 text-white text-[10px] px-1 py-0.5 rounded font-mono">
          底部栏: 64px
        </span>
      </div>

      {/* Center Axis */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-amber-500/30 -translate-x-1/2" />
    </div>
  );
};


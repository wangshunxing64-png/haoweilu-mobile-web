import React from 'react';
import { Home, Sparkles, BookOpen } from 'lucide-react';
import { TabType } from '../types';

interface MobileWebTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onStartAssistant?: () => void;
}

export const MobileWebTabBar: React.FC<MobileWebTabBarProps> = ({
  activeTab,
  onTabChange,
  onStartAssistant,
}) => {
  const tabs = [
    { id: 'home' as TabType, label: '首页', icon: Home },
    { id: 'assistant' as TabType, label: '评价生成', icon: Sparkles },
    { id: 'profile' as TabType, label: '灵感库', icon: BookOpen },
  ];

  return (
    <nav className="h-[64px] border-t border-[#EBEBEB] flex items-center px-4 bg-white/95 backdrop-blur-md select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'assistant' && onStartAssistant) {
                  onStartAssistant();
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 transition-all cursor-pointer ${
                isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#932115]/10 text-[#932115] scale-105'
                    : 'text-[#5A534E]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[11px] font-medium transition-colors leading-none ${
                  isActive ? 'text-[#932115] font-semibold' : 'text-[#7F7671]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


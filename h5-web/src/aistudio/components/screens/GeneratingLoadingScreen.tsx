import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Music2, Cpu } from 'lucide-react';

interface GeneratingLoadingScreenProps {
  selectedTags?: string[];
  onComplete: () => void;
  autoTransition?: boolean;
}

const DEFAULT_SENTIMENTS = [
  '热情好客',
  '鲜香醇厚',
  '分量十足',
  '地道风味',
  '环境雅致',
  '上菜迅速',
  '食材极鲜',
  '服务周到',
];

const AI_THOUGHT_STEPS = [
  '正在倾听您的用餐心声...',
  '正在提炼招牌菜品的独特风味...',
  '正在融合真实细腻的就餐体验...',
  '正在为您定制最具真情实感的评价...',
];

export const GeneratingLoadingScreen: React.FC<GeneratingLoadingScreenProps> = ({
  selectedTags = [],
  onComplete,
  autoTransition = true,
}) => {
  const sentimentWords = selectedTags.length > 0 ? selectedTags : DEFAULT_SENTIMENTS;
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [thoughtStepIdx, setThoughtStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle the center sentiment word with smooth kinetic timing
  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWordIdx((prev) => (prev + 1) % sentimentWords.length);
    }, 750);
    return () => clearInterval(wordInterval);
  }, [sentimentWords.length]);

  // Cycle AI thinking stream steps
  useEffect(() => {
    const thoughtInterval = setInterval(() => {
      setThoughtStepIdx((prev) => (prev + 1) % AI_THOUGHT_STEPS.length);
    }, 650);
    return () => clearInterval(thoughtInterval);
  }, []);

  // Smooth realistic progress bar and automatic transition
  useEffect(() => {
    if (!autoTransition) return;

    const startTime = Date.now();
    const duration = 2600; // 2.6s balanced AI contemplation

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(nextProgress);

      if (elapsed >= duration) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [autoTransition, onComplete]);

  // Array of radial words for circular ring
  const ringWords = [
    '体验', '享受', '惊艳', '地道', '精致', '新鲜', '醇厚',
    '温馨', '雅致', '周到', '极致', '惊艳', '享受', '美食', '质感',
  ];

  return (
    <div className="flex-1 w-full h-full min-h-[580px] flex flex-col justify-between items-center px-6 pt-7 pb-6 bg-[#FAF7F3] relative overflow-hidden select-none">
      {/* Dynamic Background Ambient Waves */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.6, 0.35],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-[#FFEADB]/80 to-[#FCE3D9]/60 blur-3xl pointer-events-none"
      />

      {/* Top Header Typography Section */}
      <div className="w-full flex flex-col items-center text-center mt-2 z-10 space-y-1.5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#F2DDD3] text-[#932115] text-[11px] font-semibold shadow-2xs mb-1"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span>智能助手正在构思</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[26px] sm:text-[28px] font-black text-[#1F1B18] tracking-tight leading-tight"
        >
          正在聆听心声
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[14.5px] text-[#706761] font-normal tracking-wide"
        >
          正在为您构思最贴心的评价
        </motion.p>
      </div>

      {/* Center Dynamic Listening & Acoustic Resonator Core */}
      <div className="relative w-72 h-72 my-auto flex items-center justify-center z-10">
        {/* Expanding Sound Wave Pulses */}
        <motion.div
          animate={{
            scale: [0.85, 1.35],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute w-56 h-56 rounded-full border border-[#E8BDB0]/60 pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [0.85, 1.45],
            opacity: [0.45, 0],
          }}
          transition={{
            duration: 2.2,
            delay: 0.7,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute w-56 h-56 rounded-full border border-[#F0CEC4]/50 pointer-events-none"
        />

        {/* Rotating Circular Typography Ring (High Fidelity) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
        >
          <svg className="w-full h-full" viewBox="0 0 300 300">
            <defs>
              <path
                id="listeningRingPath"
                d="M 150, 150 m -112, 0 a 112,112 0 1,1 224,0 a 112,112 0 1,1 -224,0"
              />
            </defs>
            <text className="text-[13px] font-medium fill-[#CBB4A9] tracking-[5.5px]">
              <textPath href="#listeningRingPath" startOffset="0%">
                {ringWords.join(' ')}
              </textPath>
            </text>
          </svg>
        </motion.div>

        {/* Outer Circular Dashed Orbit */}
        <div className="w-[218px] h-[218px] rounded-full border border-dashed border-[#E8CBC0]/70 absolute pointer-events-none" />

        {/* Middle Frosted Glowing Core Circle */}
        <div className="w-[172px] h-[172px] rounded-full bg-white/70 backdrop-blur-md border border-[#F5DDD4] shadow-md flex items-center justify-center relative overflow-hidden">
          {/* Inner ambient light gradient */}
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 bg-gradient-to-tr from-[#FFF5F0] via-[#FDF0EA] to-[#FCE7DF] opacity-90"
          />

          {/* Radial Center Ripple Lines */}
          <div className="absolute inset-4 rounded-full border border-[#EED4CA]/60 pointer-events-none" />

          {/* Central Animated Keyword Card */}
          <div className="z-20 text-center px-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={sentimentWords[currentWordIdx]}
                initial={{ opacity: 0, scale: 0.75, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.15, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="text-[23px] sm:text-[25px] font-black text-[#932115] tracking-wide"
                style={{
                  textShadow: '0 2px 8px rgba(147, 33, 21, 0.15)',
                }}
              >
                {sentimentWords[currentWordIdx]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Sparkle Particles */}
        <motion.div
          animate={{ y: [-4, 4, -4], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute -top-1 right-10 text-[#C97B66]"
        >
          ✦
        </motion.div>
        <motion.div
          animate={{ y: [4, -4, 4], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-1 left-12 text-[#C97B66]"
        >
          ✦
        </motion.div>
      </div>

      {/* Bottom Live AI Thought Stream */}
      <div className="w-full flex flex-col items-center space-y-2 pb-4 z-10">
        {/* Dynamic Thought Stream Text */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={thoughtStepIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-[13px] text-[#7F7671] font-medium text-center tracking-tight"
            >
              {AI_THOUGHT_STEPS[thoughtStepIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

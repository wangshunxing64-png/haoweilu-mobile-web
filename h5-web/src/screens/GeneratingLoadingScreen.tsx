import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
export function GeneratingLoadingScreen() { return <section className="generating-screen"><div className="ai-loader"><i /><motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1.8 }}><Sparkles size={34} /></motion.div></div><p className="eyebrow">AI 正在整理</p><h1>把你的感受<br />写成自然的表达</h1><div className="floating-words"><span>真实</span><span>具体</span><span>有温度</span></div><p>正在结合菜品与体验生成 3 种风格</p></section>; }

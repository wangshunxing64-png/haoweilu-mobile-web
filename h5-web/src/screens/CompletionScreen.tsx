import { Check, Gift, Heart } from "lucide-react";
import type { RewardRecord } from "../types/api";
import { StepProgress } from "../components/StepProgress";
import { RewardModal } from "../components/RewardModal";
export function CompletionScreen({ reward, loading, error, onClaim, onCloseReward }: { reward?: RewardRecord; loading: boolean; error?: string; onClaim(): void; onCloseReward(): void }) { return <section className="completion-screen"><StepProgress current={6} /><div className="success-mark"><Check /></div><p className="eyebrow">本次记录已完成</p><h1>谢谢你认真分享<br />这一餐的感受</h1><p>真实反馈会帮助门店把味道和服务做得更好。</p><div className="thanks-card"><Heart /><span><b>一份来自门店的心意</b><small>完成真实用餐反馈，可领取门店感谢礼。</small></span></div>{error && <p className="inline-error">{error}</p>}<button className="primary-button" onClick={onClaim} disabled={loading}><Gift size={20} />{loading ? "正在领取…" : "领取门店感谢礼"}</button>{reward && <RewardModal reward={reward} onClose={onCloseReward} />}</section>; }

import { RefreshCcw, WifiOff } from "lucide-react";
export function NetworkErrorState({ message, onRetry }: { message: string; onRetry(): void }) { return <section className="center-state"><span className="state-icon"><WifiOff /></span><h1>暂时连接不上</h1><p>{message}</p><button className="primary-button compact" onClick={onRetry}><RefreshCcw size={18} />重新加载</button></section>; }

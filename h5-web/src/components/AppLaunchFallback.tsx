import { Info } from "lucide-react";
export function AppLaunchFallback({ hint }: { hint: string }) { return <div className="launch-fallback" role="status"><Info size={18} /><span><b>未检测到应用</b>{hint}</span></div>; }

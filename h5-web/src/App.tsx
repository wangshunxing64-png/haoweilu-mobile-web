import { useState } from "react";
import { MobileWebApp } from "./aistudio/components/MobileWebApp";
import type { ScreenType } from "./aistudio/types";

export function App() {
  const [screen, setScreen] = useState<ScreenType>("home");
  return (
    <main aria-label="好味录" className="min-h-dvh w-full bg-[#FAF8F5] flex items-start justify-center sm:items-center">
      <MobileWebApp showInspector={false} currentScreen={screen} onChangeScreen={setScreen} />
    </main>
  );
}

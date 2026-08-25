import { Check } from "lucide-react";
export function ExperienceChip({ name, selected, onToggle }: { name: string; selected: boolean; onToggle(): void }) { return <button type="button" className={`chip ${selected ? "is-selected" : ""}`} onClick={onToggle} aria-pressed={selected}>{selected && <Check size={15} />}{name}</button>; }

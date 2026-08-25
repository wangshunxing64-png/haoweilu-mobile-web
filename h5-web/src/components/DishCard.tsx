import { Check, Utensils } from "lucide-react";
import type { Dish } from "../types/api";
export function DishCard({ dish, selected, onToggle }: { dish: Dish; selected: boolean; onToggle(): void }) { return <button type="button" className={`dish-card ${selected ? "is-selected" : ""}`} onClick={onToggle} aria-pressed={selected}><span className="dish-icon"><Utensils size={22} /></span><span className="dish-copy"><b>{dish.name}</b><small>{dish.description || "记录这道菜的真实味道"}</small></span><span className="check-dot">{selected && <Check size={15} strokeWidth={3} />}</span></button>; }

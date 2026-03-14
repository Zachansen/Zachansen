export type MemoryCategory =
  | "belief"
  | "pattern"
  | "breakthrough"
  | "resistance"
  | "value"
  | "trigger"
  | "preference"
  | "framework_effectiveness";

export interface Memory {
  category: MemoryCategory;
  content: string;
  sourceSessionId?: string;
  relevanceScore: number;
}

export type GoalCategory =
  | "health"
  | "career"
  | "spiritual"
  | "relationship"
  | "financial"
  | "personal"
  | "creative"
  | "education";

export type GoalStatus = "active" | "completed" | "abandoned" | "paused";

export interface Milestone {
  id: string;
  title: string;
  deadline?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Goal {
  title: string;
  description: string;
  category: GoalCategory;
  deadline?: string;
  status: GoalStatus;
  milestones: Milestone[];
}

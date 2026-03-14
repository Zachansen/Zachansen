export type MessageRole = "user" | "assistant";

export interface SessionMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
  frameworksUsed?: string[];
}

export interface ActionItem {
  text: string;
  deadline?: string;
  completed: boolean;
}

export interface SessionInsight {
  content: string;
  category: string;
  extractedAt: number;
}

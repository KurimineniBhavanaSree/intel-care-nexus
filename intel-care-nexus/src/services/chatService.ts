import { request } from "@/lib/api";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { title: string; source: string }[];
  created_at?: string;
};

export type ChatRequest = {
  content: string;
  report_id?: number;
  image_id?: number;
};

export type ChatResponse = {
  message: {
    id: number;
    role: string;
    content: string;
    citations?: { title: string; source: string }[];
    created_at: string;
  };
  citations?: { title: string; source: string }[];
  follow_up_questions?: string[];
};

export const chatService = {
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    return request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getHistory(): Promise<ChatMessage[]> {
    return request<ChatMessage[]>("/chat/history");
  },

  async getCount(): Promise<{ count: number }> {
    return request<{ count: number }>("/chat/count");
  },

  async clearHistory(): Promise<void> {
    await request<void>("/chat/clear", { method: "DELETE" });
  },
};

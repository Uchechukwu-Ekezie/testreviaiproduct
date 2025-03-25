export interface Message {
  id: string;
  prompt?: string;
  response?: string;
  created_at?: string;
  attachment?: File | null;
  image?: File | null;
}

export interface ChatSession {
  id: string;
  chat_title: string;
  created_at?: string;
  user?: string;
} 
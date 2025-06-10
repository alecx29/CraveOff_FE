export interface OriaChat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface OriaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  isLoading?: boolean; // Optional property to indicate loading state
}

export interface OriaChatWithMessages extends OriaChat {
  messages: OriaMessage[];
}

export interface SendMessageRequest {
  chat_id: string;
  content: string;
}

export interface SendMessageResponse {
  id: string;
  role: "assistant";
  content: string;
  created_at: string;
}

export interface StreamingMessageChunk {
  id: string;
  role: "assistant";
  content: string;
  done: boolean;
}

export interface CreateChatRequest {
  title?: string; // Optional as the API might generate a title
}

export interface CreateChatResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface UpdateChatTitleRequest {
  title: string;
}

export interface UpdateChatTitleResponse {
  id: string;
  title: string;
}

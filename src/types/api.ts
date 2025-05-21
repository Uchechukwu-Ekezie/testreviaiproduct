import type { Context } from "./chatMessage";

export interface DecodedToken {
    user_id: string;
    exp: number;
    iat: number;
    jti: string;
    token_type: string;
  }
  
 export interface ChatMessageResponse {
    id: string;
    prompt: string;
    response: string;
    session: string;
    classification: string;
    context: Context[];
    created_at: string;
    updated_at: string;
  }
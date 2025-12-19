export interface Message {
  id: string;
  prompt?: string;
  response?: string;
  classification?: string;
  context?: string;
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

export interface ChatSubmitLocation {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface ChatSubmitOptions {
  imageUrls?: string[];
  file?: File;
  location?: string;
  locationDetails?: ChatSubmitLocation;
  locationLabel?: string;
  userLatitude?: number;
  userLongitude?: number;
}
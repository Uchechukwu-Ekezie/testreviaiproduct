export interface Message {
  id: string;
  prompt?: string;
  response?: string;
  session?: string | null | undefined;
  classification?: string;
  error?: boolean;
  retrying?: boolean;
  isNewSession?: boolean;
  properties?: Property[];
  context?: Context[];
}

export interface Property {
  id?: string;
  title?: string;
  description?: string;
  price?: string;
  address?: string;
  property_type?: string;
  status?: string;
  visibility_status?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  size?: string | null;
  listed_by?: string | null;
  year_built?: string;
  lot_size?: string;
  square_footage?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  image_url?: string | null;
  property_url?: string | null;
  phone?: string;
  created_by?: string;
  location?: string;
  cordinates?: string;
  rental_grade?: number | string;
  environmental_score?: number | string;
  neighborhood_score?: number | string;
  ai_refined_description?: string;
  environmental_report?: string;
}

export interface Context {
  id?: string;
  title?: string;
  description?: string;
  price?: number | string;
  address?: string;
  property_type?: string;
  status?: string; // 'for_rent' | 'for_sale' | 'just_listing' | string
  visibility_status?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  size?: string | null;
  listed_by?: string | null;
  year_built?: string;
  lot_size?: string;
  square_footage?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  image_url?: string | null;
  property_url?: string | null;
  phone?: string;
  created_by?: string;
  property?: string;
  coordinate?: string;
  location?: string;
  cordinates?: string;
  rental_grade?: number | string;
  environmental_score?: number | string;
  neighborhood_score?:  string;
  ai_refined_description?: string;
  environmental_report?: string;
  photos?: string[];
}

export interface ActionCard {
  title: string;
  description: string;
  image: any;
  message: string;
}
export interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isSessionLoading?: boolean;
  latestMessageId: string | null;
  setLatestMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  activeSession: string | null;
  setActiveSession: React.Dispatch<React.SetStateAction<string | null>>;
  sessions: any[];
  setSessions: React.Dispatch<React.SetStateAction<any[]>>;
  actionCards: ActionCard[];
  handleCardClick?: (card: ActionCard) => void;
  isAuthenticated: boolean;
  user: any;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  refreshSessions: () => Promise<void>;
  isLgScreen: boolean;
  sidebarCollapsed?: boolean;
  sidebarOpen?: boolean;
}
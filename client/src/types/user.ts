import { User } from './index';

// User Management Types
export interface UserWithTenant extends User {
  tenant?: {
    id: string;
    name: string;
    roomId: number;
    isActive: boolean;
    moveInDate?: Date;
    moveOutDate?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface LinkingSuggestion {
  user: User;
  tenant: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    roomId: number;
    isActive: boolean;
  };
  matchType: 'email_exact';
}

export interface SuggestionsResponse {
  suggestions: LinkingSuggestion[];
  unlinkedUsers: User[];
  unlinkedTenants: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    roomId: number;
    isActive: boolean;
  }>;
}

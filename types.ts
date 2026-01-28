export interface Property {
  id: string;
  ownerId?: string; // ✅ Link to auth.users
  title: string;
  description: string;
  location: string;
  price: number;
  weekend_price?: number; // Price for Friday/Saturday nights
  seasonal_price?: number; // Optional peak season price
  cleaning_fee?: number;  // One-time cleaning fee
  min_stay?: number;      // Minimum number of nights
  rating: number;
  reviews: number;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  imageUrl: string;
  gallery: string[];
  amenities: string[];
  tags: ('Superhost' | 'Novo' | 'Ecológico')[];
  featured?: boolean;
  ownerPhone: string; // WhatsApp number of the property owner
  coordinates: {
    lat: number;
    lng: number;
  };
  owner: {
    name: string;
    avatar: string;
    isSuperhost: boolean;
    joinedDate: string;
    responseRate: string;
    responseTime: string;
    bio?: string;
  };
}

export interface Lead {
  id: string;
  name: string;
  property: string;
  date: string;
  status: 'Novo' | 'Contatado' | 'Fechado';
  lastMessage: string;
}

export interface Stats {
  totalProperties: number;
  activeLeads: number;
  monthlyConversion: number;
  totalRevenue: number;
}

export type Page = 'HOME' | 'DETAILS' | 'LOGIN' | 'ADMIN_DASHBOARD';

export interface User {
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
}
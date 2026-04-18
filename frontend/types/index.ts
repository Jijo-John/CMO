export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Business {
  id: string;
  name: string;
  logo?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  role: 'owner' | 'admin' | 'creator' | 'reviewer' | 'viewer';
}

export interface Platform {
  id: string;
  name: string;
  brand_color: string;
  icon_placeholder: string;
  content_rules?: {
    maxChars?: number;
    maxHashtags?: number | string;
    imageAspectRatios?: string[];
    videoOnly?: boolean;
  };
}

export interface Content {
  id: string;
  business_id: string;
  title: string;
  caption?: string;
  hashtags?: string;
  status: 'draft' | 'review' | 'approved' | 'posted' | 'rejected';
  scheduled_date?: string;
  posted_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  platforms?: ContentPlatform[];
  media?: Media[];
}

export interface ContentPlatform {
  id: string;
  content_id: string;
  platform_id: string;
  platform_name?: string;
  brand_color?: string;
  platform_caption?: string;
  platform_hashtags?: string;
  is_posted: boolean;
  posted_at?: string;
}

export interface Media {
  id: string;
  business_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_by: string;
  created_at: string;
  uploader_name?: string;
}

export interface ActivityLog {
  id: string;
  business_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  created_at: string;
  user_name?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  status: string;
  scheduled_date?: string;
  posted_date?: string;
  platforms: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export type Role = 'owner' | 'admin' | 'creator' | 'reviewer' | 'viewer';

export const roleHierarchy: Record<Role, number> = {
  viewer: 1,
  creator: 2,
  reviewer: 3,
  admin: 4,
  owner: 5,
};

export const platformColors: Record<string, string> = {
  linkedin: '#0A66C2',
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#000000',
  youtube: '#FF0000',
  pinterest: '#E60023',
  'google-business': '#4285F4',
  tiktok: '#000000',
  snapchat: '#FFFC00',
  reddit: '#FF4500',
  threads: '#000000',
};

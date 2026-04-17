export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Business {
  id: string;
  name: string;
  logo: string | null;
  owner_id: string;
  role: 'owner' | 'admin' | 'creator' | 'reviewer' | 'viewer';
  joined_at: string;
}

export interface Platform {
  id: string;
  name: string;
  brand_color: string;
  icon_placeholder: string;
  content_rules: string;
}

export interface Content {
  id: string;
  business_id: string;
  title: string;
  caption: string | null;
  hashtags: string | null;
  status: 'draft' | 'review' | 'approved' | 'posted';
  scheduled_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  platforms: Platform[];
  media: Media[];
  mediaCount?: number;
}

export interface Media {
  id: string;
  content_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_at: string;
  content_title?: string;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'creator' | 'reviewer' | 'viewer';
  joined_at: string;
}

export interface ActivityLog {
  id: string;
  business_id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
}

export type Role = 'owner' | 'admin' | 'creator' | 'reviewer' | 'viewer';

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 5,
  admin: 4,
  reviewer: 3,
  creator: 2,
  viewer: 1,
};

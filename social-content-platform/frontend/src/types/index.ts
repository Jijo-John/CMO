export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface Business {
  id: string;
  name: string;
  logoUrl?: string;
  ownerId: string;
  role?: string;
  joinedAt?: string;
}

export interface Platform {
  id: string;
  name: string;
  brandColor: string;
  iconPlaceholder: string;
  contentRules: {
    maxChars?: number;
    hashtagLimit?: number;
    supportsVideo: boolean;
    supportsImage: boolean;
  };
}

export interface Content {
  id: string;
  businessId: string;
  title: string;
  caption?: string;
  hashtags?: string[];
  scheduledDate?: string;
  status: 'draft' | 'review' | 'approved' | 'posted' | 'rejected';
  createdBy: string;
  creatorName?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  postedAt?: string;
  rejectionReason?: string;
  qualityScore?: number;
  platforms?: ContentPlatform[];
  media?: Media[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentPlatform {
  id: string;
  contentId: string;
  platformId: string;
  name: string;
  brandColor: string;
  iconPlaceholder: string;
  captionOverride?: string;
  hashtagsOverride?: string[];
  isPosted: boolean;
  postedAt?: string;
}

export interface Media {
  id: string;
  businessId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  uploadedBy: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface BusinessState {
  businesses: Business[];
  currentBusiness: Business | null;
}

export type UserRole = 'owner' | 'admin' | 'creator' | 'reviewer' | 'viewer';

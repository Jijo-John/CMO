export const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: 'in' },
  { id: 'instagram', name: 'Instagram', color: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', icon: 'ig' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'fb' },
  { id: 'x', name: 'X', color: '#000000', icon: 'x' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: 'yt' },
  { id: 'pinterest', name: 'Pinterest', color: '#E60023', icon: 'pi' },
  { id: 'google', name: 'Google Business Profile', color: '#4285F4', icon: 'gbp' },
  { id: 'tiktok', name: 'TikTok', color: '#000000', icon: 'tt' },
  { id: 'snapchat', name: 'Snapchat', color: '#FFFC00', icon: 'sc' },
  { id: 'reddit', name: 'Reddit', color: '#FF4500', icon: 'rd' },
  { id: 'threads', name: 'Threads', color: '#000000', icon: 'th' },
];

export const ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full control over business' },
  { value: 'admin', label: 'Admin', description: 'Manage users and content' },
  { value: 'creator', label: 'Creator', description: 'Create and edit content' },
  { value: 'reviewer', label: 'Reviewer', description: 'Approve or reject content' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'posted', label: 'Posted' },
  { value: 'rejected', label: 'Rejected' },
];

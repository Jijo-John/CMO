import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(date));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    posted: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPlatformColor(platformName: string): string {
  const colors: Record<string, string> = {
    LinkedIn: 'bg-[#0A66C2]',
    Instagram: 'bg-gradient-to-r from-[#f09433] to-[#bc1888]',
    Facebook: 'bg-[#1877F2]',
    X: 'bg-[#000000]',
    Twitter: 'bg-[#000000]',
    YouTube: 'bg-[#FF0000]',
    Pinterest: 'bg-[#E60023]',
    TikTok: 'bg-[#000000]',
    Snapchat: 'bg-[#FFFC00]',
    Reddit: 'bg-[#FF4500]',
    Threads: 'bg-[#000000]',
  };
  
  return colors[platformName] || 'bg-gray-500';
}

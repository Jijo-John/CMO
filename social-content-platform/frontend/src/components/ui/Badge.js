export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const statusConfig = {
    draft: { label: 'Draft', variant: 'default' },
    review: { label: 'In Review', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    posted: { label: 'Posted', variant: 'info' },
    rejected: { label: 'Rejected', variant: 'error' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant={config.variant}>{config.label}</Badge>
  );
}

export function PlatformBadge({ platform, className = '' }) {
  const platformIcons = {
    LinkedIn: 'in',
    Instagram: 'ig',
    Facebook: 'fb',
    X: 'X',
    YouTube: 'yt',
    Pinterest: 'pi',
    'Google Business Profile': 'gbp',
    TikTok: 'tt',
    Snapchat: 'sc',
    Reddit: 'rd',
    Threads: 'th',
  };

  return (
    <span 
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold platform-${platform.toLowerCase().replace(/\s+/g, '-')} ${className}`}
      title={platform}
    >
      {platformIcons[platform] || platform[0]}
    </span>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Layout from '@/components/layout';
import { Spinner } from '@/components/ui';
import { contentApi } from '@/lib/services';

export default function DashboardPage() {
  const { selectedBusiness } = useAuthStore();
  const [stats, setStats] = useState({ total: 0, draft: 0, review: 0, approved: 0, posted: 0 });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!selectedBusiness) return;

    const fetchStats = async () => {
      try {
        const data = await contentApi.getDashboardStats(selectedBusiness.id);
        setStats(data.stats);
        setActivity(data.stats.recentActivity || []);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedBusiness]);

  const statCards = [
    { label: 'Total Content', value: stats.total, color: 'bg-blue-500' },
    { label: 'Drafts', value: stats.draft, color: 'bg-gray-500' },
    { label: 'In Review', value: stats.review, color: 'bg-yellow-500' },
    { label: 'Approved', value: stats.approved, color: 'bg-green-500' },
    { label: 'Posted', value: stats.posted, color: 'bg-primary-500' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className={`h-2 w-12 ${stat.color} rounded-full mb-3`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => router.push('/content/new')} className="bg-primary-600 text-white rounded-xl p-6 text-left hover:bg-primary-700 transition-colors">
            <h3 className="text-lg font-semibold mb-2">Create New Content</h3>
            <p className="text-primary-100 text-sm">Draft a new post for your social media channels</p>
          </button>
          <button onClick={() => router.push('/calendar')} className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-left hover:border-primary-500 transition-colors">
            <h3 className="text-lg font-semibold mb-2">View Calendar</h3>
            <p className="text-gray-500 text-sm">See your content schedule at a glance</p>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                    {log.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{log.details}</p>
                    <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

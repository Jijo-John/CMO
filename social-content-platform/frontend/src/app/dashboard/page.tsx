'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useBusinessStore } from '@/context/store';
import { contentApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { currentBusiness } = useBusinessStore();
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    review: 0,
    approved: 0,
    posted: 0,
  });
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentBusiness) return;

    const loadDashboardData = async () => {
      try {
        // Load recent content
        const response = await contentApi.getAll(currentBusiness.id, { limit: 5 });
        const content = response.data.data;
        setRecentContent(content);

        // Calculate stats
        const statsMap: Record<string, number> = { total: content.length };
        content.forEach((item: any) => {
          statsMap[item.status] = (statsMap[item.status] || 0) + 1;
        });

        setStats({
          total: response.data.pagination?.total || 0,
          draft: statsMap.draft || 0,
          review: statsMap.review || 0,
          approved: statsMap.approved || 0,
          posted: statsMap.posted || 0,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentBusiness]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your content.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Content" value={stats.total} color="bg-gray-500" />
        <StatCard label="Drafts" value={stats.draft} color="bg-gray-400" />
        <StatCard label="In Review" value={stats.review} color="bg-yellow-500" />
        <StatCard label="Approved" value={stats.approved} color="bg-green-500" />
        <StatCard label="Posted" value={stats.posted} color="bg-blue-500" />
      </div>

      {/* Recent Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Content</h2>
          <Link href="/content" className="text-sm text-primary-600 hover:text-primary-700">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platforms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentContent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No content yet. Create your first post!
                  </td>
                </tr>
              ) : (
                recentContent.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-1">
                        {item.platforms?.slice(0, 3).map((platform: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-medium text-gray-600"
                          >
                            {platform.charAt(0)}
                          </span>
                        ))}
                        {item.platforms && item.platforms.length > 3 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                            +{item.platforms.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="ml-3 text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title as ChartTitle
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ChartTitle);

const KYCAnalytics: React.FC = () => {
  const [kycData, setKycData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    statusCounts: { approved: 0, rejected: 0, submitted: 0, under_review: 0, draft: 0 },
    submissionsByDate: {} as Record<string, number>,
    approvalsByDate: {} as Record<string, number>,
    rejectionsByDate: {} as Record<string, number>,
    avgReviewTime: 0,
  });

  useEffect(() => {
    const fetchKYC = async () => {
      setLoading(true);
      const { data } = await supabase.from('kyc_applications').select('*');
      setKycData(data || []);
      setLoading(false);
    };
    fetchKYC();
  }, []);

  useEffect(() => {
    if (!kycData.length) return;
    // Status counts
    const statusCounts = { approved: 0, rejected: 0, submitted: 0, under_review: 0, draft: 0 };
    const submissionsByDate: Record<string, number> = {};
    const approvalsByDate: Record<string, number> = {};
    const rejectionsByDate: Record<string, number> = {};
    let totalReviewTime = 0;
    let reviewCount = 0;
    kycData.forEach((k: any) => {
      statusCounts[k.status] = (statusCounts[k.status] || 0) + 1;
      if (k.submitted_at) {
        const date = k.submitted_at.slice(0, 10);
        submissionsByDate[date] = (submissionsByDate[date] || 0) + 1;
      }
      if (k.status === 'approved' && k.submitted_at && k.reviewed_at) {
        const date = k.reviewed_at.slice(0, 10);
        approvalsByDate[date] = (approvalsByDate[date] || 0) + 1;
        // Review time in hours
        const t1 = new Date(k.submitted_at).getTime();
        const t2 = new Date(k.reviewed_at).getTime();
        totalReviewTime += (t2 - t1) / (1000 * 60 * 60);
        reviewCount++;
      }
      if (k.status === 'rejected' && k.submitted_at && k.reviewed_at) {
        const date = k.reviewed_at.slice(0, 10);
        rejectionsByDate[date] = (rejectionsByDate[date] || 0) + 1;
        // Review time in hours
        const t1 = new Date(k.submitted_at).getTime();
        const t2 = new Date(k.reviewed_at).getTime();
        totalReviewTime += (t2 - t1) / (1000 * 60 * 60);
        reviewCount++;
      }
    });
    setStats({
      statusCounts,
      submissionsByDate,
      approvalsByDate,
      rejectionsByDate,
      avgReviewTime: reviewCount ? (totalReviewTime / reviewCount) : 0,
    });
  }, [kycData]);

  // Prepare chart data
  const statusPieData = {
    labels: Object.keys(stats.statusCounts),
    datasets: [
      {
        label: 'KYC Status',
        data: Object.values(stats.statusCounts),
        backgroundColor: [
          '#4ade80', // approved
          '#f87171', // rejected
          '#60a5fa', // submitted
          '#facc15', // under_review
          '#a3a3a3', // draft
        ],
      },
    ],
  };
  const dateLabels = Array.from(new Set([
    ...Object.keys(stats.submissionsByDate),
    ...Object.keys(stats.approvalsByDate),
    ...Object.keys(stats.rejectionsByDate),
  ])).sort();
  const submissionsLineData = {
    labels: dateLabels,
    datasets: [
      {
        label: 'Submitted',
        data: dateLabels.map(d => stats.submissionsByDate[d] || 0),
        borderColor: '#60a5fa',
        backgroundColor: '#60a5fa33',
        fill: true,
      },
      {
        label: 'Approved',
        data: dateLabels.map(d => stats.approvalsByDate[d] || 0),
        borderColor: '#4ade80',
        backgroundColor: '#4ade8033',
        fill: true,
      },
      {
        label: 'Rejected',
        data: dateLabels.map(d => stats.rejectionsByDate[d] || 0),
        borderColor: '#f87171',
        backgroundColor: '#f8717133',
        fill: true,
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">KYC Analytics</h1>
        {loading ? (
          <div>Loading analytics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>KYC Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Pie data={statusPieData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>KYC Submissions & Outcomes Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Line data={submissionsLineData} />
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Average Review Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgReviewTime.toFixed(2)} hours</div>
                <div className="text-gray-500 text-sm mt-2">Average time from submission to approval/rejection</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default KYCAnalytics; 
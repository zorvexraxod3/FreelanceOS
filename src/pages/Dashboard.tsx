import { useEffect, useState } from 'react';
import { supabase, type Client, type Milestone, type Invoice } from '../lib/supabase';
import {
  Clock,
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    pendingReviews: 0,
    overduePayments: 0,
    monthlyRevenue: 0,
    totalClients: 0,
    activeProjects: 0,
    totalInvoices: 0,
  });
  const [recentMilestones, setRecentMilestones] = useState<Milestone[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    const now = new Date().toISOString();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [
      { data: clients },
      { data: milestones },
      { data: invoices },
      { data: projects },
    ] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('milestones').select('*, projects(name, clients(name))').order('updated_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('*, projects(name, clients(name))').order('created_at', { ascending: false }).limit(5),
      supabase.from('projects').select('*').eq('status', 'Active'),
    ]);

    const pendingReviews = (milestones || []).filter((m: any) => m.status === 'Ready for Review').length;
    const overduePayments = (invoices || []).filter((i: any) => i.status === 'Overdue').length;
    const monthlyRevenue = (invoices || [])
      .filter((i: any) => i.status === 'Paid' && i.paid_at && i.paid_at >= startOfMonth)
      .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

    setStats({
      pendingReviews,
      overduePayments,
      monthlyRevenue,
      totalClients: clients?.length || 0,
      activeProjects: projects?.length || 0,
      totalInvoices: invoices?.length || 0,
    });

    setRecentMilestones(milestones || []);
    setRecentInvoices(invoices || []);
    setLoading(false);
  }

  const statCards = [
    {
      label: 'Pending Reviews',
      value: stats.pendingReviews,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      link: '/projects',
    },
    {
      label: 'Overdue Payments',
      value: stats.overduePayments,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      link: '/invoices',
    },
    {
      label: 'Revenue This Month',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      link: '/invoices',
    },
    {
      label: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      link: '/clients',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-slate-400">Overview of your freelance business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-slate-400 mt-1">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Recent Milestones
            </h3>
            <Link to="/projects" className="text-sm text-blue-400 hover:text-blue-300">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentMilestones.length === 0 && (
              <p className="text-slate-500 text-sm">No milestones yet</p>
            )}
            {recentMilestones.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {m.projects?.name} — {m.projects?.clients?.name}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Recent Invoices
            </h3>
            <Link to="/invoices" className="text-sm text-blue-400 hover:text-blue-300">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentInvoices.length === 0 && (
              <p className="text-slate-500 text-sm">No invoices yet</p>
            )}
            {recentInvoices.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-sm">{i.invoice_number}</p>
                  <p className="text-xs text-slate-500">
                    {i.projects?.name} — {i.projects?.clients?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${Number(i.amount).toLocaleString()}</p>
                  <StatusBadge status={i.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Active': 'bg-blue-400/10 text-blue-400',
    'Pending Payment': 'bg-amber-400/10 text-amber-400',
    'Overdue': 'bg-red-400/10 text-red-400',
    'Draft': 'bg-slate-400/10 text-slate-400',
    'Sent': 'bg-blue-400/10 text-blue-400',
    'Paid': 'bg-emerald-400/10 text-emerald-400',
    'In Progress': 'bg-blue-400/10 text-blue-400',
    'Ready for Review': 'bg-amber-400/10 text-amber-400',
    'Approved': 'bg-emerald-400/10 text-emerald-400',
    'Auto-Approved': 'bg-purple-400/10 text-purple-400',
    'Rejected': 'bg-red-400/10 text-red-400',
    'Completed': 'bg-emerald-400/10 text-emerald-400',
    'On Hold': 'bg-slate-400/10 text-slate-400',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || 'bg-slate-400/10 text-slate-400'}`}>
      {status}
    </span>
  );
}

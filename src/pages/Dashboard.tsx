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
      trend: null,
    },
    {
      label: 'Overdue Payments',
      value: stats.overduePayments,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      link: '/invoices',
      trend: null,
    },
    {
      label: 'Revenue This Month',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      link: '/invoices',
      trend: 'up',
    },
    {
      label: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      link: '/clients',
      trend: null,
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
              className="stat-card group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                {card.trend === 'up' && (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                )}
                {card.trend === 'down' && (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-sm text-slate-400 mt-2">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Recent Milestones
            </h3>
            <Link to="/projects" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-1">
            {recentMilestones.length === 0 && (
              <p className="text-slate-500 text-sm py-8 text-center">No milestones yet</p>
            )}
            {recentMilestones.map((m: any, idx: number) => (
              <div key={m.id} className={`flex items-start gap-4 py-3 ${idx !== recentMilestones.length - 1 ? 'border-b border-slate-800/50' : ''}`}>
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  {idx !== recentMilestones.length - 1 && (
                    <div className="w-0.5 h-8 bg-slate-700 mt-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {m.projects?.name} • {m.projects?.clients?.name}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-emerald-400" />
              Recent Invoices
            </h3>
            <Link to="/invoices" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-1">
            {recentInvoices.length === 0 && (
              <p className="text-slate-500 text-sm py-8 text-center">No invoices yet</p>
            )}
            {recentInvoices.map((i: any, idx: number) => (
              <div key={i.id} className={`flex items-start gap-4 py-3 ${idx !== recentInvoices.length - 1 ? 'border-b border-slate-800/50' : ''}`}>
                <div className="flex flex-col items-center mt-1">
                  <div className={`w-2 h-2 rounded-full ${i.status === 'Overdue' ? 'bg-red-500' : i.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {idx !== recentInvoices.length - 1 && (
                    <div className="w-0.5 h-8 bg-slate-700 mt-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{i.invoice_number}</p>
                      <p className="text-xs text-slate-500">
                        {i.projects?.name} • {i.projects?.clients?.name}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-100 whitespace-nowrap">${Number(i.amount).toLocaleString()}</p>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={i.status} />
                  </div>
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

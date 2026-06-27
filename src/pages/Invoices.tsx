import { useEffect, useState } from 'react';
import { supabase, type Invoice } from '../lib/supabase';
import { FileText, Search, DollarSign, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({ total: 0, paid: 0, overdue: 0, pending: 0 });

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, projects(name, clients(name))')
      .order('created_at', { ascending: false });

    const invoicesData = data || [];
    setInvoices(invoicesData);
    setSummary({
      total: invoicesData.reduce((s: number, i: any) => s + Number(i.amount), 0),
      paid: invoicesData.filter((i: any) => i.status === 'Paid').reduce((s: number, i: any) => s + Number(i.amount), 0),
      overdue: invoicesData.filter((i: any) => i.status === 'Overdue').reduce((s: number, i: any) => s + Number(i.amount), 0),
      pending: invoicesData.filter((i: any) => i.status === 'Sent').reduce((s: number, i: any) => s + Number(i.amount), 0),
    });
    setLoading(false);
  }

  const filtered = invoices.filter(
    (i: any) =>
      i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (i.projects?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.projects?.clients?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Invoices</h2>
        <p className="text-slate-400">Track payments and send reminders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Invoiced" value={`$${summary.total.toLocaleString()}`} icon={DollarSign} color="text-blue-400" bg="bg-blue-400/10" />
        <SummaryCard label="Paid" value={`$${summary.paid.toLocaleString()}`} icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-400/10" />
        <SummaryCard label="Pending" value={`$${summary.pending.toLocaleString()}`} icon={TrendingUp} color="text-amber-400" bg="bg-amber-400/10" />
        <SummaryCard label="Overdue" value={`$${summary.overdue.toLocaleString()}`} icon={AlertTriangle} color="text-red-400" bg="bg-red-400/10" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Invoice #</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Client / Project</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i: any) => (
                  <tr key={i.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{i.invoice_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{i.projects?.clients?.name}</p>
                      <p className="text-xs text-slate-500">{i.projects?.name}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">${Number(i.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={i.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {i.due_date ? new Date(i.due_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Draft': 'bg-slate-400/10 text-slate-400',
    'Sent': 'bg-blue-400/10 text-blue-400',
    'Paid': 'bg-emerald-400/10 text-emerald-400',
    'Overdue': 'bg-red-400/10 text-red-400',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || 'bg-slate-400/10 text-slate-400'}`}>
      {status}
    </span>
  );
}

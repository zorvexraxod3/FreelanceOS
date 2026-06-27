import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Project, type Client, type Milestone, type Invoice } from '../lib/supabase';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Link as LinkIcon,
  FileText,
  Lock,
  Unlock,
  Send,
  Trash2,
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ name: '', description: '' });
  const [invoiceForm, setInvoiceForm] = useState({ invoice_number: '', amount: '', due_date: '' });
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [{ data: projectData }, { data: milestonesData }, { data: invoicesData }] = await Promise.all([
      supabase.from('projects').select('*, clients(*)').eq('id', id).single(),
      supabase.from('milestones').select('*').eq('project_id', id).order('created_at', { ascending: true }),
      supabase.from('invoices').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ]);

    setProject(projectData);
    setClient(projectData?.clients || null);
    setMilestones(milestonesData || []);
    setInvoices(invoicesData || []);
    setLoading(false);
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const { error } = await supabase.from('milestones').insert([{ ...milestoneForm, project_id: id }]);
    if (!error) {
      setMilestoneForm({ name: '', description: '' });
      setShowMilestoneModal(false);
      fetchData();
    }
  }

  async function addInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const { error } = await supabase.from('invoices').insert([{
      ...invoiceForm,
      project_id: id,
      amount: Number(invoiceForm.amount),
    }]);
    if (!error) {
      setInvoiceForm({ invoice_number: '', amount: '', due_date: '' });
      setShowInvoiceModal(false);
      fetchData();
    }
  }

  async function updateMilestoneStatus(milestoneId: string, status: string) {
    const updates: any = { status };
    if (status === 'Ready for Review') {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 48);
      updates.review_deadline = deadline.toISOString();

      // Call edge function to send email
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-review-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            clientEmail: client?.email,
            clientName: client?.name,
            milestoneId,
            projectName: project?.name,
            milestoneName: milestones.find(m => m.id === milestoneId)?.name,
          }),
        });
      } catch (e) {
        console.error('Failed to send review email:', e);
      }
    }

    const { error } = await supabase.from('milestones').update(updates).eq('id', milestoneId);
    if (!error) fetchData();
  }

  async function updateInvoiceStatus(invoiceId: string, status: string) {
    const updates: any = { status };
    if (status === 'Sent') updates.sent_at = new Date().toISOString();
    if (status === 'Paid') updates.paid_at = new Date().toISOString();
    if (status === 'Overdue') {
      // Send reminder via edge function
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-reminder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            clientEmail: client?.email,
            clientName: client?.name,
            invoiceId,
            invoiceNumber: invoices.find(i => i.id === invoiceId)?.invoice_number,
            amount: invoices.find(i => i.id === invoiceId)?.amount,
          }),
        });
      } catch (e) {
        console.error('Failed to send invoice reminder:', e);
      }
    }

    const { error } = await supabase.from('invoices').update(updates).eq('id', invoiceId);
    if (!error) fetchData();
  }

  async function uploadFile(milestoneId: string, file: File) {
    setUploading(milestoneId);
    const fileExt = file.name.split('.').pop();
    const filePath = `${milestoneId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('milestone-files')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      // Try creating bucket if it doesn't exist
      await supabase.storage.createBucket('milestone-files', { public: true });
      await supabase.storage.from('milestone-files').upload(filePath, file, { upsert: true });
    }

    const { data: { publicUrl } } = supabase.storage.from('milestone-files').getPublicUrl(filePath);

    await supabase.from('milestones').update({ file_url: publicUrl }).eq('id', milestoneId);
    setUploading(null);
    fetchData();
  }

  async function releaseFiles() {
    if (!project || !client) return;
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-release-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          clientEmail: client.email,
          clientName: client.name,
          projectName: project.name,
          projectId: project.id,
        }),
      });
      alert('Release files notification sent to client!');
    } catch (e) {
      console.error('Failed to send release files:', e);
      alert('Failed to send release files notification');
    }
  }

  const paidInvoice = invoices.find((i) => i.status === 'Paid');
  const allPaid = invoices.length > 0 && invoices.every((i) => i.status === 'Paid');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Project not found</p>
        <Link to="/projects" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <p className="text-slate-400 text-sm">
              {client?.name} — <ProjectStatusBadge status={project.status} />
            </p>
          </div>
        </div>
        <button
          onClick={releaseFiles}
          disabled={!allPaid}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            allPaid
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          title={allPaid ? 'Release files to client' : 'All invoices must be paid first'}
        >
          {allPaid ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Release Files
        </button>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            Milestones
          </h3>
          <button
            onClick={() => setShowMilestoneModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        </div>

        {milestones.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-500">No milestones yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-medium">{milestone.name}</h4>
                    {milestone.description && (
                      <p className="text-sm text-slate-400 mt-1">{milestone.description}</p>
                    )}
                  </div>
                  <MilestoneStatusBadge status={milestone.status} />
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {milestone.staging_url && (
                    <a
                      href={milestone.staging_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Staging URL
                    </a>
                  )}
                  {milestone.file_url && (
                    <a
                      href={milestone.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Attached File
                    </a>
                  )}
                  {milestone.review_deadline && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Deadline: {new Date(milestone.review_deadline).toLocaleString()}
                    </span>
                  )}
                  {milestone.auto_approved_at && (
                    <span className="text-xs text-purple-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Auto-approved: {new Date(milestone.auto_approved_at).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {milestone.status === 'In Progress' && (
                    <button
                      onClick={() => updateMilestoneStatus(milestone.id, 'Ready for Review')}
                      className="inline-flex items-center gap-1.5 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Mark Ready for Review
                    </button>
                  )}
                  {milestone.status === 'Ready for Review' && (
                    <>
                      <button
                        onClick={() => updateMilestoneStatus(milestone.id, 'Approved')}
                        className="inline-flex items-center gap-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateMilestoneStatus(milestone.id, 'Rejected')}
                        className="inline-flex items-center gap-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}

                  <label className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading === milestone.id ? 'Uploading...' : 'Upload File'}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(milestone.id, file);
                      }}
                    />
                  </label>

                  <input
                    type="url"
                    placeholder="Staging URL"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 w-48"
                    onBlur={(e) => {
                      if (e.target.value) {
                        supabase.from('milestones').update({ staging_url: e.target.value }).eq('id', milestone.id).then(() => fetchData());
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Invoices
          </h3>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-500">No invoices yet</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Invoice #</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Due Date</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                    <td className="px-4 py-3">${Number(invoice.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.status === 'Draft' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'Sent')}
                            className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-2 py-1 rounded transition-colors"
                          >
                            Send
                          </button>
                        )}
                        {invoice.status === 'Sent' && (
                          <>
                            <button
                              onClick={() => updateInvoiceStatus(invoice.id, 'Paid')}
                              className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-2 py-1 rounded transition-colors"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => updateInvoiceStatus(invoice.id, 'Overdue')}
                              className="text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 px-2 py-1 rounded transition-colors"
                            >
                              Mark Overdue
                            </button>
                          </>
                        )}
                        {invoice.status === 'Overdue' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'Paid')}
                            className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-2 py-1 rounded transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add Milestone</h3>
            <form onSubmit={addMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                <input
                  required
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create Invoice</h3>
            <form onSubmit={addInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Invoice Number</label>
                <input
                  required
                  value={invoiceForm.invoice_number}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Amount</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Active': 'bg-blue-400/10 text-blue-400',
    'Completed': 'bg-emerald-400/10 text-emerald-400',
    'On Hold': 'bg-slate-400/10 text-slate-400',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || 'bg-slate-400/10 text-slate-400'}`}>
      {status}
    </span>
  );
}

function MilestoneStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'In Progress': 'bg-blue-400/10 text-blue-400',
    'Ready for Review': 'bg-amber-400/10 text-amber-400',
    'Approved': 'bg-emerald-400/10 text-emerald-400',
    'Auto-Approved': 'bg-purple-400/10 text-purple-400',
    'Rejected': 'bg-red-400/10 text-red-400',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || 'bg-slate-400/10 text-slate-400'}`}>
      {status}
    </span>
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

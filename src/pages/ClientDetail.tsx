import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Client, type Project, type Milestone, type Invoice } from '../lib/supabase';
import { ArrowLeft, Plus, FolderKanban, Mail, Phone, MessageCircle, Copy, Check, Send, FileText } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [{ data: clientData }, { data: projectsData }, { data: milestonesData }, { data: invoicesData }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('projects').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('milestones').select('*, projects(client_id)').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*, projects(client_id)').order('created_at', { ascending: false }),
    ]);
    
    setClient(clientData);
    setProjects(projectsData || []);
    
    // Filter milestones and invoices for this client
    const clientMilestones = (milestonesData || []).filter((m: any) => m.projects?.client_id === id);
    const clientInvoices = (invoicesData || []).filter((i: any) => i.projects?.client_id === id);
    
    setMilestones(clientMilestones);
    setInvoices(clientInvoices);
    setLoading(false);
  }

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const { error } = await supabase.from('projects').insert([{ ...projectForm, client_id: id }]);
    if (!error) {
      setProjectForm({ name: '', description: '' });
      setShowProjectModal(false);
      fetchData();
    }
  }

  function copyPortalLink() {
    if (!client) return;
    const url = `${window.location.origin}/client/${client.portal_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeleteMilestone(milestoneId: string) {
    const { error } = await supabase.from('milestones').delete().eq('id', milestoneId);
    if (!error) {
      setMilestones(milestones.filter(m => m.id !== milestoneId));
    }
  }

  async function handleUpdateMilestone(milestone: Milestone) {
    const { error } = await supabase.from('milestones').update(milestone).eq('id', milestone.id);
    if (!error) {
      fetchData();
    }
  }

  function handleAddMilestone(status: string) {
    console.log('Add milestone with status:', status);
    // This would typically open a modal for creating a new milestone
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Client not found</p>
        <Link to="/clients" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clients" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">{client.name}</h2>
          <p className="text-slate-400 text-sm">Client Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="panel space-y-4">
            <h3 className="font-semibold">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              {client.whatsapp && (
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{client.whatsapp}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Client Portal</h4>
              <button
                onClick={copyPortalLink}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Portal Link
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-sm font-medium text-slate-400 mb-3">WhatsApp Template</h4>
              <button
                className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 text-emerald-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Status</h4>
              <StatusBadge status={client.status} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-400" />
                Projects
              </h3>
              <button
                onClick={() => setShowProjectModal(true)}
                className="btn-primary text-xs"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="panel text-center py-8">
                <p className="text-slate-500">No projects yet</p>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="panel hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{project.name}</h4>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <KanbanBoard
            milestones={milestones}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onAddMilestone={handleAddMilestone}
          />

          {invoices.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Invoice History
              </h3>
              <div className="panel">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left px-4 py-3 font-medium text-slate-400">Invoice #</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-400">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-400">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice: any) => (
                        <tr key={invoice.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-sm">{invoice.invoice_number}</td>
                          <td className="px-4 py-3 font-medium text-sm">${Number(invoice.amount).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <InvoiceStatusBadge status={invoice.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">New Project</h3>
            <form onSubmit={addProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                <input
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Active': 'bg-blue-400/10 text-blue-400',
    'Pending Payment': 'bg-amber-400/10 text-amber-400',
    'Overdue': 'bg-red-400/10 text-red-400',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || 'bg-slate-400/10 text-slate-400'}`}>
      {status}
    </span>
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

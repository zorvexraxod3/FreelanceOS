import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Clock, AlertTriangle, FileText, Link as LinkIcon, Check, X } from 'lucide-react';

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) fetchPortalData();
  }, [token]);

  async function fetchPortalData() {
    setLoading(true);
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('portal_token', token)
      .single();

    if (!clientData) {
      setError('Invalid portal link');
      setLoading(false);
      return;
    }

    setClient(clientData);

    const { data: projectsData } = await supabase
      .from('projects')
      .select('*, milestones(*), invoices(*)')
      .eq('client_id', clientData.id)
      .order('created_at', { ascending: false });

    setProjects(projectsData || []);
    setLoading(false);
  }

  async function approveMilestone(milestoneId: string) {
    const { error } = await supabase
      .from('milestones')
      .update({ status: 'Approved' })
      .eq('id', milestoneId);

    if (!error) {
      fetchPortalData();
    }
  }

  async function rejectMilestone(milestoneId: string) {
    const { error } = await supabase
      .from('milestones')
      .update({ status: 'Rejected' })
      .eq('id', milestoneId);

    if (!error) {
      fetchPortalData();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{error}</h2>
          <p className="text-slate-400">This portal link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">{client?.name}</h1>
          <p className="text-slate-400 text-sm">Client Portal</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No projects available yet.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{project.name}</h2>
                  {project.description && (
                    <p className="text-sm text-slate-400 mt-1">{project.description}</p>
                  )}
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>

              <div className="p-6 space-y-6">
                {/* Milestones */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Milestones
                  </h3>
                  {project.milestones?.length === 0 ? (
                    <p className="text-sm text-slate-500">No milestones yet</p>
                  ) : (
                    <div className="space-y-3">
                      {project.milestones.map((milestone: any) => (
                        <div key={milestone.id} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <h4 className="font-medium">{milestone.name}</h4>
                            <MilestoneStatusBadge status={milestone.status} />
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-slate-400 mb-2">{milestone.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            {milestone.staging_url && (
                              <a
                                href={milestone.staging_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                                View Staging
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
                                Download File
                              </a>
                            )}
                            {milestone.review_deadline && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Deadline: {new Date(milestone.review_deadline).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {milestone.status === 'Ready for Review' && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => approveMilestone(milestone.id)}
                                className="inline-flex items-center gap-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => rejectMilestone(milestone.id)}
                                className="inline-flex items-center gap-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoices */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Invoices
                  </h3>
                  {project.invoices?.length === 0 ? (
                    <p className="text-sm text-slate-500">No invoices yet</p>
                  ) : (
                    <div className="space-y-2">
                      {project.invoices.map((invoice: any) => (
                        <div key={invoice.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium">{invoice.invoice_number}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">${Number(invoice.amount).toLocaleString()}</span>
                            <InvoiceStatusBadge status={invoice.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
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

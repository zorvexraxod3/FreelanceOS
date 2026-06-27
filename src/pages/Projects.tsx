import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Project, type Client } from '../lib/supabase';
import { FolderKanban, Search, Plus, ArrowRight } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: clientsData } = await supabase.from('clients').select('*');

    const clientMap: Record<string, Client> = {};
    (clientsData || []).forEach((c: Client) => {
      clientMap[c.id] = c;
    });

    setProjects(projectsData || []);
    setClients(clientMap);
    setLoading(false);
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (clients[p.client_id]?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-slate-400">Manage all your projects and milestones</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search projects..."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-400/10 rounded-lg">
                  <FolderKanban className="w-5 h-5 text-blue-400" />
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
              <h3 className="font-medium mb-1">{project.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{clients[project.client_id]?.name || 'Unknown Client'}</p>
              {project.description && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{project.description}</p>
              )}
              <div className="flex items-center gap-1 text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                View Details
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
              <p className="text-slate-500">No projects found</p>
            </div>
          )}
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

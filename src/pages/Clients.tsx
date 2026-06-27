import { useEffect, useState } from 'react';
import { supabase, type Client } from '../lib/supabase';
import { Plus, Search, Copy, Check, Phone, Mail, MessageCircle, ExternalLink, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', whatsapp: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('clients').insert([form]);
    if (!error) {
      setForm({ name: '', email: '', phone: '', whatsapp: '' });
      setShowModal(false);
      fetchClients();
    }
  }

  function copyPortalLink(token: string, id: string) {
    const url = `${window.location.origin}/client/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clients</h2>
          <p className="text-slate-400">Manage your client relationships</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search clients..."
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
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Portal Link</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/clients/${client.id}`} className="font-medium hover:text-blue-400 transition-colors">
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-xs">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs">{client.phone}</span>
                          </div>
                        )}
                        {client.whatsapp && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-xs">{client.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyPortalLink(client.portal_token, client.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {copiedId === client.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === client.id ? null : client.id)}
                        className="inline-flex items-center justify-center p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                      {openDropdown === client.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
                          <Link
                            to={`/clients/${client.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors first:rounded-t-lg"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Details
                          </Link>
                          <button
                            onClick={() => {
                              copyPortalLink(client.portal_token, client.id);
                              setOpenDropdown(null);
                            }}
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Portal Link
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No clients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
            <form onSubmit={addClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">WhatsApp</label>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add Client
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

/*
# Create Freelance Management Dashboard Schema

1. New Tables
- `clients`: Stores client information with unique portal links
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `email` (text, not null)
  - `phone` (text)
  - `whatsapp` (text)
  - `status` (text, default 'Active') — Active, Pending Payment, Overdue
  - `portal_token` (text, unique, not null) — unique shareable client portal token
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `projects`: Stores projects linked to clients
  - `id` (uuid, primary key)
  - `client_id` (uuid, references clients)
  - `name` (text, not null)
  - `description` (text)
  - `status` (text, default 'Active') — Active, Completed, On Hold
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `milestones`: Stores project milestones with review workflow
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `name` (text, not null)
  - `description` (text)
  - `status` (text, default 'In Progress') — In Progress, Ready for Review, Approved, Auto-Approved, Rejected
  - `staging_url` (text)
  - `file_url` (text)
  - `review_deadline` (timestamptz)
  - `auto_approved_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `invoices`: Stores invoices linked to projects
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `invoice_number` (text, unique, not null)
  - `amount` (numeric, not null)
  - `status` (text, default 'Draft') — Draft, Sent, Paid, Overdue
  - `sent_at` (timestamptz)
  - `paid_at` (timestamptz)
  - `due_date` (timestamptz)
  - `last_reminder_sent_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Single-tenant app: allow anon + authenticated CRUD on all tables.
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  whatsapp text,
  status text NOT NULL DEFAULT 'Active',
  portal_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'In Progress',
  staging_url text,
  file_url text,
  review_deadline timestamptz,
  auto_approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'Draft',
  sent_at timestamptz,
  paid_at timestamptz,
  due_date timestamptz,
  last_reminder_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Clients policies
DROP POLICY IF EXISTS "anon_select_clients" ON clients;
CREATE POLICY "anon_select_clients" ON clients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE TO anon, authenticated USING (true);

-- Projects policies
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE TO anon, authenticated USING (true);

-- Milestones policies
DROP POLICY IF EXISTS "anon_select_milestones" ON milestones;
CREATE POLICY "anon_select_milestones" ON milestones FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_milestones" ON milestones;
CREATE POLICY "anon_insert_milestones" ON milestones FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_milestones" ON milestones;
CREATE POLICY "anon_update_milestones" ON milestones FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_milestones" ON milestones;
CREATE POLICY "anon_delete_milestones" ON milestones FOR DELETE TO anon, authenticated USING (true);

-- Invoices policies
DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

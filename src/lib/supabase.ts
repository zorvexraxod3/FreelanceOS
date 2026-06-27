import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  portal_token: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
  staging_url: string | null;
  file_url: string | null;
  review_deadline: string | null;
  auto_approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  project_id: string;
  invoice_number: string;
  amount: number;
  status: string;
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  last_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

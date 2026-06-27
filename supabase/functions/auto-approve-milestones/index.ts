import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // Find milestones that are "Ready for Review" and have passed their deadline
    const { data: overdueMilestones, error } = await supabase
      .from("milestones")
      .select("id, name, review_deadline, projects(client_id, clients(email, name))")
      .eq("status", "Ready for Review")
      .lt("review_deadline", now);

    if (error) throw error;

    const updated: string[] = [];
    for (const milestone of overdueMilestones || []) {
      const { error: updateError } = await supabase
        .from("milestones")
        .update({ status: "Auto-Approved", auto_approved_at: now })
        .eq("id", milestone.id);

      if (!updateError) {
        updated.push(milestone.id);
        // Log auto-approval email
        const client = (milestone.projects as any)?.clients;
        if (client?.email) {
          console.log(`[AUTO-APPROVE EMAIL] To: ${client.email}`);
          console.log(`[AUTO-APPROVE EMAIL] Subject: Milestone Auto-Approved: ${milestone.name}`);
          console.log(`[AUTO-APPROVE EMAIL] Body: Hi ${client.name}, the milestone "${milestone.name}" has been auto-approved as the 48-hour review deadline has passed.`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated: updated.length, ids: updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

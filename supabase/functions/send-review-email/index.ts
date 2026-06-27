import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { clientEmail, clientName, milestoneId, projectName, milestoneName } = await req.json();

    if (!clientEmail || !milestoneId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In a real app, integrate with an email service like SendGrid, Resend, or AWS SES.
    // For now, we log the email that would be sent.
    const reviewUrl = `${req.headers.get("origin") || "http://localhost:5173"}/client/${clientEmail}`;
    
    console.log(`[EMAIL] To: ${clientEmail}`);
    console.log(`[EMAIL] Subject: Milestone Ready for Review: ${milestoneName}`);
    console.log(`[EMAIL] Body: Hi ${clientName}, the milestone "${milestoneName}" in project "${projectName}" is ready for review. Please visit your client portal to approve or reject. Review deadline: 48 hours.`);

    return new Response(
      JSON.stringify({ success: true, message: "Review email queued" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Find all pending invoices where due_date < today
    const { data: overdueInvoices, error: fetchError } = await supabase
      .from("invoices")
      .select("id, due_date, invoice_number")
      .eq("status", "pending")
      .lt("due_date", today);

    if (fetchError) {
      throw new Error(`Error fetching invoices: ${fetchError.message}`);
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(
        JSON.stringify({ message: "No overdue invoices found", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = overdueInvoices.map((inv) => inv.id);

    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "overdue" })
      .in("id", ids);

    if (updateError) {
      throw new Error(`Error updating invoices: ${updateError.message}`);
    }

    console.log(`Marked ${ids.length} invoice(s) as overdue`);

    return new Response(
      JSON.stringify({
        message: `Marked ${ids.length} invoice(s) as overdue`,
        updated: ids.length,
        invoice_ids: ids,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

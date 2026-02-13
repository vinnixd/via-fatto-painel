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

    // Get all active subscriptions with their plan details
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("id, plan_id, billing_day, billing_cycle, status, plan:subscription_plans(monthly_price, annual_price, name)")
      .in("status", ["active", "trial"]);

    if (subError) {
      throw new Error(`Error fetching subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active subscriptions found", generated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    let generated = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        const billingDay = sub.billing_day || 18;
        const plan = sub.plan as any;

        if (!plan) {
          errors.push(`Subscription ${sub.id}: no plan linked`);
          continue;
        }

        // Calculate amount based on billing cycle
        const amount = sub.billing_cycle === "annual"
          ? Number(plan.annual_price) / 12
          : Number(plan.monthly_price);

        // Build due_date for current month
        const dueDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(billingDay).padStart(2, "0")}`;

        // Generate invoice number: FAT-YYYY-MM
        const invoiceNumber = `FAT-${currentYear}-${String(currentMonth).padStart(2, "0")}`;

        // Check if invoice already exists for this subscription + month
        const { data: existing } = await supabase
          .from("invoices")
          .select("id")
          .eq("subscription_id", sub.id)
          .eq("invoice_number", invoiceNumber)
          .maybeSingle();

        if (existing) {
          continue; // Already generated
        }

        // Create the invoice
        const { error: insertError } = await supabase
          .from("invoices")
          .insert({
            subscription_id: sub.id,
            amount,
            due_date: dueDate,
            status: "pending",
            invoice_number: invoiceNumber,
          });

        if (insertError) {
          errors.push(`Subscription ${sub.id}: ${insertError.message}`);
        } else {
          generated++;
          console.log(`Generated invoice ${invoiceNumber} for subscription ${sub.id}`);
        }
      } catch (e) {
        errors.push(`Subscription ${sub.id}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Invoice generation complete`,
        generated,
        total_subscriptions: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
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

import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  var body = await req.text();
  var sig = req.headers.get("stripe-signature");

  var event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    var session = event.data.object;
    var userId = session.metadata.user_id;

    if (userId) {
      var supabase = createServerClient();

      // Marquer l'utilisateur comme paye
      await supabase
        .from("profiles")
        .update({ paid: true, stripe_customer_id: session.customer })
        .eq("id", userId);

      // Logger le paiement
      await supabase.from("payments").insert({
        user_id: userId,
        stripe_session_id: session.id,
        amount: session.amount_total,
        status: "completed",
      });
    }
  }

  return NextResponse.json({ received: true });
}


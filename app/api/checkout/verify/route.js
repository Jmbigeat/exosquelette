import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET(req) {
  var url = new URL(req.url);
  var sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id requis" }, { status: 400 });
  }

  try {
    var session = await stripe.checkout.sessions.retrieve(sessionId);
    var paid = session.payment_status === "paid";
    var email = session.customer_email || (session.customer_details ? session.customer_details.email : null);
    var type = session.metadata ? session.metadata.type || "sprint" : "sprint";

    return NextResponse.json({ paid: paid, email: email, type: type });
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }
}

import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    var body = await req.json();
    var userId = body.userId;
    var email = body.email;

    if (!userId || !email) {
      return NextResponse.json({ error: "Utilisateur requis" }, { status: 400 });
    }

    var session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: process.env.NEXT_PUBLIC_APP_URL + "/sprint?paid=true",
      cancel_url: process.env.NEXT_PUBLIC_APP_URL + "/sprint?paid=false",
      metadata: {
        user_id: userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Erreur Stripe" }, { status: 500 });
  }
}

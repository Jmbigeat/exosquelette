import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

var CHECKOUT_CONFIGS = {
  sprint: {
    priceEnvKey: "STRIPE_PRICE_ID",
    mode: "payment",
    successPath: "/onboarding",
    cancelPath: "/paywall?cancelled=true",
  },
  subscription: {
    priceEnvKey: "STRIPE_PRICE_SUBSCRIPTION_ID",
    mode: "subscription",
    successPath: "/sprint?subscribed=true",
    cancelPath: "/sprint?sub_cancelled=true",
  },
};

export async function POST(req) {
  try {
    var body = await req.json();
    var userId = body.userId;
    var email = body.email;
    var type = body.type || "sprint";

    if (!userId || !email) {
      return NextResponse.json({ error: "Utilisateur requis" }, { status: 400 });
    }

    var config = CHECKOUT_CONFIGS[type];
    if (!config) {
      return NextResponse.json({ error: "Type de produit invalide" }, { status: 400 });
    }

    var priceId = process.env[config.priceEnvKey];
    if (!priceId) {
      priceId = process.env.STRIPE_PRICE_ID;
    }

    var successUrl = process.env.NEXT_PUBLIC_APP_URL + config.successPath;
    // Ajouter session_id en query param (séparateur ? ou & selon le path)
    if (successUrl.indexOf("?") !== -1) {
      successUrl += "&session_id={CHECKOUT_SESSION_ID}";
    } else {
      successUrl += "?session_id={CHECKOUT_SESSION_ID}";
    }

    var session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: config.mode,
      success_url: successUrl,
      cancel_url: process.env.NEXT_PUBLIC_APP_URL + config.cancelPath,
      metadata: {
        user_id: userId,
        type: type,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Erreur Stripe" }, { status: 500 });
  }
}

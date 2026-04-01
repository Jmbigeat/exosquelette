import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

var rateLimit = new Map();
var WINDOW = 15 * 60 * 1000; // 15 minutes
var MAX = 5; // 5 tentatives par IP

function checkRateLimit(ip) {
  var now = Date.now();
  for (var [key] of rateLimit) {
    if (now - rateLimit.get(key).start > WINDOW) rateLimit.delete(key);
  }
  var record = rateLimit.get(ip);
  if (!record || now - record.start > WINDOW) {
    rateLimit.set(ip, { count: 1, start: now });
    return false;
  }
  record.count++;
  return record.count > MAX;
}

var checkoutSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  type: z.enum(["sprint", "subscription"]).optional(),
});

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
  var ip = req.headers.get("x-forwarded-for") || "unknown";
  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 },
    );
  }

  try {
    var body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Requête invalide." },
        { status: 400 },
      );
    }

    var parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides." },
        { status: 400 },
      );
    }
    var userId = parsed.data.userId;
    var email = parsed.data.email;
    var type = parsed.data.type || "sprint";

    var config = CHECKOUT_CONFIGS[type];
    if (!config) {
      return NextResponse.json(
        { error: "Type de produit invalide" },
        { status: 400 },
      );
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

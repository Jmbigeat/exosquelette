import { createServerClient } from "@/lib/supabase";
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

var registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req) {
  var ip = req.headers.get("x-forwarded-for") || "unknown";
  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 },
    );
  }

  var body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  var parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email ou mot de passe invalide." },
      { status: 400 },
    );
  }
  var email = parsed.data.email;
  var password = parsed.data.password;

  var supabase = createServerClient();

  // Créer le user via admin API (confirmé immédiatement, pas de mail de vérification)
  var result = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  });

  if (result.error) {
    // Supabase renvoie "already registered" si le compte existe
    if (
      result.error.message &&
      result.error.message.toLowerCase().indexOf("already") !== -1
    ) {
      return NextResponse.json({ error: "exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Inscription impossible. Réessayez ou contactez le support." },
      { status: 400 },
    );
  }

  // Le trigger handle_new_user() dans schema.sql crée automatiquement la row profiles
  return NextResponse.json({ userId: result.data.user.id, email: email });
}

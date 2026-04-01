import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  var body = await req.json();
  var email = body.email;
  var password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Mot de passe : 8 caractères minimum" }, { status: 400 });
  }

  var supabase = createServerClient();

  // Créer le user via admin API (confirmé immédiatement, pas de mail de vérification)
  var result = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  });

  if (result.error) {
    // Supabase renvoie "already registered" si le compte existe
    if (result.error.message && result.error.message.toLowerCase().indexOf("already") !== -1) {
      return NextResponse.json({ error: "exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Inscription impossible. Réessayez ou contactez le support." }, { status: 400 });
  }

  // Le trigger handle_new_user() dans schema.sql crée automatiquement la row profiles
  return NextResponse.json({ userId: result.data.user.id, email: email });
}

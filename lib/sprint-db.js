import { createBrowserClient } from "./supabase";

var supabase = null;
function getClient() {
  if (!supabase) supabase = createBrowserClient();
  return supabase;
}

// Charge le sprint le plus recent de l'utilisateur
export async function loadSprint(userId) {
  var client = getClient();
  var res = await client
    .from("sprints")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (res.error || !res.data) return null;
  return res.data;
}

// Sauvegarde l'etat du sprint (cree ou met a jour)
export async function saveSprint(userId, sprintId, state) {
  var client = getClient();

  if (sprintId) {
    var res = await client
      .from("sprints")
      .update({ state: state, updated_at: new Date().toISOString() })
      .eq("id", sprintId)
      .eq("user_id", userId);
    return res;
  }

  var res = await client
    .from("sprints")
    .insert({ user_id: userId, state: state })
    .select()
    .single();
  return res;
}

// Verifie si l'utilisateur a paye
export async function checkPaid(userId) {
  var client = getClient();
  var res = await client
    .from("profiles")
    .select("paid")
    .eq("id", userId)
    .single();
  return res.data && res.data.paid;
}

/**
 * Brew Supabase utilities — CRUD for brew_weeks and brew_instructions.
 * @module lib/brew-db
 */

import { createBrowserClient } from "./supabase";

var supabase = null;
function getClient() {
  if (!supabase) supabase = createBrowserClient();
  return supabase;
}

/**
 * Load all brew_weeks for a user, ordered by week_start DESC.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function loadBrewWeeks(userId) {
  var client = getClient();
  var res = await client
    .from("brew_weeks")
    .select("*")
    .eq("user_id", userId)
    .order("week_start", { ascending: false });
  if (res.error || !res.data) return [];
  return res.data;
}

/**
 * Save a week declaration — upserts one row per pillar.
 * @param {string} userId
 * @param {string} weekStart - ISO date string (Monday)
 * @param {Array<object>} pillarRows - array of { pillar_id, published, reactions_rh, reactions_n1, reactions_peers, reactions_other, signal_text }
 * @returns {Promise<object>}
 */
export async function saveBrewWeek(userId, weekStart, pillarRows) {
  var client = getClient();
  var rows = pillarRows.map(function(p) {
    return {
      user_id: userId,
      week_start: weekStart,
      pillar_id: p.pillar_id,
      published: p.published || false,
      reactions_rh: p.reactions_rh || 0,
      reactions_n1: p.reactions_n1 || 0,
      reactions_peers: p.reactions_peers || 0,
      reactions_other: p.reactions_other || 0,
      signal_text: p.signal_text || null,
    };
  });
  var res = await client
    .from("brew_weeks")
    .upsert(rows, { onConflict: "user_id,week_start,pillar_id" });
  return res;
}

/**
 * Load pending brew_instructions for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function loadBrewInstructions(userId) {
  var client = getClient();
  var res = await client
    .from("brew_instructions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (res.error || !res.data) return [];
  return res.data;
}

/**
 * Insert a new brew instruction (regeneration request).
 * @param {string} userId
 * @param {number} pillarId
 * @param {number} targetDiltsLevel
 * @returns {Promise<object>}
 */
export async function createBrewInstruction(userId, pillarId, targetDiltsLevel) {
  var client = getClient();
  var res = await client
    .from("brew_instructions")
    .insert({ user_id: userId, pillar_id: pillarId, target_dilts_level: targetDiltsLevel });
  return res;
}

/**
 * Mark a brew instruction as done.
 * @param {string} instructionId
 * @returns {Promise<object>}
 */
export async function markInstructionDone(instructionId) {
  var client = getClient();
  var res = await client
    .from("brew_instructions")
    .update({ status: "done" })
    .eq("id", instructionId);
  return res;
}

/**
 * Check if current week is already declared for a user.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isWeekDeclared(userId) {
  var client = getClient();
  var weekStart = getMonday(new Date());
  var res = await client
    .from("brew_weeks")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .limit(1);
  return res.data && res.data.length > 0;
}

/**
 * Increment dms_generated counter for a pillar this week.
 * @param {string} userId
 * @param {string} weekStart
 * @param {number} pillarId
 * @returns {Promise<object>}
 */
export async function incrementDmsGenerated(userId, weekStart, pillarId) {
  var client = getClient();
  // First get current value
  var res = await client
    .from("brew_weeks")
    .select("dms_generated")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .eq("pillar_id", pillarId)
    .single();
  var current = (res.data && res.data.dms_generated) || 0;
  return client
    .from("brew_weeks")
    .update({ dms_generated: current + 1 })
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .eq("pillar_id", pillarId);
}

/**
 * Get Monday of a given date's week (ISO week start).
 * @param {Date} date
 * @returns {string} ISO date string YYYY-MM-DD
 */
export function getMonday(date) {
  var d = new Date(date);
  var day = d.getDay();
  var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

"use client";
import { useEffect, useRef } from "react";
import { CURRENT_VERSION } from "@/lib/sprint/migrations";

/**
 * Handles state persistence: immediate localStorage write + debounced onStateChange callback.
 * Extracted from Sprint.jsx — the persist useEffect that serializes all state to localStorage
 * and notifies the parent (page.js) for Supabase save.
 *
 * @param {object} stateSnapshot - object with all persisted state fields
 * @param {function|null} onStateChange - callback from page.js (Supabase save with retry)
 */
export function usePersistence(stateSnapshot, onStateChange) {
  var persistRef = useRef(null);

  useEffect(function() {
    var stateObj = Object.assign({}, stateSnapshot, {
      _version: CURRENT_VERSION,
      _savedAt: Date.now(),
    });
    // Immediate localStorage save (no debounce)
    try { localStorage.setItem("sprint_state", JSON.stringify(stateObj)); } catch (e) {}
    if (!onStateChange) return;
    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(function() {
      onStateChange(stateObj);
    }, 500);
  }, [
    stateSnapshot.screen, stateSnapshot.activeStep, stateSnapshot.bricks,
    stateSnapshot.vault, stateSnapshot.sprintDone, stateSnapshot.nextId,
    stateSnapshot.duelResults, stateSnapshot.targetRoleId, stateSnapshot.nightmareCosts,
    stateSnapshot.takes, stateSnapshot.parsedOffers, stateSnapshot.offersArray,
    stateSnapshot.offerNextId, stateSnapshot.aiPillarRecs, stateSnapshot.signature,
    stateSnapshot.pieces,
  ]);
}

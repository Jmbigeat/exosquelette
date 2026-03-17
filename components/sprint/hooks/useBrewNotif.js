"use client";
import { useState, useEffect } from "react";
import { isWeekDeclared, loadBrewInstructions } from "@/lib/brew-db";
import { computeDensityScore, getActiveCauchemars } from "@/lib/sprint/scoring";

/**
 * Fetches Brew notification state (week declared, pending instructions).
 * Only runs when density >= 70 and user is subscribed.
 *
 * @param {object} user - authenticated user ({ id, email })
 * @param {object} params - { bricks, vault, signature, duelResults, isSubscribed }
 * @returns {{ brewNotif: { weekMissing: boolean, instructions: Array }, setBrewNotif: function }}
 */
export function useBrewNotif(user, params) {
  var brewNotifState = useState({ weekMissing: false, instructions: [] });
  var brewNotif = brewNotifState[0];
  var setBrewNotif = brewNotifState[1];

  useEffect(
    function () {
      if (!user || user.id === "dev") return;
      var densityScore = computeDensityScore({
        bricks: params.bricks,
        nightmares: getActiveCauchemars(),
        pillars: params.vault,
        signature: params.signature,
        duelResults: params.duelResults,
        cvBricks: [],
      });
      if (densityScore.score < 70 || !params.isSubscribed) return;
      Promise.all([isWeekDeclared(user.id), loadBrewInstructions(user.id)])
        .then(function (results) {
          setBrewNotif({ weekMissing: !results[0], instructions: results[1] || [] });
        })
        .catch(function () {});
    },
    [user, params.isSubscribed]
  );

  return { brewNotif: brewNotif, setBrewNotif: setBrewNotif };
}

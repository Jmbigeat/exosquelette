"use client";
import { useState, useEffect, useRef } from "react";
import {
  parseOfferSignals,
  parseInternalSignals,
  buildActiveCauchemars,
  mergeOfferSignals,
  checkOfferCoherence,
  aggregateOfferSignals,
} from "@/lib/sprint/offers";
import { setActiveCauchemarsGlobal } from "@/lib/sprint/scoring";

/**
 * Manages dynamic offers: parsing, adding, removing, obsolete tracking.
 * Reads eclaireur_data from sessionStorage on mount.
 * Synchronously sets global cauchemars before first render.
 *
 * @param {object} initialState - persisted state (from page.js)
 * @param {string|null} targetRoleId - target role ID
 * @returns {{ parsedOffers, setParsedOffers, offersArray, setOffersArray, offerNextId, setOfferNextId, obsoleteDeliverables, setObsoleteDeliverables, offerCoherence, handleAddOffer, handleRemoveOffer, recalcOffersSignals, markDeliverablesObsolete }}
 */
export function useOffers(initialState, targetRoleId) {
  var roleRef = useRef(targetRoleId);
  roleRef.current = targetRoleId;

  var parsedOffersState = useState(initialState && initialState.parsedOffers ? initialState.parsedOffers : null);
  var parsedOffers = parsedOffersState[0];
  var setParsedOffers = parsedOffersState[1];

  var offersArrayState = useState(initialState && initialState.offersArray ? initialState.offersArray : []);
  var offersArray = offersArrayState[0];
  var setOffersArray = offersArrayState[1];

  var offerNextIdState = useState(initialState && initialState.offerNextId ? initialState.offerNextId : 1);
  var offerNextId = offerNextIdState[0];
  var setOfferNextId = offerNextIdState[1];

  var obsoleteState = useState({});
  var obsoleteDeliverables = obsoleteState[0];
  var setObsoleteDeliverables = obsoleteState[1];

  // Synchronous init: set cauchemars BEFORE first render so getActiveCauchemars() is correct
  if (targetRoleId) {
    setActiveCauchemarsGlobal(buildActiveCauchemars(parsedOffers, targetRoleId));
  }

  var offerCoherence = checkOfferCoherence(offersArray);

  function recalcOffersSignals(updatedOffers) {
    var rid = roleRef.current;
    var merged = mergeOfferSignals(updatedOffers, rid);
    setParsedOffers(merged);
    if (rid) {
      setActiveCauchemarsGlobal(buildActiveCauchemars(merged, rid));
    }
  }

  function markDeliverablesObsolete() {
    var types = [
      "cv",
      "bio",
      "dm",
      "email",
      "plan30j",
      "posts",
      "questions",
      "interview_prep",
      "report",
      "argument",
      "plan90j",
    ];
    var obs = {};
    types.forEach(function (t) {
      obs[t] = true;
    });
    setObsoleteDeliverables(obs);
  }

  function handleAddOffer(text, type) {
    var rid = roleRef.current;
    var offerType = type || "external";
    var signals = offerType === "internal" ? parseInternalSignals(text, rid) : parseOfferSignals(text, rid);
    var newOffer = {
      id: offerNextId,
      text: text,
      parsedSignals: signals,
      type: offerType,
      addedAt: new Date().toISOString(),
    };
    var updated = offersArray.concat([newOffer]);
    setOffersArray(updated);
    setOfferNextId(offerNextId + 1);
    recalcOffersSignals(updated);
    markDeliverablesObsolete();
  }

  function handleRemoveOffer(offerId) {
    var updated = offersArray.filter(function (o) {
      return o.id !== offerId;
    });
    setOffersArray(updated);
    recalcOffersSignals(updated);
    markDeliverablesObsolete();
  }

  // Inject Éclaireur data (offer + CV) if available — one-time consumption
  var eclaireurConsumedRef = useRef(false);
  useEffect(
    function () {
      if (eclaireurConsumedRef.current) return;
      try {
        var raw = sessionStorage.getItem("eclaireur_data");
        if (!raw) return;
        var parsed = JSON.parse(raw);
        eclaireurConsumedRef.current = true;
        sessionStorage.removeItem("eclaireur_data");

        if (parsed.offerText && parsed.offerText.length > 20 && offersArray.length === 0) {
          var signals = parseOfferSignals(parsed.offerText, roleRef.current);
          var newOffer = {
            id: offerNextId,
            text: parsed.offerText,
            parsedSignals: signals,
            type: "external",
            addedAt: new Date().toISOString(),
            source: "eclaireur",
          };
          var updated = [newOffer];
          setOffersArray(updated);
          setOfferNextId(offerNextId + 1);
          recalcOffersSignals(updated);
        }
      } catch (e) {}
    },
    [targetRoleId]
  );

  // Set global active cauchemars whenever role changes
  useEffect(
    function () {
      if (targetRoleId) {
        var merged = aggregateOfferSignals(offersArray, targetRoleId);
        setActiveCauchemarsGlobal(buildActiveCauchemars(merged, targetRoleId));
      }
    },
    [targetRoleId]
  );

  return {
    parsedOffers: parsedOffers,
    setParsedOffers: setParsedOffers,
    offersArray: offersArray,
    setOffersArray: setOffersArray,
    offerNextId: offerNextId,
    setOfferNextId: setOfferNextId,
    obsoleteDeliverables: obsoleteDeliverables,
    setObsoleteDeliverables: setObsoleteDeliverables,
    offerCoherence: offerCoherence,
    handleAddOffer: handleAddOffer,
    handleRemoveOffer: handleRemoveOffer,
    recalcOffersSignals: recalcOffersSignals,
    markDeliverablesObsolete: markDeliverablesObsolete,
  };
}

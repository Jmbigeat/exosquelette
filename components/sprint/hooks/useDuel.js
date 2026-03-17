"use client";
import { useState, useRef } from "react";
import { DUEL_QUESTIONS } from "@/lib/sprint/references";
import { assessBrickArmor } from "@/lib/sprint/scoring";

/**
 * Manages Duel (stress test) lifecycle.
 * Builds questions from bricks × ATMT templates, handles completion and redo.
 *
 * @param {Array} bricks - all bricks
 * @param {function} setBricks - setter from useBricks (to flag duelTested)
 * @param {string|null} targetRoleId - target role
 * @returns {{ duelResults, setDuelResults, duelQRef, buildDuelQuestions, handleDuelComplete, handleDuelRedo }}
 */
export function useDuel(bricks, setBricks, targetRoleId) {
  var duelState = useState([]);
  var duelResults = duelState[0];
  var setDuelResults = duelState[1];

  var duelQRef = useRef(null);

  // Refs to avoid stale closures
  var bricksRef = useRef(bricks);
  bricksRef.current = bricks;

  /**
   * buildDuelQuestions — Chantier 5
   * Fusionne questions classiques (DUEL_QUESTIONS) + questions dérivées des briques.
   * Shuffle l'ensemble. Retourne au format attendu par Duel.jsx.
   */
  function buildDuelQuestions(classicQuestions, allBricks, roleId) {
    var validated = allBricks.filter(function (b) {
      return b.status === "validated" && b.type === "brick";
    });
    var strong = validated.filter(function (b) {
      var armor = assessBrickArmor(b);
      return armor.status === "armored" || armor.status === "credible";
    });

    function snippet(b) {
      var t = b.text || "";
      return t.length > 60 ? t.slice(0, 60) + "..." : t;
    }

    var attackTemplates = [
      {
        intent: "Reproductibilité",
        make: function (b) {
          return (
            'Vous dites : "' +
            snippet(b) +
            "\". C'est dans un contexte précis. Qu'est-ce qui garantit que ça marche ici ?"
          );
        },
        danger:
          "Si tu ne peux pas séparer le contexte de la méthode, ta brique est contextuelle. Le recruteur lit : chanceux, pas compétent.",
        idealAngle: "Sépare le spécifique du transférable. Nomme la méthode, pas seulement le résultat.",
      },
      {
        intent: "Attribution",
        make: function (b) {
          return '"' + snippet(b) + "\" — c'est ton travail ou celui de l'équipe ?";
        },
        danger: "Si tu dis 'c'était collectif' sans nuancer, le recruteur ne sait plus quel est ton impact individuel.",
        idealAngle:
          "Nomme ta contribution spécifique. 'L'équipe exécutait, j'ai structuré le framework et arbitré les priorités.'",
      },
      {
        intent: "Résistance au doute",
        make: function (b) {
          return '"' + snippet(b) + "\" — le recruteur dit : 'J'ai du mal à y croire. Prouvez-le.'";
        },
        danger: "Si tu te justifies avec des mots, tu perds. Les données parlent.",
        idealAngle: "Réponds avec le chiffre, la période, et la méthode. Pas d'émotion. Des faits.",
      },
      {
        intent: "Obsolescence",
        make: function (b) {
          return '"' + snippet(b) + "\" — c'était il y a combien de temps ? Le marché a changé depuis, non ?";
        },
        danger: "Si tu ne montres pas que ta compétence est à jour, le recruteur classe : profil passé.",
        idealAngle:
          "Montre que le principe est intemporel même si le contexte change. 'La méthode s'applique quel que soit le cycle.'",
      },
    ];

    var personalQuestions = [];
    strong.forEach(function (b, i) {
      if (i >= 4) return;
      var tpl = attackTemplates[i % attackTemplates.length];
      personalQuestions.push({
        id: 100 + i,
        question: tpl.make(b),
        intent: tpl.intent,
        brickRef: "brick_" + b.id,
        danger: tpl.danger,
        idealAngle: tpl.idealAngle,
      });
    });

    var all = classicQuestions.concat(personalQuestions);
    // Fisher-Yates shuffle
    for (var i = all.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = all[i];
      all[i] = all[j];
      all[j] = temp;
    }
    return all;
  }

  /**
   * handleDuelComplete — Chantier 5
   * Stocke le résultat du Duel, flag les briques mobilisées.
   * Ne met PAS sprintDone à true pour permettre le recommencement.
   */
  function handleDuelComplete(results) {
    setDuelResults(results);
    // Flag mobilized bricks
    var answeredRefs = results
      .filter(function (r) {
        return r.answer;
      })
      .map(function (r) {
        return r.brickRef;
      });
    setBricks(function (prev) {
      return prev.map(function (b) {
        if (b.status !== "validated" || b.type !== "brick") return b;
        // Direct match for generated questions (brickRef = "brick_" + id)
        var directMatch = answeredRefs.some(function (ref) {
          return ref === "brick_" + b.id;
        });
        // Text match: check if any answer contains keywords from the brick
        var textMatch = false;
        if (!directMatch && b.text) {
          var brickWords = b.text
            .toLowerCase()
            .split(/\s+/)
            .filter(function (w) {
              return w.length > 4;
            });
          results.forEach(function (r) {
            if (r.answer) {
              var aLower = r.answer.toLowerCase();
              var matches = brickWords.filter(function (w) {
                return aLower.indexOf(w) !== -1;
              });
              if (matches.length >= 2) textMatch = true;
            }
          });
        }
        if (directMatch || textMatch) return Object.assign({}, b, { duelTested: true });
        return b;
      });
    });
  }

  function handleDuelRedo() {
    setDuelResults([]);
    duelQRef.current = null;
  }

  return {
    duelResults: duelResults,
    setDuelResults: setDuelResults,
    duelQRef: duelQRef,
    buildDuelQuestions: buildDuelQuestions,
    handleDuelComplete: handleDuelComplete,
    handleDuelRedo: handleDuelRedo,
  };
}

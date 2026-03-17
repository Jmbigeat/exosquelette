/* ==============================
   FILTRE RÉDACTIONNEL — appliqué à tout texte généré
   Règles : voix active, pas de remplissage, pas de métronome,
   pas de règle de trois, pas de méta-commentaire, vocabulaire banni.
   ============================== */

export var REDAC_BANNIS = [
  { from: /\bapprofondir\b/gi, to: "creuser" },
  { from: /\bfavoriser\b/gi, to: "servir" },
  { from: /\bfavorise\b/gi, to: "sert" },
  {
    from: /\bcomplexes\b/gi,
    to: function (m, offset, str) {
      var before = str.slice(Math.max(0, offset - 20), offset).toLowerCase();
      if (
        /\b(des|les|ces|quelles|approches|situations|tâches|phases|périodes|structures|compétences|équipes)\s*$/.test(
          before
        )
      )
        return "dures";
      return "durs";
    },
  },
  {
    from: /\bcomplexe\b/gi,
    to: function (m, offset, str) {
      var before = str.slice(Math.max(0, offset - 15), offset).toLowerCase();
      if (/\b(une|la|cette|quelle|approche|situation|tâche|phase|période|structure)\s*$/.test(before)) return "dure";
      return "dur";
    },
  },
  { from: /\bmettre en lumière\b/gi, to: "montrer" },
  { from: /\bmis en lumière\b/gi, to: "montré" },
  { from: /\bpourrait offrir\b/gi, to: "donne" },
  { from: /\bpourraient offrir\b/gi, to: "donnent" },
  { from: /\bil est important de noter que\b/gi, to: "" },
  { from: /\bil convient de souligner que\b/gi, to: "" },
  { from: /\ben conclusion\b/gi, to: "" },
  { from: /\bde plus,\b/gi, to: "" },
  { from: /\bcependant\b/gi, to: "mais" },
  { from: /\btoutefois\b/gi, to: "mais" },
  { from: /\bnéanmoins\b/gi, to: "mais" },
  { from: /\bdans cette section nous allons\b/gi, to: "" },
  { from: /\bafin de\b/gi, to: "pour" },
  { from: /\bdans le but de\b/gi, to: "pour" },
  { from: /\ben ce qui concerne\b/gi, to: "sur" },
  { from: /\bau niveau de\b/gi, to: "sur" },
  { from: /\bvéritablement\b/gi, to: "" },
  { from: /\blittéralement\b/gi, to: "" },
  { from: /\bvraiment\b/gi, to: "" },
  { from: /\btrès\b/gi, to: "" },
  { from: /\bgame[ -]?changer\b/gi, to: "" },
  { from: /\bdisruptif(s|ve|ves)?\b/gi, to: "" },
  { from: /\brévolutionner\b/gi, to: "changer" },
  { from: /\brévolutionne\b/gi, to: "change" },
  { from: /\btu pourrais\b/gi, to: "tu peux" },
  { from: /\bon pourrait\b/gi, to: "on peut" },
  { from: /\bil pourrait\b/gi, to: "il peut" },
  { from: /\belle pourrait\b/gi, to: "elle peut" },
  { from: /\btu devrais\b/gi, to: "tu dois" },
  { from: /\bon devrait\b/gi, to: "on doit" },
  { from: /\bil faudrait\b/gi, to: "il faut" },
  { from: /\bil semble(rait)? que\b/gi, to: "" },
  { from: /\bcela semble(rait)?\b/gi, to: "c'est" },
  { from: /\bça semble(rait)?\b/gi, to: "c'est" },
  { from: /\bplonger dans\b/gi, to: "entrer dans" },
  { from: /\bplongeons dans\b/gi, to: "entrons dans" },
  { from: /\bembarquer\b/gi, to: "commencer" },
  { from: /\bembarquons\b/gi, to: "commençons" },
  { from: /\btapisserie\b/gi, to: "" },
  { from: /\bpaysage\b/gi, to: "terrain" },
  { from: /\broyaume\b/gi, to: "domaine" },
  { from: /\bimaginez que\b/gi, to: "" },
  { from: /\bimaginez un(e)?\b/gi, to: "Prenons un$1" },
  { from: /\bon peut imaginer\b/gi, to: "" },
  { from: /\bon peut espérer\b/gi, to: "on attend" },
  { from: /\bespérons que\b/gi, to: "" },
  { from: /\bil faut espérer\b/gi, to: "" },
];

export function cleanRedac(text, mode) {
  if (!text || typeof text !== "string") return text;
  var result = text;
  var isLivrable = mode === "livrable";

  // 1. Mots bannis → remplacements
  REDAC_BANNIS.forEach(function (rule) {
    // En mode livrable : préserver "complexe" (mot juste pour un recruteur)
    if (isLivrable && rule.from.toString().indexOf("complexe") !== -1) return;
    result = result.replace(rule.from, rule.to);
  });

  // 2. Nettoyage des espaces doubles et lignes vides créés par les suppressions
  result = result
    .replace(/  +/g, " ")
    .replace(/\n /g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+/, "")
    .replace(/\s+$/, "");

  // 3. Phrases qui commencent par une minuscule après suppression
  result = result.replace(/\. {1,2}[a-zéèêàùâîôû]/g, function (match) {
    return match.slice(0, -1) + match.slice(-1).toUpperCase();
  });

  // 4. Règle de trois — UNIQUEMENT en mode coaching
  // En mode livrable, lister 3 actions ou 3 résultats est légitime
  if (!isLivrable) {
    result = result.replace(/([A-ZÀ-Ú][^,]{3,30}), ([^,]{3,30}),? et ([^.]{3,40})\./g, function (match, a, b, c) {
      if (a.length > 35 || b.length > 35 || c.length > 45) return match;
      return a.trim() + " et " + b.trim() + ". " + c.trim().charAt(0).toUpperCase() + c.trim().slice(1) + " aussi.";
    });
  }

  // 5. Anti-métronome — UNIQUEMENT en mode coaching
  // En mode livrable, les phrases courtes sont du scan 6 secondes
  if (!isLivrable) {
    var sentences = result.split(/(?<=\.)\s+/);
    if (sentences.length >= 3) {
      var merged = [];
      var shortStreak = 0;
      for (var i = 0; i < sentences.length; i++) {
        var s = sentences[i];
        if (s.length < 25 && s.length > 2) {
          shortStreak++;
          if (shortStreak >= 3 && merged.length > 0) {
            merged[merged.length - 1] =
              merged[merged.length - 1].replace(/\.\s*$/, "") + " — " + s.charAt(0).toLowerCase() + s.slice(1);
            continue;
          }
        } else {
          shortStreak = 0;
        }
        merged.push(s);
      }
      result = merged.join(" ");
    }
  }

  // 6. Première lettre du texte en majuscule si suppression a laissé une minuscule
  if (result.length > 0 && /^[a-zéèêàùâîôû]/.test(result)) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

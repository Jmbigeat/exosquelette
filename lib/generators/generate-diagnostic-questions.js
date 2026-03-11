import { getActiveCauchemars, formatCost } from "../sprint/scoring.js";

/* ==============================
   POST LINKEDIN GENERATOR — cauchemar + these + situation + question
   ============================== */

export function generateDiagnosticQuestions(bricks, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length < 2) return [];

  var questions = [];

  // Find strongest decision brick
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  if (decisionBricks.length > 0) {
    var db = decisionBricks[0];
    questions.push({
      type: "arbitrage",
      color: "#9b59b6",
      level1: "Comment les arbitrages stratégiques sont-ils pris ici ? Qui tranche quand les équipes ne s'alignent pas ?",
      level2: "J'ai dû arbitrer entre " + (db.text.length > 50 ? db.text.slice(0, 50) + "..." : db.text) + ". Ici, quelle est la décision difficile que personne ne veut prendre pour atteindre les objectifs du prochain trimestre ?",
      logic: "Basée sur ta brique décision la plus forte. Tu as la crédibilité de poser cette question parce que tu as déjà traversé un arbitrage similaire.",
      brickRef: db.text.length > 60 ? db.text.slice(0, 60) + "..." : db.text,
    });
  }

  // Find strongest influence brick
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  if (influenceBricks.length > 0) {
    var ib = influenceBricks[0];
    questions.push({
      type: "friction",
      color: "#3498db",
      level1: "Comment l'alignement entre les équipes fonctionne-t-il au quotidien ? Quels sont les points de friction les plus fréquents ?",
      level2: "J'ai aligné des équipes qui ne reportaient pas à moi sur des sujets similaires. Ici, comment gérez-vous le conflit d'intérêt entre la vision produit et la réalité commerciale ?",
      logic: "Basée sur ta brique influence. Tu montres que tu penses en dynamique politique, pas en organigramme.",
      brickRef: ib.text.length > 60 ? ib.text.slice(0, 60) + "..." : ib.text,
    });
  }

  // Cauchemar-based question (always)
  if (getActiveCauchemars().length > 0) {
    var cauchemar = getActiveCauchemars()[0];
    var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
    questions.push({
      type: "efficience",
      color: "#e94560",
      level1: "L'offre mentionne " + cauchemar.label.toLowerCase() + ". Qu'est-ce qui a été tenté avant pour résoudre ce problème ?",
      level2: "Ce type de problème coûte entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an dans la plupart des structures que je connais. Si rien ne change dans les 6 prochains mois, quel est l'impact sur vos objectifs ?",
      logic: "Basée sur le cauchemar principal de l'offre. Tu montres que tu penses en coût du problème, pas en coût salarial.",
      brickRef: cauchemar.label,
    });
  }

  // Cicatrice-based question (if exists)
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  if (cicatrices.length > 0) {
    questions.push({
      type: "saillance",
      color: "#ff9800",
      level1: "Quel a été le dernier échec marquant de l'équipe et qu'est-ce qui a changé après ?",
      level2: "J'ai moi-même perdu un deal majeur en sous-estimant la politique interne. Ça m'a forcé à changer de méthode. Ici, comment la culture de l'équipe traite-t-elle les échecs ? Est-ce qu'on en parle ou est-ce qu'on les enterre ?",
      logic: "Basée sur ta cicatrice. Tu as la crédibilité de parler d'échec parce que tu as assumé le tien. Le recruteur mesure ta maturité et la culture de l'entreprise en même temps.",
      brickRef: cicatrices[0].text.length > 60 ? cicatrices[0].text.slice(0, 60) + "..." : cicatrices[0].text,
    });
  }

  return questions.slice(0, 4);
}

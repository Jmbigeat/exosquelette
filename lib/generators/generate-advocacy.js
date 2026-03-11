import { extractBestNum } from "./helpers.js";

export function generateAdvocacyText(text, category, type, nightmareText) {
  if (!text || text.length < 20) return null;
  var num = extractBestNum(text);

  if (type === "cicatrice") {
    if (nightmareText && num) return "Il a déjà vécu exactement le scénario qu'on redoute. Son échec lui a coûté " + num + ". Il sait ce qui casse et comment corriger. On ne trouvera pas quelqu'un qui connaît mieux ce piège.";
    if (nightmareText) return "Il a traversé le même type de crise que celle qu'on essaie d'éviter. Il l'assume et il sait ce qu'il ne refera pas. C'est une assurance qu'aucun autre candidat ne peut offrir.";
    return num
      ? "Il a assumé un échec qui a coûté " + num + ". Il a corrigé le tir. C'est rare à ce niveau. La plupart des candidats mentent ou esquivent."
      : "Il a traversé une situation difficile et il l'assume sans détour. Il sait ce qu'il ne refera pas. C'est un profil qui apprend de ses erreurs, pas quelqu'un qui les cache.";
  }
  if (category === "decision") {
    if (nightmareText && num) return "Il a tranché un arbitrage à " + num + " sur un sujet qui ressemble au nôtre. Il sait ce qu'on sacrifie et ce qu'on gagne. Il ne découvrira pas le problème — il l'a déjà résolu.";
    if (nightmareText) return "Il a pris une décision difficile sur un problème similaire au nôtre. Il connaît les pièges. Il ne va pas tâtonner pendant 6 mois — il sait déjà où aller.";
    return num
      ? "Il a tranché un arbitrage à " + num + ". Il explique pourquoi il a choisi cette option et ce qu'il a sacrifié. Ce n'est pas un exécutant. Il décide sous pression."
      : "Il a pris une décision difficile et il assume les conséquences. Il ne cherche pas le consensus. Il tranche et il avance.";
  }
  if (category === "influence") {
    if (nightmareText && num) return "Il a débloqué des résistances sur un sujet comparable au nôtre. Résultat : " + num + ". Il sait naviguer la politique sur ce type de problème. C'est exactement ce qu'on cherche.";
    if (nightmareText) return "Il a aligné des gens sur un sujet similaire au nôtre. Il connaît les résistances qu'on va rencontrer parce qu'il les a déjà retournées.";
    return num
      ? "Il a aligné des gens qui ne voulaient pas s'aligner. Le résultat : " + num + ". Ce n'est pas un manager de process. Il sait naviguer la politique."
      : "Il a débloqué une situation humaine. Il sait lire les résistances et les retourner. C'est le genre de personne qu'on met sur les sujets bloqués.";
  }
  // Default: chiffre brick
  if (nightmareText && num) {
    return "Il a résolu exactement le problème qu'on a en ce moment. Son chiffre : " + num + ". Il sait de quoi il parle parce qu'il l'a déjà fait.";
  }
  if (nightmareText) {
    return "Il a déjà travaillé sur le même type de problème que le nôtre. Il ne part pas de zéro. C'est un avantage qu'on ne retrouvera pas chez les autres candidats.";
  }
  if (num) {
    return "Son résultat clé : " + num + ". Il mesure ce qu'il fait. Il ne parle pas en impressions. Il y a un avant et un après son passage.";
  }
  return "Il a un parcours concret. Il parle de ce qu'il a fait, pas de ce qu'il ferait. C'est un profil opérationnel qui produit des résultats mesurables.";
}



export function generateInternalAdvocacy(text, category, type, elasticity) {
  if (!text || text.length < 20) return null;
  var num = extractBestNum(text);
  var isElastic = elasticity === "élastique";

  if (type === "cicatrice") {
    return "Tu es la mémoire de ce qui a échoué et pourquoi. Si tu pars, l'équipe refait les mêmes erreurs. Personne d'autre n'a vécu cette correction.";
  }
  if (category === "decision") {
    var base = "Tu es celui qui tranche quand tout le monde hésite.";
    if (num) base += " Ton dernier arbitrage a pesé " + num + ".";
    base += isElastic
      ? " Cette capacité n'est pas remplaçable par un outil ou un process. Elle part avec toi."
      : " Le remplacement prendra 6 mois minimum. Le coût de l'indécision en attendant est invisible mais réel.";
    return base;
  }
  if (category === "influence") {
    return "Tu es la personne qui débloque les situations humaines. Les alignements que tu as construits tiennent parce que tu les maintiens. Si tu pars, les frictions reviennent en 3 mois."
      + (num ? " Impact documenté : " + num + "." : "");
  }
  // Default: chiffre
  if (num && isElastic) {
    return "Ton résultat de " + num + " repose sur ta méthode. Pas sur un outil qu'on peut transférer. Si tu pars, le résultat part avec toi. Le recrutement de ton remplacement coûtera 6-9 mois de salaire. Le trou de production entre les deux n'a pas de prix.";
  }
  if (num) {
    return "Tu produis " + num + ". Ton remplacement coûtera du temps (6-9 mois de recrutement + intégration) et de l'argent (cabinet + formation). Pendant ce temps, ce résultat disparaît.";
  }
  return "Tu portes un savoir opérationnel que l'entreprise n'a pas documenté. Si tu pars, il faut 6 mois pour que ton remplacement atteigne ta vitesse actuelle. C'est un coût que ton N+1 ne voit pas aujourd'hui.";
}

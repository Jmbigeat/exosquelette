import { KPI_REFERENCE, STRESS_ANGLES } from "../sprint/references.js";
import { hashCode } from "../sprint/scoring.js";

export function generateStressTest(brick, targetRoleId, offersArray) {
  if (!brick || !brick.text) return null;
  var text = brick.text.toLowerCase();
  var angles = [];

  // ===== SOURCE 1: ANGLES GÉNÉRIQUES (toujours présents) =====

  // Angle 1 : Contexte vs mérite (toujours pertinent)
  var ctxPool = STRESS_ANGLES.contexte;
  angles.push({
    type: "contexte",
    label: "Contexte favorable ?",
    attack: ctxPool[Math.abs(hashCode(brick.id + "ctx")) % ctxPool.length],
    defense:
      "Isole ton action du contexte. Cite la mesure avant/après TON intervention. Si le marché aidait tout le monde, pourquoi tes collègues n'ont pas le même résultat ?",
    source: "generique",
  });

  // Angle 2 : Selon le type de brique
  if (brick.brickType === "cicatrice") {
    var echPool = STRESS_ANGLES.echec;
    angles.push({
      type: "echec",
      label: "Échec assumé ou subi ?",
      attack: echPool[Math.abs(hashCode(brick.id + "ech")) % echPool.length],
      defense:
        "Montre ce que l'échec t'a appris. La cicatrice vaut par la décision que tu prends APRÈS. Pas par la douleur.",
      source: "generique",
    });
  } else if (brick.brickCategory === "decision" || brick.brickCategory === "influence") {
    var colPool = STRESS_ANGLES.collectif;
    angles.push({
      type: "collectif",
      label: "Contribution individuelle ?",
      attack: colPool[Math.abs(hashCode(brick.id + "col")) % colPool.length],
      defense:
        "Identifie TA décision. Pas le résultat collectif. La décision que TU as prise et que personne d'autre n'aurait prise de la même façon.",

      source: "generique",
    });
  } else {
    var cauPool = STRESS_ANGLES.causalite;
    angles.push({
      type: "causalite",
      label: "Causalité prouvée ?",
      attack: cauPool[Math.abs(hashCode(brick.id + "cau")) % cauPool.length],
      defense:
        "Montre la méthode. Avant X, après Y. Ce qui a changé entre les deux, c'est ton action. Chiffre + périmètre + timeline.",
      source: "generique",
    });
  }

  // Angle 3 : Reproductibilité (toujours pertinent)
  var repPool = STRESS_ANGLES.reproductibilite;
  angles.push({
    type: "reproductibilite",
    label: "Reproductible ici ?",
    attack: repPool[Math.abs(hashCode(brick.id + "rep")) % repPool.length],
    defense:
      "Identifie le principe transférable. Pas le contexte spécifique. Ce que tu feras chez eux, c'est appliquer la même logique à LEUR problème.",

    source: "generique",
  });

  // ===== SOURCE 2: ATTAQUES TIRÉES DE L'OFFRE =====
  if (offersArray && offersArray.length > 0) {
    var offerText = offersArray[0].text || "";
    var offerLower = offerText.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u");
    var offerAttack = null;

    // Detect signals in offer and build specific attacks
    var hasAutonomie =
      offerLower.indexOf("autonomi") !== -1 ||
      offerLower.indexOf("seul") !== -1 ||
      offerLower.indexOf("independan") !== -1;
    var hasHyperCroissance =
      offerLower.indexOf("forte croissance") !== -1 ||
      offerLower.indexOf("hyper") !== -1 ||
      offerLower.indexOf("scale") !== -1;
    var hasRestructuration =
      offerLower.indexOf("restructur") !== -1 ||
      offerLower.indexOf("transformation") !== -1 ||
      offerLower.indexOf("reorganis") !== -1;
    var hasExigeant =
      offerLower.indexOf("exigean") !== -1 ||
      offerLower.indexOf("pression") !== -1 ||
      offerLower.indexOf("rythme soutenu") !== -1 ||
      offerLower.indexOf("fast-paced") !== -1;
    var hasCreationPoste =
      offerLower.indexOf("creation de poste") !== -1 ||
      offerLower.indexOf("nouveau poste") !== -1 ||
      offerLower.indexOf("premiere recrue") !== -1;
    var hasInternational =
      offerLower.indexOf("international") !== -1 ||
      offerLower.indexOf("multi-pays") !== -1 ||
      offerLower.indexOf("emea") !== -1 ||
      offerLower.indexOf("global") !== -1;
    var hasRemplacement =
      offerLower.indexOf("remplace") !== -1 ||
      offerLower.indexOf("succession") !== -1 ||
      offerLower.indexOf("depart") !== -1;

    if (hasAutonomie) {
      offerAttack = {
        type: "offre_autonomie",
        label: "Autonomie ou isolement ?",
        attack:
          "Le recruteur dira : 'L'offre mentionne une forte autonomie. Votre dernier poste incluait une équipe structurée. Donnez-moi un exemple où vous avez délivré un résultat seul, sans support.'",
        defense:
          "Cite un projet où tu as porté le résultat de A à Z sans équipe. Si tu n'en as pas, sois honnête : ton atout est de structurer là où rien n'existe. C'est un atout d'autonomie.",
        source: "offre",
      };
    } else if (hasHyperCroissance) {
      offerAttack = {
        type: "offre_croissance",
        label: "Rythme de croissance ?",
        attack:
          "Le recruteur dira : 'On double chaque année. Votre expérience est dans une structure stable. Qu'est-ce qui prouve que vous tiendrez le rythme quand les process changent tous les 3 mois ?'",
        defense:
          "Montre un moment où tout a changé autour de toi et où tu as produit un résultat malgré le chaos. La croissance casse les process. Ton atout c'est de livrer sans process.",
        source: "offre",
      };
    } else if (hasRestructuration) {
      offerAttack = {
        type: "offre_restructuration",
        label: "Gestion de crise ?",
        attack:
          "Le recruteur dira : 'Le contexte ici est une restructuration. Les gens partent. Le moral est bas. Qu'est-ce que vous faites les 90 premiers jours quand personne ne veut coopérer ?'",
        defense:
          "Cite une situation de tension où tu as obtenu un résultat malgré la résistance. Le recruteur cherche quelqu'un qui avance quand les autres freinent.",
        source: "offre",
      };
    } else if (hasExigeant) {
      offerAttack = {
        type: "offre_pression",
        label: "Résistance à la pression ?",
        attack:
          "Le recruteur dira : 'L'environnement ici est exigeant. Le dernier sur ce poste n'a pas tenu 8 mois. Qu'est-ce qui vous rend différent ?'",
        defense:
          "Ne dis pas 'je gère le stress.' Cite un trimestre où tout a déraillé et montre le résultat que tu as quand même sorti. Le chiffre parle. Pas l'adjectif.",
        source: "offre",
      };
    } else if (hasCreationPoste) {
      offerAttack = {
        type: "offre_creation",
        label: "Poste sans précédent ?",
        attack:
          "Le recruteur dira : 'C'est une création de poste. Il n'y a pas de fiche de poste claire. Pas de prédécesseur. Comment vous définissez vos priorités quand personne ne sait ce qu'on attend de vous ?'",
        defense:
          "Montre un moment où tu as défini le périmètre toi-même. Le recruteur cherche quelqu'un qui structure le flou. Cite ta méthode pour identifier les 3 premiers quick wins.",
        source: "offre",
      };
    } else if (hasInternational) {
      offerAttack = {
        type: "offre_international",
        label: "Contexte international ?",
        attack:
          "Le recruteur dira : 'Le poste couvre plusieurs pays. Les fuseaux horaires, les cultures, les réglementations diffèrent. Votre expérience est franco-française. Comment vous gérez ?'",
        defense:
          "Cite une collaboration cross-country, un projet multi-fuseaux ou une négociation interculturelle. Si tu n'en as pas, montre ta capacité d'adaptation sur un changement de contexte radical.",
        source: "offre",
      };
    } else if (hasRemplacement) {
      offerAttack = {
        type: "offre_remplacement",
        label: "Comparaison au prédécesseur ?",
        attack:
          "Le recruteur dira : 'Vous remplacez quelqu'un qui avait 8 ans d'ancienneté. L'équipe lui était loyale. Comment vous gagnez la confiance d'une équipe qui ne vous a pas choisi ?'",
        defense:
          "Ne critique jamais le prédécesseur. Cite un moment où tu as pris un poste après quelqu'un et où tu as gagné la confiance par un résultat rapide. Le premier quick win efface la comparaison.",
        source: "offre",
      };
    }

    if (offerAttack) angles.push(offerAttack);
  }

  // ===== SOURCE 3: ATTAQUES TIRÉES DU MARCHÉ / RÔLE =====
  if (targetRoleId) {
    var roleData = KPI_REFERENCE[targetRoleId];
    var marketAttack = null;

    // Extract numbers from brick text to compare with market benchmarks
    var numbers = text.match(/\d+/g);
    var hasSmallNumbers =
      numbers &&
      numbers.some(function (n) {
        return parseInt(n) < 20;
      });
    var hasPercentage = text.indexOf("%") !== -1;

    if (
      targetRoleId === "enterprise_ae" &&
      (text.indexOf("cycle") !== -1 || text.indexOf("deal") !== -1 || text.indexOf("vente") !== -1)
    ) {
      marketAttack = {
        type: "marche_cycle",
        label: "Benchmark marché ?",
        attack:
          "Le recruteur dira : 'Le cycle de vente moyen dans notre secteur est de 6 à 9 mois. Vos chiffres viennent d'un cycle transactionnel beaucoup plus court. Comment vous transférez cette compétence sur du enterprise long ?'",
        defense:
          "Sépare la méthode du cycle. Ta méthode de qualification, de multi-threading, de gestion du champion fonctionne quel que soit le cycle. Cite l'étape du process que tu as améliorée, pas le résultat final.",
        source: "marche",
      };
    } else if (
      targetRoleId === "head_of_growth" &&
      (text.indexOf("acquisition") !== -1 ||
        text.indexOf("lead") !== -1 ||
        text.indexOf("canal") !== -1 ||
        text.indexOf("cac") !== -1)
    ) {
      marketAttack = {
        type: "marche_cac",
        label: "CAC et scalabilité ?",
        attack:
          "Le recruteur dira : 'Votre CAC était bas parce que votre marché n'était pas saturé. Ici la concurrence a fait exploser les coûts d'acquisition. Votre méthode tient encore quand le CPM triple ?'",
        defense:
          "Montre que ta méthode a fonctionné PENDANT une hausse des coûts, pas juste dans un marché vierge. Si tu as diversifié les canaux quand un s'est fermé, c'est la preuve.",
        source: "marche",
      };
    } else if (
      targetRoleId === "strategic_csm" &&
      (text.indexOf("churn") !== -1 ||
        text.indexOf("retention") !== -1 ||
        text.indexOf("nrr") !== -1 ||
        text.indexOf("upsell") !== -1)
    ) {
      marketAttack = {
        type: "marche_churn",
        label: "Churn structurel ?",
        attack:
          "Le recruteur dira : 'Le churn moyen SaaS est de 5-7% annuel. Votre taux était déjà en dessous avant votre arrivée. Qu'avez-vous réellement changé ?'",
        defense:
          "Isole le segment que tu as traité. Le churn global masque les segments. Montre le segment le plus risqué et ce que tu as fait dessus. Le delta est ta preuve.",
        source: "marche",
      };
    } else if (
      targetRoleId === "senior_pm" &&
      (text.indexOf("feature") !== -1 ||
        text.indexOf("roadmap") !== -1 ||
        text.indexOf("produit") !== -1 ||
        text.indexOf("discovery") !== -1)
    ) {
      marketAttack = {
        type: "marche_feature",
        label: "Impact produit réel ?",
        attack:
          "Le recruteur dira : 'En moyenne, 80% des features lancées n'ont pas d'impact mesurable. Comment vous mesurez que votre feature a réellement bougé une métrique, et pas juste fait plaisir à un stakeholder ?'",
        defense:
          "Cite la métrique AVANT et APRÈS le lancement. Si tu n'as pas mesuré l'impact post-lancement, sois honnête et montre comment tu structurerais la mesure ici.",
        source: "marche",
      };
    } else if (
      targetRoleId === "engineering_manager" &&
      (text.indexOf("equipe") !== -1 ||
        text.indexOf("recrutement") !== -1 ||
        text.indexOf("turnover") !== -1 ||
        text.indexOf("delivery") !== -1)
    ) {
      marketAttack = {
        type: "marche_retention",
        label: "Rétention tech ?",
        attack:
          "Le recruteur dira : 'Le turnover moyen en engineering est de 15-20%. Le marché est tendu. Votre équipe restait peut-être parce que le marché était fermé, pas parce que votre management était bon. Comment vous prouvez le contraire ?'",
        defense:
          "Cite les départs évités. Un membre qui a reçu une offre et est resté, c'est ta preuve. Le taux de rétention seul ne suffit pas. La raison de la rétention si.",
        source: "marche",
      };
    } else if (targetRoleId === "ai_architect") {
      marketAttack = {
        type: "marche_ia",
        label: "Production vs POC ?",
        attack:
          "Le recruteur dira : '85% des projets IA ne passent jamais en production. Votre projet était-il un POC qui a impressionné un COMEX ou un système qui tourne encore aujourd'hui ?'",
        defense:
          "Cite le nombre d'utilisateurs actifs, le volume de requêtes, ou la durée en production. Un POC en production depuis 18 mois vaut plus qu'un projet flagship arrêté après 3 mois.",
        source: "marche",
      };
    } else if (targetRoleId === "management_consultant") {
      marketAttack = {
        type: "marche_conseil",
        label: "Impact post-mission ?",
        attack:
          "Le recruteur dira : 'Les consultants partent, les recommandations restent dans un tiroir. Votre livrable a-t-il été implémenté ? Quel résultat 6 mois après votre départ ?'",
        defense:
          "Cite le résultat post-mission. Si tu as un chiffre du client 6 mois après, c'est ta meilleure preuve. Si tu n'en as pas, cite la décision concrète que le client a prise grâce à toi.",
        source: "marche",
      };
    } else if (hasPercentage || hasSmallNumbers) {
      marketAttack = {
        type: "marche_benchmark",
        label: "Chiffre vs benchmark ?",
        attack:
          "Le recruteur dira : 'Ce chiffre est correct, mais c'est la moyenne du secteur. Qu'est-ce qui prouve que c'est exceptionnel et pas juste normal ?'",
        defense:
          "Situe ton chiffre. Compare-le au benchmark de ton secteur, de ton équipe précédente, ou de ton prédécesseur. Un chiffre sans référence est un chiffre sans poids.",
        source: "marche",
      };
    }

    if (marketAttack) angles.push(marketAttack);
  }

  return angles;
}

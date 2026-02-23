import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    var body = await req.json();
    var pillars = body.pillars || [];
    var takes = body.takes || [];

    if (pillars.length === 0) {
      return NextResponse.json({ error: "Aucun pilier fourni" }, { status: 400 });
    }

    var pillarsList = pillars.map(function(p) {
      return "- ID " + p.id + " : " + p.title + " — " + p.desc;
    }).join("\n");

    var takesList = takes.length > 0
      ? takes.map(function(t) {
          return "- " + t.title + " : " + (t.desc || "") + (t.text ? " | Preuve : " + t.text.slice(0, 200) : "");
        }).join("\n")
      : "Aucune prise de position formulée.";

    var prompt = `Tu es un expert en positionnement de carrière.

Le candidat a des prises de position existantes (takes) et des piliers complémentaires proposés par l'IA. Évalue la complémentarité de chaque pilier par rapport aux takes existants.

PRISES DE POSITION EXISTANTES DU CANDIDAT :
${takesList}

PILIERS COMPLÉMENTAIRES CANDIDATS :
${pillarsList}

RÈGLES :
- Maximum 2 piliers peuvent être marqués "recommended": true
- Complémentaire signifie couvrir un territoire ABSENT des positions existantes. Un pilier qui renforce, approfondit ou nuance une position existante n'est PAS complémentaire. Deux piliers recommandés ne doivent pas non plus couvrir le même territoire entre eux. Privilégie la diversité maximale des angles couverts.
- Deux positions partagent le même territoire si elles s'appuient sur le même axe de tension (ex: junior vs senior, quantité vs qualité, exécution vs stratégie), même si l'angle d'attaque diffère (technologique vs organisationnel vs managérial). Teste chaque pilier candidat : reformule son argument central en une opposition de 3 mots. Si cette opposition existe déjà dans une position validée, le pilier N'EST PAS complémentaire.
- Si le candidat n'a aucune prise de position, recommande les 2 piliers les plus différenciants pour le rôle
- La raison doit être courte (1 phrase) et expliquer pourquoi ce pilier complète le profil

Réponds en JSON strict, sans backticks, sans préambule. Format :
[
  { "id": 1, "recommended": true, "reason": "Couvre le territoire X absent de tes positions actuelles." },
  { "id": 2, "recommended": false, "reason": "" }
]`;

    var response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    var text = response.content
      .map(function(b) { return b.type === "text" ? b.text : ""; })
      .join("");

    var clean = text.replace(/```json|```/g, "").trim();
    var parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Recommend-pillars error:", err);
    return NextResponse.json({ error: "Erreur lors de la recommandation" }, { status: 500 });
  }
}

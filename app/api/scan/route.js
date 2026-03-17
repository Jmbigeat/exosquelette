import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    var body = await req.json();
    var cv = body.cv || "";
    var offers = body.offers || "";
    var roleId = body.roleId || "";

    if (cv.length < 20 || offers.length < 20) {
      return NextResponse.json({ error: "Contenu insuffisant" }, { status: 400 });
    }

    var prompt = `Tu es un expert en recrutement et positionnement de carrière.

Le client a colle son CV/profil et des offres cibles. Ton travail :
1. Identifier 3-5 briques de preuve probables (réalisations chiffrées, décisions, influences)
2. Identifier 2-3 KPIs caches dans les offres (ce que le recruteur cherche sans le dire)
3. Identifier les compétences clés croisées entre le profil et les offres
4. Détecter les décalages (ce que le profil montre vs ce que les offres demandent)
5. Pour chaque brique, détecte si elle décrit un projet personnel, side project, contribution open source, bénévolat, association, blog personnel, ou tout projet sans employeur. Si oui, retourne sideProject: true. Si la brique décrit une expérience dans le cadre d'un emploi salarié ou d'une mission freelance facturée, retourne sideProject: false.

PROFIL DU CLIENT :
${cv.slice(0, 3000)}

OFFRES CIBLES :
${offers.slice(0, 3000)}

ROLE DETECTE OU CHOISI : ${roleId}

Reponds en JSON strict, sans backticks, sans preamble. Format :
{
  "bricks": [
    { "text": "description de la brique hypothetique", "kpi": "nom du KPI", "category": "chiffre|decision|influence", "confidence": "haute|moyenne", "sideProject": false }
  ],
  "hiddenKpis": [
    { "name": "nom du KPI", "why": "pourquoi c'est cache dans l'offre" }
  ],
  "topSkills": ["competence1", "competence2", "competence3"],
  "gaps": ["decalage1", "decalage2"]
}`;

    var response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    var text = response.content
      .map(function (b) {
        return b.type === "text" ? b.text : "";
      })
      .join("");

    // Parse JSON from response
    var clean = text.replace(/```json|```/g, "").trim();
    var parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Erreur lors du scan" }, { status: 500 });
  }
}

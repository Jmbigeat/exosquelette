import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Contrat d'interface strict pour ABNEG@TION
const ScoutOutputSchema = z.object({
  role: z.string(),
  kpiCache: z.string(),
  cauchemars: z.array(z.string())
});

// Guard : vérifier que la clé API est configurée
if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️ GEMINI_API_KEY manquante — l'API Scout sera indisponible");
}

// Initialisation sécurisée
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export async function POST(req) {
  try {
    if (!ai) {
      return NextResponse.json(
        { error: "Le moteur d'analyse est temporairement indisponible." },
        { status: 503 }
      );
    }

    const { jobDescription } = await req.json();

    if (!jobDescription) {
      return NextResponse.json({ error: "L'offre d'emploi est vide" }, { status: 400 });
    }

    // Appel standardisé
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Tu es l'Éclaireur pour ABNEG@TION. Analyse l'offre d'emploi suivante et renvoie STRICTEMENT un objet JSON contenant les clés "role" (chaîne), "kpiCache" (chaîne) et "cauchemars" (tableau de chaînes).
      
      Offre d'emploi :
      ${jobDescription}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text;

    // Nettoyage de secours au cas où l'IA mettrait des balises ```json
    const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonParsed = JSON.parse(cleanJsonText);

    // Validation déterministe
    const validatedData = ScoutOutputSchema.parse(jsonParsed);

    return NextResponse.json(validatedData);

  } catch (error) {
    console.error("💥 Erreur de l'Éclaireur :", error);
    return NextResponse.json(
      { error: "Erreur interne du moteur d'analyse" },
      { status: 500 }
    );
  }
}

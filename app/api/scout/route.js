import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRateLimiter, getClientIp } from '@/lib/rateLimit';

// Limitation : max 10 requêtes par IP par tranche de 15 minutes
const scoutRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

const scoutInputSchema = z.object({
  jobDescription: z
    .string()
    .min(20, "L'offre d'emploi est trop courte (minimum 20 caractères)")
    .max(15000, "L'offre d'emploi est trop longue (maximum 15 000 caractères)"),
});

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
    const ip = getClientIp(req);
    if (scoutRateLimiter(ip)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez patienter 15 minutes avant de réessayer." },
        { status: 429 }
      );
    }

    if (!ai) {
      return NextResponse.json(
        { error: "Le moteur d'analyse est temporairement indisponible." },
        { status: 503 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
    }

    const parsedInput = scoutInputSchema.safeParse(body);
    if (!parsedInput.success) {
      const issue = parsedInput.error.issues[0]?.message || "Offre d'emploi invalide";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { jobDescription } = parsedInput.data;

    // Appel standardisé avec troncature de précaution
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Tu es l'Éclaireur pour ABNEG@TION. Analyse l'offre d'emploi suivante et renvoie STRICTEMENT un objet JSON contenant les clés "role" (chaîne), "kpiCache" (chaîne) et "cauchemars" (tableau de chaînes).
      
      Offre d'emploi :
      ${jobDescription.slice(0, 4000)}`,
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

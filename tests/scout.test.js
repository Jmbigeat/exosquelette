import { z } from 'zod';
import dotenv from 'dotenv';

// Chargement automatique des clés secrètes
dotenv.config({ path: '.env.local' });

const ScoutOutputSchema = z.object({
  role: z.string(),
  kpiCache: z.string(),
  cauchemars: z.array(z.string())
});

async function runScoutUnitTest() {
  console.log("🧪 [TEST] Démarrage du test unitaire de l'Éclaireur avec Gemini 3.6 Flash...\n");

  const fakeJobDescription = `
    Recherchons Product Manager Expérimenté (H/F). 
    Vous gérerez notre application SaaS de comptabilité. 
    L'objectif principal est de réduire le taux d'attrition (churn) de 5% ce trimestre. 
    Vous devez être capable de dire non aux demandes farfelues des équipes commerciales pour garder le focus.
  `;

  try {
    const response = await fetch('http://localhost:3000/api/scout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobDescription: fakeJobDescription }),
    });

    if (response.ok === false) {
      throw new Error(`Le serveur a répondu avec un statut : ${response.status}`);
    }

    const data = await response.json();
    console.log("📥 [API] Réponse reçue de la route :");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n🔍 [ZOD] Validation de la structure des données...");

    const validationResult = ScoutOutputSchema.safeParse(data);

    if (validationResult.success) {
      console.log("✅ [SUCCÈS] Le test unitaire a réussi !");
      process.exit(0);
    } else {
      console.error("❌ [ÉCHEC] La réponse de Gemini ne respecte pas le schéma Zod requis.");
      console.error("Détails :", validationResult.error.format());
      process.exit(1);
    }

  } catch (error) {
    console.error("💥 [ERREUR CRITIQUE] Impossible de finaliser le test unitaire :", error.message);
    process.exit(1);
  }
}

runScoutUnitTest();


import asyncio
import sys
import os
from dotenv import load_dotenv 

# Chargement du fichier caché .env contenant votre clé API
chemin_script = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(chemin_script, '.env'))

from google.antigravity import Agent, LocalAgentConfig

async def main():
    # En laissant les parenthèses vides, le SDK utilise automatiquement 
    # le modèle stable officiel (Gemini 3.5 Flash) configuré pour Antigravity.
    config = LocalAgentConfig()
    
    async with Agent(config) as agent:
        reponse = await agent.chat("Dis-moi bonjour et confirme que le SDK Antigravity fonctionne !")
        
        async for token in reponse:
            sys.stdout.write(token)
            sys.stdout.flush()
        print()

if __name__ == "__main__":
    asyncio.run(main())








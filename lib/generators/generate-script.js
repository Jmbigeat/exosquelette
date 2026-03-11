import { generateContactScripts } from "./generate-contact-scripts.js";

export function generateScript(bricks, targetRoleId) {
  var result = generateContactScripts(bricks, targetRoleId);
  return result ? result.email : "[Script produit après validation de tes briques.]";
}

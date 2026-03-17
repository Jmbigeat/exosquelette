import { matchKpiToReference } from "./bricks.js";

var CURRENT_VERSION = 1;

function applyV1(state) {
  // a) Recalculer vault.pillars depuis takes
  if (state.takes && state.vault) {
    state.vault.pillars = state.takes.length;
  }
  // b) Remplacer '..' par '\n\n' dans le texte des briques
  if (state.bricks) {
    state.bricks.forEach(function(b) {
      if (b.text) b.text = b.text.replace(/\.\./g, "\n\n");
    });
  }
  // c) Re-matcher les KPIs avec matchKpiToReference
  if (state.bricks && state.targetRoleId) {
    state.bricks.forEach(function(b) {
      if (b.kpi) {
        var ref = matchKpiToReference(b.kpi, state.targetRoleId);
        if (ref) b.kpi = ref.name;
      }
    });
  }
  return state;
}

var PATCHES = [
  applyV1, // v0 → v1
];

export function migrateState(state) {
  if (!state) return state;
  var version = state._version || 0;
  for (var i = version; i < PATCHES.length; i++) {
    state = PATCHES[i](state);
  }
  state._version = CURRENT_VERSION;
  return state;
}

export { CURRENT_VERSION };

#!/usr/bin/env node
"use strict";

var execSync = require("child_process").execSync;
var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var results = { pass: 0, fail: 0, warn: 0 };

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (e) {
    return (e.stdout || "").trim();
  }
}

function check(category, name, cmd, shouldBeEmpty, warnOnly) {
  var output = run(cmd);
  var lines = output ? output.split("\n").filter(Boolean) : [];
  if (shouldBeEmpty && lines.length === 0) {
    console.log("  \u2713 " + name);
    results.pass++;
  } else if (shouldBeEmpty && lines.length > 0) {
    var symbol = warnOnly ? "\u26A0" : "\u2717";
    console.log("  " + symbol + " " + name + "    " + lines.length + " occurrence(s)");
    lines.slice(0, 5).forEach(function(l) { console.log("    \u2192 " + l); });
    if (lines.length > 5) console.log("    ... et " + (lines.length - 5) + " de plus");
    if (warnOnly) results.warn++; else results.fail++;
  } else if (!shouldBeEmpty && lines.length > 0) {
    console.log("  \u2713 " + name);
    results.pass++;
  } else {
    console.log("  \u2717 " + name + "    non trouv\u00e9");
    results.fail++;
  }
}

// ═══ HEADER ═══
var lastCommit = run("git log --oneline -1");
console.log("");
console.log("\u2550\u2550\u2550 QA AGENT \u2014 Abneg@tion \u2550\u2550\u2550");
console.log("Date: " + new Date().toISOString().slice(0, 10));
console.log("Dernier commit: " + lastCommit);
console.log("");

// ═══ SÉCURITÉ ═══
console.log("S\u00c9CURIT\u00c9");
check("sec", "dangerouslySetInnerHTML",
  "grep -rn 'dangerouslySetInnerHTML' components/ lib/ app/ --include='*.js' --include='*.jsx' || true",
  true);
check("sec", "service_role c\u00f4t\u00e9 client",
  "grep -rn 'SERVICE_ROLE\\|service_role' components/ lib/generators/ --include='*.js' --include='*.jsx' || true",
  true);
check("sec", "console.log production",
  "grep -rn 'console\\.log' components/ lib/ app/ --include='*.js' --include='*.jsx' | grep -v node_modules | grep -v '// debug' | grep -v 'smoke-test' | grep -v 'qa-agent' || true",
  true);
console.log("");

// ═══ ANTI-PATTERNS ═══
console.log("ANTI-PATTERNS");
check("anti", "Blindage invisible",
  "grep -rni 'blindage' components/ --include='*.jsx' | grep -v '//' | grep -v 'comment' | grep -v 'armorScore' | grep -v 'armor' || true",
  true);
check("anti", "Sprint \u00c9clair / RAC morts",
  "grep -rni 'sprint.\u00e9clair\\|sprint_eclair\\|sprintEclair\\|\"RAC\"' components/ lib/ app/ --include='*.js' --include='*.jsx' | grep -v '//' || true",
  true);
check("anti", "Pi\u00e8ces d\u00e9sactiv\u00e9es",
  "grep -rn 'consumePiece' components/ lib/ --include='*.js' --include='*.jsx' | grep -v '// TODO\\|// DEAD\\|// disabled\\|comment\\|function consumePiece' || true",
  true);
check("anti", "Unicode escapes",
  "grep -rn '\\\\u00\\|\\\\u20' components/ lib/ app/ --include='*.js' --include='*.jsx' || true",
  true);
check("anti", "Redirect externe \u00c9claireur\u2192Forge",
  "grep -rn 'window\\.location.*http\\|router\\.push.*http' components/eclaireur/ components/Onboarding.jsx components/Sprint.jsx --include='*.js' --include='*.jsx' 2>/dev/null || true",
  true);
console.log("");

// ═══ ARCHITECTURE ═══
console.log("ARCHITECTURE");
check("arch", "Guard auth sprint",
  "grep -n 'getUser\\|auth' app/sprint/page.js || true",
  false);
check("arch", "Guard auth brew",
  "grep -n 'getUser\\|auth' app/brew/page.jsx 2>/dev/null || true",
  false);
check("arch", "Proxy generators intact",
  "head -3 lib/sprint/generators.js | grep 'export.*from' || true",
  false);

// Check circular deps in hooks
var hooksDir = path.join(ROOT, "components", "sprint", "hooks");
if (fs.existsSync(hooksDir)) {
  var hookFiles = fs.readdirSync(hooksDir).filter(function(f) { return f.endsWith(".js"); });
  var circular = [];
  hookFiles.forEach(function(f) {
    var content = fs.readFileSync(path.join(hooksDir, f), "utf-8");
    hookFiles.forEach(function(other) {
      if (f !== other && content.indexOf(other.replace(".js", "")) !== -1 && content.indexOf("from") !== -1) {
        var importPattern = "from.*['\"].*" + other.replace(".js", "");
        if (new RegExp(importPattern).test(content)) {
          circular.push(f + " \u2192 " + other);
        }
      }
    });
  });
  if (circular.length === 0) {
    console.log("  \u2713 Hooks sans d\u00e9pendance circulaire");
    results.pass++;
  } else {
    console.log("  \u2717 Hooks d\u00e9pendance circulaire    " + circular.length + " d\u00e9tect\u00e9e(s)");
    circular.forEach(function(c) { console.log("    \u2192 " + c); });
    results.fail++;
  }
} else {
  console.log("  \u26A0 Dossier hooks/ non trouv\u00e9");
  results.warn++;
}
console.log("");

// ═══ QUALITÉ ═══
console.log("QUALIT\u00c9");

// Build
try {
  execSync("npm run build", { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] });
  console.log("  \u2713 Build clean");
  results.pass++;
} catch (e) {
  console.log("  \u2717 Build FAILED");
  results.fail++;
}

// Smoke
try {
  var smokeOut = execSync("npm run smoke 2>&1", { cwd: ROOT, encoding: "utf-8" });
  var smokeMatch = smokeOut.match(/(\d+)\/(\d+)/);
  if (smokeMatch) {
    console.log("  \u2713 Smoke tests    " + smokeMatch[0]);
  } else {
    console.log("  \u2713 Smoke tests    passed");
  }
  results.pass++;
} catch (e) {
  console.log("  \u2717 Smoke tests FAILED");
  var failOutput = (e.stdout || "").split("\n").filter(function(l) { return l.indexOf("FAIL") !== -1; });
  failOutput.slice(0, 3).forEach(function(l) { console.log("    \u2192 " + l); });
  results.fail++;
}
console.log("");

// ═══ PORTFOLIO PM ═══
console.log("PORTFOLIO PM");
var recentCommits = run("git log --oneline -5 main").split("\n");
var portfolio = "";
try {
  portfolio = fs.readFileSync(path.join(ROOT, "portfolio-pm-abnegation.md"), "utf-8");
} catch (e) {
  // fichier pas encore dans le repo
}
if (portfolio) {
  var undocumented = [];
  recentCommits.forEach(function(c) {
    if (/feat:|refactor:|fix:.*structur/.test(c)) {
      var hash = c.split(" ")[0];
      if (portfolio.indexOf(hash) === -1) {
        var keywords = c.split(" ").slice(1).filter(function(w) { return w.length > 4; });
        var found = keywords.some(function(kw) { return portfolio.toLowerCase().indexOf(kw.toLowerCase()) !== -1; });
        if (!found) undocumented.push(c);
      }
    }
  });
  if (undocumented.length === 0) {
    console.log("  \u2713 Portfolio \u00e0 jour");
    results.pass++;
  } else {
    undocumented.forEach(function(c) {
      console.log("  \u26A0 Commit non document\u00e9 : " + c);
    });
    results.warn += undocumented.length;
  }
} else {
  console.log("  \u26A0 portfolio-pm-abnegation.md non trouv\u00e9 dans le repo");
  results.warn++;
}

// ═══ FOOTER ═══
console.log("");
console.log("\u2550\u2550\u2550 " + results.pass + "/" + (results.pass + results.fail + results.warn) + " PASS \u00b7 " + results.fail + " FAIL \u00b7 " + results.warn + " WARN \u2550\u2550\u2550");
console.log("");

if (results.fail > 0) process.exit(1);

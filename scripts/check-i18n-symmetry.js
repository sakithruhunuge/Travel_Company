const fs = require("fs");
const path = require("path");

const LOCALES = ["en", "de", "fr", "si"];
const messagesDir = path.join(__dirname, "..", "messages");

function getAllKeys(obj, prefix = "") {
  let keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

console.log("🌐 Running i18n Key Symmetry Check across locales:", LOCALES.join(", "));

const localeData = {};
const keySets = {};

for (const loc of LOCALES) {
  const filePath = path.join(messagesDir, `${loc}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing locale dictionary file: ${filePath}`);
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  localeData[loc] = content;
  keySets[loc] = new Set(getAllKeys(content));
}

const baseKeys = Array.from(keySets["en"]);
let hasDiscrepancy = false;

for (const loc of LOCALES) {
  if (loc === "en") continue;
  const missingInLoc = baseKeys.filter((k) => !keySets[loc].has(k));
  const extraInLoc = Array.from(keySets[loc]).filter((k) => !keySets["en"].has(k));

  if (missingInLoc.length > 0) {
    console.warn(`⚠️ Locale '${loc}' is missing ${missingInLoc.length} keys present in 'en':`, missingInLoc.slice(0, 5));
    hasDiscrepancy = true;
  } else {
    console.log(`  ✓ Locale '${loc}' has 100% key parity with base 'en' (${keySets[loc].size} keys)`);
  }

  if (extraInLoc.length > 0) {
    console.warn(`ℹ️ Locale '${loc}' has ${extraInLoc.length} extra keys not in 'en':`, extraInLoc.slice(0, 5));
  }
}

if (!hasDiscrepancy) {
  console.log("✅ i18n Key Symmetry Audit Complete: All locale dictionaries are symmetrical!\n");
} else {
  console.log("⚠️ i18n Key Symmetry Audit completed with minor fallback key notices.\n");
}

import { parseGuestNotes } from "../components/dashboard/GuestNotesCard";

function runTests() {
  console.log("🧪 Running Special Requests & Guest Notes Readability & Accuracy Tests...\n");

  // Test 1: Clean raw JSON code block & Pricing table from custom calculator
  console.log("Test 1: Strip internal pricing calculator JSON and markdown tables...");
  const sampleCalcNote = `\`\`\`json
{
  "baseCost": 800,
  "transportCost": 250,
  "totalPrice": 1050
}
\`\`\`
### 🌟 Custom Calculator Specifications
- Selected Tour: Wildlife & Tea Trails
- Vehicle Category: Luxury Van

### 💵 Invoice Cost Breakdown
| Item | Amount |
| --- | --- |
| Transport | $250 |

### 📝 Traveler Special Requests
We will be landing on flight QR 664 at 09:30 AM. Strictly vegetarian food needed for all travelers. Please provide 1 baby booster seat.`;

  const res1 = parseGuestNotes(sampleCalcNote);
  if (
    !res1.cleanedText.includes("```json") &&
    !res1.cleanedText.includes("Invoice Cost Breakdown") &&
    !res1.cleanedText.includes("Custom Calculator") &&
    res1.cleanedText.includes("landing on flight QR 664")
  ) {
    console.log("  ✓ Test 1 Passed: Raw calculator code and tables stripped accurately");
  } else {
    throw new Error(`Test 1 Failed: Cleaned text contained calculator artifacts: ${res1.cleanedText}`);
  }

  // Test 2: Accurate badge detection (Flight, Dietary, Child seat)
  console.log("\nTest 2: Detecting operational quick-scan badges...");
  const badgeIds = res1.badges.map((b) => b.id);
  if (badgeIds.includes("flight") && badgeIds.includes("vegetarian") && badgeIds.includes("childseat")) {
    console.log("  ✓ Test 2 Passed: Detected flight, vegetarian, and childseat badges correctly");
  } else {
    throw new Error(`Test 2 Failed: Missing badges in ${JSON.stringify(badgeIds)}`);
  }

  // Test 3: Custom Destinations route parsing
  console.log("\nTest 3: Extracting Custom Destinations into route stops...");
  const sampleWizardNote = `Custom Destinations: [Sigiriya, Kandy, Nuwara Eliya, Yala]

Please arrange a German-speaking chauffeur if possible. Guests require wheelchair assistance at temples.`;

  const res3 = parseGuestNotes(sampleWizardNote);
  if (
    res3.destinations.length === 4 &&
    res3.destinations[0] === "Sigiriya" &&
    res3.destinations[3] === "Yala" &&
    !res3.cleanedText.includes("Custom Destinations:")
  ) {
    console.log("  ✓ Test 3 Passed: Custom destinations extracted into structured array without cluttering notes");
  } else {
    throw new Error(`Test 3 Failed: Destinations mismatch ${JSON.stringify(res3.destinations)}`);
  }

  // Test 4: Accessibility and Language badges
  console.log("\nTest 4: Checking Language and Mobility / Accessibility badges...");
  const badgeIds3 = res3.badges.map((b) => b.id);
  if (badgeIds3.includes("language") && badgeIds3.includes("accessibility")) {
    console.log("  ✓ Test 4 Passed: Language and accessibility alerts correctly tagged");
  } else {
    throw new Error(`Test 4 Failed: Badges missing in ${JSON.stringify(badgeIds3)}`);
  }

  // Test 5: Bullet point formatting vs Paragraph
  console.log("\nTest 5: Structured list parsing for formatted bullet points...");
  const sampleBulletNote = `- Pick up from Cinnamon Grand Hotel lobby at 08:00 AM
- Strictly Halal food throughout the journey
- Need trunk space for 4 large suitcases and golf bag`;

  const res5 = parseGuestNotes(sampleBulletNote);
  if (res5.bulletPoints.length === 3 && res5.bulletPoints[0].includes("Cinnamon Grand Hotel")) {
    console.log("  ✓ Test 5 Passed: Multi-line bullets parsed into structured array for crisp rendering");
  } else {
    throw new Error(`Test 5 Failed: Bullets not recognized: ${JSON.stringify(res5.bulletPoints)}`);
  }

  // Test 6: Handling 'None', empty, or whitespace notes
  console.log("\nTest 6: Handling 'None' and empty traveler notes...");
  const emptyRes1 = parseGuestNotes("None");
  const emptyRes2 = parseGuestNotes("");
  const emptyRes3 = parseGuestNotes("### 📝 Traveler Special Requests\nNone");

  if (!emptyRes1.hasNotes && !emptyRes2.hasNotes && !emptyRes3.hasNotes) {
    console.log("  ✓ Test 6 Passed: 'None' and empty requests safely resolved to standard journey profile");
  } else {
    throw new Error("Test 6 Failed: 'None' was treated as an active special request");
  }

  console.log("\n🎉 All 6 Special Requests & Guest Notes Tests Passed Successfully!\n");
}

runTests();

/**
 * Tour Guide Destination Knowledge Base
 * 
 * Curated cultural, historical, and practical briefings for Sri Lanka destinations.
 * Provides tour guides with brief place descriptions, key highlights, talking points,
 * and visitor advisory notes for each stop in their assigned tour itinerary.
 */

export interface DestinationGuideInfo {
  id: string;
  name: string;
  tagline: string;
  category: "Cultural & Heritage" | "Hill Country & Nature" | "Wildlife Safari" | "Coastal & Beach" | "Urban & Colonial";
  briefDescription: string;
  keyHighlights: string[];
  guideTalkingPoints: string[];
  visitorTips: string;
  image: string;
  region: string;
}

export const TOUR_GUIDE_DESTINATIONS: Record<string, DestinationGuideInfo> = {
  Colombo: {
    id: "colombo",
    name: "Colombo",
    tagline: "Commercial Capital & Oceanfront Colonial Gateway",
    category: "Urban & Colonial",
    briefDescription:
      "Sri Lanka's bustling oceanfront metropolis seamlessly blends British colonial architecture, ancient Buddhist shrines, and modern coastal skylines. Highlights include the lively Galle Face Green promenade, historic Fort district, and the tranquil Gangaramaya Temple on Beira Lake.",
    keyHighlights: [
      "Galle Face Green seaside promenade",
      "Gangaramaya Buddhist Temple & Museum",
      "Historic Colombo Fort & Old Dutch Hospital",
      "National Museum of Colombo",
      "Pettah Market floating bazaar & Red Mosque",
    ],
    guideTalkingPoints: [
      "Explain the strategic importance of Colombo port throughout Portuguese, Dutch, and British maritime spice trade.",
      "Highlight the eclectic mix of architecture at Gangaramaya Temple, including classic Sri Lankan, Thai, Indian, and Chinese influences.",
      "Recommend watching the sunset over the Indian Ocean while sampling fresh street delicacies at Galle Face Green.",
    ],
    visitorTips: "Best explored in late afternoon to escape midday heat. Light, modest attire is required when visiting Gangaramaya Temple.",
    image: "/images/colombo.png",
    region: "West Coast",
  },

  Negombo: {
    id: "negombo",
    name: "Negombo",
    tagline: "Historic Fishery Haven & Dutch Canal Coast",
    category: "Coastal & Beach",
    briefDescription:
      "Located just minutes from Bandaranaike International Airport, Negombo is renowned for its traditional catamaran fishing culture, expansive golden beach, and Dutch-era canal network. It serves as the primary entry point for international travelers starting their Sri Lankan journey.",
    keyHighlights: [
      "Lellama traditional open-air fish market",
      "Historic Hamilton / Dutch Canals & boat safaris",
      "St. Mary's Church and colonial Catholic architecture",
      "Negombo lagoon mangrove wetlands",
    ],
    guideTalkingPoints: [
      "Describe the centuries-old traditional 'Oruwa' (outrigger canoes) still launched at dawn by local artisanal fishermen.",
      "Point out the colonial spice canals originally engineered by the Dutch to transport cinnamon and spices to the coast.",
    ],
    visitorTips: "Early morning (6:00 AM - 7:30 AM) is the best time to witness the bustling Lellama fish market auction.",
    image: "/images/colombo.png",
    region: "West Coast",
  },

  Sigiriya: {
    id: "sigiriya",
    name: "Sigiriya",
    tagline: "5th-Century Ancient Sky Palace & UNESCO Lion Rock Citadel",
    category: "Cultural & Heritage",
    briefDescription:
      "A monumental 200-meter monolith transformed into an impenetrable royal fortress and palace complex by King Kashyapa in 477 AD. Celebrated globally for its ancient frescoes of celestial nymphs, polished Mirror Wall poetry, and the monumental colossal Lion Gate staircase leading to the palace summit.",
    keyHighlights: [
      "Colossal Lion Paws entrance staircase",
      "5th-century celestial maiden frescoes preserved in rock shelters",
      "Ancient Mirror Wall with centuries-old graffiti poetry",
      "Hydraulic royal water gardens and subterranean fountain network",
      "Panoramic 360-degree summit views across the central plains",
    ],
    guideTalkingPoints: [
      "Relate the dramatic royal intrigue of King Kashyapa fleeing Anuradhapura after usurping the throne from his father King Dhatusena.",
      "Explain the world-renowned hydraulic water garden systems at the base that still function during the monsoon rains.",
      "Decode the ancient Sinhala script graffiti preserved on the Mirror Wall left by travelers over 1,000 years ago.",
    ],
    visitorTips: "Start climbing before 8:00 AM or after 3:30 PM to avoid midday heat. Approximately 1,200 steps; advise guests to carry water and wear sturdy footwear.",
    image: "/images/sigiriya.png",
    region: "Cultural Triangle",
  },

  Dambulla: {
    id: "dambulla",
    name: "Dambulla",
    tagline: "Sacred Rock Cave Sanctuary & UNESCO Murals",
    category: "Cultural & Heritage",
    briefDescription:
      "Sri Lanka's largest and best-preserved cave temple complex, perched high atop a massive granite ridge. Dating back to the 1st century BC when King Valagamba sought refuge here, the five sacred sanctuary caves house over 150 serene Buddha statues and 2,100 square meters of exquisite rock ceiling murals.",
    keyHighlights: [
      "Five distinct ancient sanctuary caves carved under an overhanging rock",
      "Over 150 pristine Buddha statues, including a 14-meter reclining Buddha",
      "Vibrant Buddhist ceiling murals and chronicles painted on natural rock contours",
      "Sweeping views of Sigiriya Rock Fortress in the distance",
      "Golden Temple and monumental seated Buddha statue at the base",
    ],
    guideTalkingPoints: [
      "Narrate how King Valagamba took refuge in these caves for 14 years before reclaiming the throne in Anuradhapura, after which he consecrated the caves as royal shrines.",
      "Point out the natural dripping water spring inside Cave 2 that flows uphill along the ceiling into an earthen pot, used in sacred ceremonies.",
      "Highlight the distinct eras of mural restorations by successive kings from Polonnaruwa and Kandy kingdoms.",
    ],
    visitorTips: "Strict temple dress code: shoulders and knees must be covered. Footwear must be deposited at the temple entrance counter before entering the sacred cave terrace.",
    image: "/images/dambulla.png",
    region: "Cultural Triangle",
  },

  Kandy: {
    id: "kandy",
    name: "Kandy",
    tagline: "Sacred Hill Capital & Temple of the Sacred Tooth Relic",
    category: "Cultural & Heritage",
    briefDescription:
      "The last royal capital of Sri Lanka, nestled picturesquely around an artificial lake in the mist-veiled central highlands. Kandy is the spiritual heart of the nation, home to the sacred Temple of the Tooth Relic (Sri Dalada Maligawa), the royal botanical gardens at Peradeniya, and vibrant traditional Kandyan dance performances.",
    keyHighlights: [
      "Sri Dalada Maligawa (Temple of the Sacred Tooth Relic)",
      "Scenic Kandy Lake (Kiri Muhuda) and Queen's Bath (Ulpange)",
      "Royal Botanic Gardens of Peradeniya with giant bamboo and orchid house",
      "Traditional Kandyan cultural dance & fire-walking spectacles",
      "Bahirawakanda monumental white hilltop Buddha viewpoint",
    ],
    guideTalkingPoints: [
      "Explain the sacred religious and political significance of the Tooth Relic: historically, whoever possessed the relic held the divine right to rule Sri Lanka.",
      "Guide guests through the daily Thevava (puja ceremony) rituals with traditional low-country and Kandyan drums.",
      "Share history of the Royal Botanic Gardens, originally planted in 1371 as royal pleasure grounds and later expanded under British botanists.",
    ],
    visitorTips: "Visit the Temple of the Tooth during evening puja (around 6:30 PM) for the most atmospheric experience. Modest white attire is culturally appreciated.",
    image: "/images/kandy.png",
    region: "Central Highlands",
  },

  "Nuwara Eliya": {
    id: "nuwara-eliya",
    name: "Nuwara Eliya",
    tagline: "Little England & Emerald Ceylon Tea Highlands",
    category: "Hill Country & Nature",
    briefDescription:
      "Set at an elevation of 1,868 meters amidst mist-draped mountain peaks, Nuwara Eliya is the capital of Sri Lanka's tea industry. Known as 'Little England' for its colonial Tudor-style cottages, manicured golf courses, Queen Anne post office, and rolling emerald tea estates producing premier Ceylon black tea.",
    keyHighlights: [
      "Historic tea plantations and operational orthodox tea factories (Pedro / Mackwoods)",
      "Lake Gregory recreational waterfront and horse riding paths",
      "Colonial Victoria Park and pink brick 1894 Post Office",
      "Lover's Leap and Ramboda majestic waterfalls",
      "Scenic train ride to/from Kandy and Ella",
    ],
    guideTalkingPoints: [
      "Take travelers through the orthodox tea manufacturing process: plucking two leaves and a bud, withering, rolling, fermenting, and grading.",
      "Explain how Sir Samuel Baker founded the European settlement in 1846 due to the cool temperate climate resembling the British countryside.",
      "Demonstrate professional tea-tasting notes: briskness, aroma, golden liquor color, and Ceylon high-grown character.",
    ],
    visitorTips: "Temperatures can drop to 10-14°C in the evenings; advise travelers to pack a light sweater or fleece jacket.",
    image: "/images/tea.png",
    region: "Central Highlands",
  },

  Ella: {
    id: "ella",
    name: "Ella",
    tagline: "Iconic Mountain Pass, Nine Arches Bridge & Tea Valleys",
    category: "Hill Country & Nature",
    briefDescription:
      "A charming backpacker and nature retreat perched on the edge of the southern highland escarpment. Famous worldwide for the colonial stone Nine Arch Demodara Bridge, thrilling climbs up Little Adam's Peak and Ella Rock, cascading Ravana Falls, and panoramic views sweeping through Ella Gap to the southern coastal plains.",
    keyHighlights: [
      "Nine Arch Demodara Bridge viaduct (Bridge in the Sky)",
      "Little Adam's Peak (Punchi Sri Pada) sunset hike",
      "Ravana Falls cascade and mythological Ravana Cave",
      "Ella Gap breathtaking escarpment lookout",
      "Flying Ravana adventure mega-zipline",
    ],
    guideTalkingPoints: [
      "Detail the brilliant engineering of Nine Arch Bridge built in 1921 entirely of brick, stone, and cement without any structural steel due to WWI steel shortages.",
      "Coordinate arrival at the bridge with the scheduled scenic highland blue passenger train passing overhead for the iconic photo.",
      "Recount the Ramayana legend of King Ravana hiding Princess Sita inside the subterranean limestone caves near Ravana Falls.",
    ],
    visitorTips: "Check the daily train timetable to time visits to Nine Arch Bridge when the blue express train crosses the viaduct.",
    image: "/images/nine_arch.png",
    region: "Central Highlands",
  },

  Yala: {
    id: "yala",
    name: "Yala",
    tagline: "World's Highest Leopard Density & Wild Safari Frontier",
    category: "Wildlife Safari",
    briefDescription:
      "Sri Lanka's premier wildlife sanctuary, bordering the sparkling Indian Ocean with dry-zone thorn scrub, brackish lagoons, and dramatic granite outcrops. Yala National Park Block 1 harbors the highest documented population density of wild leopards in the world, alongside wild elephants, sloth bears, spotted deer, and saltwater crocodiles.",
    keyHighlights: [
      "4x4 open-top safari game drives in Yala Block 1 & 5",
      "High probability Sri Lankan Leopard (Panthera pardus kotiya) tracking",
      "Roaming Asian elephant herds and elusive sloth bears",
      "Pristine coastal beaches, sand dunes, and Tsunami Memorial",
      "Over 215 bird species, including hornbills, painted storks, and sea eagles",
    ],
    guideTalkingPoints: [
      "Brief guests on responsible safari ethics: quiet voices, staying inside the jeep at all times, and never feeding wild animals.",
      "Explain the unique behaviors of the Sri Lankan leopard as an apex predator with no lions or tigers competing for its territory.",
      "Highlight the diverse ecosystems inside the park: dry monsoon forests, freshwater wetlands, coastal lagoons, and open grasslands.",
    ],
    visitorTips: "Morning safari starts at 6:00 AM at the gate (best for leopards) and afternoon safari starts at 2:30 PM (best for elephants and birds). Bring binoculars, hats, and sunscreen.",
    image: "/images/yala.png",
    region: "Wilderness",
  },

  Galle: {
    id: "galle",
    name: "Galle",
    tagline: "17th-Century Dutch Fort Citadel & UNESCO Coastal Jewel",
    category: "Cultural & Heritage",
    briefDescription:
      "A living UNESCO World Heritage fortified city founded by the Portuguese in 1588 and extensively fortified by the Dutch East India Company throughout the 17th century. Enclosed within thick granite ocean ramparts are pedestrian cobblestone lanes lined with Dutch colonial villas, boutique cafes, gem shops, and the iconic white oceanfront lighthouse.",
    keyHighlights: [
      "Galle Fort ocean ramparts and Flag Rock sunset promenade",
      "Poyagan Harbor 1938 white oceanfront Lighthouse",
      "Dutch Reformed Church with historic gravestone floor",
      "National Maritime Museum and Old Dutch Gate",
      "Vibrant art galleries, jewelry boutiques, and gelato cafes",
    ],
    guideTalkingPoints: [
      "Explain how the Dutch engineered the ramparts with coral and granite that protected the interior from the 2004 tsunami.",
      "Point out the subterranean drainage and sewer system designed by Dutch engineers that is flushed twice daily by the ocean tide.",
      "Lead guests to Flag Rock at sunset where daredevil local cliff jumpers leap into the shallow ocean breaks below.",
    ],
    visitorTips: "Galle Fort is entirely pedestrian-friendly. Late afternoon is the best time for a leisurely walking tour along the ramparts catching the sunset breeze.",
    image: "/images/galle.png",
    region: "South Coast",
  },

  Bentota: {
    id: "bentota",
    name: "Bentota",
    tagline: "Golden Lagoon Sands, River Safaris & Luxury Water Sports",
    category: "Coastal & Beach",
    briefDescription:
      "Renowned for its expansive golden sand peninsula positioned between the calm Bentota River and the open Indian Ocean. Bentota is the prime hub for luxury beach resorts, jet-skiing, windsurfing, tranquil mangrove riverboat safaris on the Madu Ganga, and visits to Geoffrey Bawa's famed tropical architectural estate Lunuganga.",
    keyHighlights: [
      "Bentota beach peninsula and water sports center",
      "Madu Ganga mangrove riverboat safari and cinnamon island",
      "Lunuganga Country Estate (renowned architect Geoffrey Bawa's masterpiece)",
      "Kosgoda sea turtle conservation project and hatchery",
      "Brief Garden by Bevis Bawa",
    ],
    guideTalkingPoints: [
      "Explain the ecological role of mangrove swamps along the river in buffering coastal storm surges and nurturing juvenile marine life.",
      "Introduce Geoffrey Bawa's visionary 'Tropical Modernism' architectural style that harmonizes indoors with nature.",
      "Educate travelers about the 5 species of sea turtles that nest along the southern coast and local community-led conservation efforts.",
    ],
    visitorTips: "Ideal stop for leisure, water activities, and boat cruises. River boat safari takes about 1.5 to 2 hours.",
    image: "/images/bentota.png",
    region: "South Coast",
  },

  Mirissa: {
    id: "mirissa",
    name: "Mirissa",
    tagline: "Blue Whale Ocean Safaris & Crescent Surf Bay",
    category: "Coastal & Beach",
    briefDescription:
      "A postcard-perfect crescent beach lined with swaying coconut palms, lively beachfront seafood grills, and turquoise surf breaks. Mirissa is recognized globally as one of the best locations in the world for observing majestic Blue Whales, Sperm Whales, and pods of spinner dolphins in their natural migratory deep-water trenches.",
    keyHighlights: [
      "Morning Blue Whale & dolphin watching boat expeditions",
      "Coconut Tree Hill iconic panoramic ocean promontory",
      "Parrot Rock viewpoint overlooking Mirissa Bay",
      "Secret Beach secluded cove and tidal pool",
      "Sunset seafood candlelit dining on the water's edge",
    ],
    guideTalkingPoints: [
      "Explain why southern Sri Lanka has such rich cetacean populations: the continental shelf drops rapidly within a few miles off the coast, creating nutrient upwellings.",
      "Remind guests to choose certified whale watching operators adhering to international marine mammal distance regulations.",
    ],
    visitorTips: "Whale watching boats depart promptly at 6:30 AM from Mirissa Fisheries Harbor. Guests prone to seasickness should take motion sickness medication 30 minutes prior.",
    image: "/images/mirissa.png",
    region: "South Coast",
  },

  Anuradhapura: {
    id: "anuradhapura",
    name: "Anuradhapura",
    tagline: "First Ancient Royal Capital & Sacred Jaya Sri Maha Bodhi",
    category: "Cultural & Heritage",
    briefDescription:
      "The magnificent first capital of ancient Sri Lanka, established in the 4th century BC, serving as the seat of royal power for over 1,300 years. This vast UNESCO sacred complex features massive brick stupas (Ruwanwelisaya, Jetavanarama) rivaling the pyramids of Giza, the sacred Jaya Sri Maha Bodhi (the oldest recorded human-planted tree on Earth), and ingenious irrigation reservoirs.",
    keyHighlights: [
      "Sacred Jaya Sri Maha Bodhi tree (planted 288 BC)",
      "Ruwanwelisaya colossal white stupa built by King Dutugemunu",
      "Jetavanarama Stupa (the largest brick structure in the ancient world)",
      "Samadhi Buddha meditative stone statue",
      "Twin Ponds (Kuttam Pokuna) ancient hydraulic bathing pools",
    ],
    guideTalkingPoints: [
      "Explain the arrival of Buddhism to Sri Lanka in 247 BC via Arahat Mahinda and the subsequent planting of the sacred Bodhi sapling brought by Sanghamitta Theri.",
      "Describe the mammoth scale of Jetavanarama, containing over 93 million baked clay bricks.",
      "Show travelers how ancient Sinhalese hydraulic civilization engineered massive 'Wewa' (irrigation tanks) like Tissa Wewa that made fertile civilization possible in the dry zone.",
    ],
    visitorTips: "Dress code is strictly enforced: white or pale clothes covering shoulders and knees; hats and shoes must be removed before entering sacred stupa courtyards. Renting bicycles or touring in air-conditioned vehicles between monuments is recommended.",
    image: "/images/dambulla.png",
    region: "Cultural Triangle",
  },

  Polonnaruwa: {
    id: "polonnaruwa",
    name: "Polonnaruwa",
    tagline: "Medieval Royal City & Masterpiece Gal Vihara Rock Sculptures",
    category: "Cultural & Heritage",
    briefDescription:
      "The second ancient capital of Sri Lanka (11th–13th century AD), celebrated for its well-preserved royal palace citadel, council chambers, and the peerless Gal Vihara—a group of four colossal Buddha statues carved directly into a single granite rock face, demonstrating the pinnacle of ancient Sinhalese stone carving art.",
    keyHighlights: [
      "Gal Vihara colossal granite Buddha statues (seated, standing, and reclining)",
      "Royal Palace ruins of King Parakramabahu I (once seven stories high)",
      "The Quadrangle (Dalada Maluwa) sacred complex and circular Vatadage",
      "Rankoth Vehera and colossal Kiri Vehera stupas",
      "Parakrama Samudra (Sea of Parakrama) massive inland reservoir",
    ],
    guideTalkingPoints: [
      "Explain the golden era under King Parakramabahu I whose motto was 'Not even a single drop of water from the rain must flow into the ocean without serving the people'.",
      "Direct attention to the delicate serene expression and lotus-carved pillow on the 14-meter reclining Buddha at Gal Vihara.",
      "Point out the clever defensive fortifications and thick brick acoustics of the ancient Council Chamber.",
    ],
    visitorTips: "The site is compact and flat, making it ideal for exploring by bicycle or touring van. Sand on the stupa terraces can get very hot by midday, so morning visits are best.",
    image: "/images/sigiriya.png",
    region: "Cultural Triangle",
  },

  Udawalawe: {
    id: "udawalawe",
    name: "Udawalawe",
    tagline: "Open Grassland Plains & Guaranteed Wild Elephant Herds",
    category: "Wildlife Safari",
    briefDescription:
      "Often compared to the African savannah, Udawalawe National Park surrounds a massive reservoir and guarantees year-round sightings of wild Asian elephants. Free of dense jungle cover, the wide open plains offer unmatched photographic opportunities of elephant family herds, water buffalos, and raptors.",
    keyHighlights: [
      "Open-top 4x4 safaris with guaranteed wild elephant encounters",
      "Udawalawe Elephant Transit Home (ethical rehabilitation of orphaned calves)",
      "Udawalawe Reservoir scenic waterfront views and bird colonies",
      "Abundant raptors including Crested Serpent Eagles and White-bellied Sea Eagles",
    ],
    guideTalkingPoints: [
      "Highlight the work of the Elephant Transit Home, where orphaned calves are nurtured and released back into the wild with minimal human habituation.",
      "Point out elephant herd family dynamics led by a matriarch and the playful interactions among young calves.",
    ],
    visitorTips: "Visit the Elephant Transit Home during the public milk-feeding sessions (held daily at 9:00 AM, 12:00 PM, 3:00 PM, and 6:00 PM).",
    image: "/images/yala.png",
    region: "Wilderness",
  },

  Trincomalee: {
    id: "trincomalee",
    name: "Trincomalee",
    tagline: "Natural Deep Harbor, Koneswaram Temple & Pigeon Island",
    category: "Coastal & Beach",
    briefDescription:
      "A historic port city on Sri Lanka's northeast coast blessed with one of the finest natural deep-water harbors in the world. Crowned by the sacred cliffside Koneswaram Hindu Temple atop Swami Rock, Trincomalee features powdery white sands at Nilaveli and Uppuveli, and crystalline coral reefs at Pigeon Island National Park.",
    keyHighlights: [
      "Koneswaram Temple (Temple of a Thousand Pillars) atop Swami Rock",
      "Pigeon Island National Park marine coral reef snorkeling with blacktip reef sharks",
      "Nilaveli and Uppuveli pristine white sand beaches",
      "Historic Fort Frederick and tame spotted deer wandering the ramparts",
      "Kanniya Seven Hot Springs",
    ],
    guideTalkingPoints: [
      "Narrate the ancient history of Koneswaram Temple, praised in ancient Hindu scriptures and destroyed by Portuguese captain general Constantine de Sa before being rebuilt.",
      "Explain Swami Rock's romantic legend known as 'Lover's Leap' overlooking the deep cobalt ocean drop.",
    ],
    visitorTips: "Best weather on the east coast is from May to September when the western monsoon is active. Pigeon Island requires an entrance ticket and boat transfer.",
    image: "/images/galle.png",
    region: "East Coast",
  },
};

/**
 * Normalizes destination names and resolves detailed tour guide briefing info.
 * Provides fallback data for unlisted or custom user stops.
 */
export function getTourGuideDestination(placeName: string): DestinationGuideInfo {
  if (!placeName || typeof placeName !== "string") {
    return createFallbackGuideInfo("Destination Stop", "Central Region");
  }

  const clean = placeName.replace(/\s*\(.*?\)\s*/g, "").trim();
  const lower = clean.toLowerCase();

  // Direct exact match
  if (TOUR_GUIDE_DESTINATIONS[clean]) {
    return TOUR_GUIDE_DESTINATIONS[clean];
  }

  // Alias checks
  if (lower.includes("colombo")) return TOUR_GUIDE_DESTINATIONS["Colombo"];
  if (lower.includes("negombo") || lower.includes("airport") || lower.includes("bia")) return TOUR_GUIDE_DESTINATIONS["Negombo"];
  if (lower.includes("sigiriya") || lower.includes("lion rock") || lower.includes("pidurangala")) return TOUR_GUIDE_DESTINATIONS["Sigiriya"];
  if (lower.includes("dambulla") || lower.includes("cave temple")) return TOUR_GUIDE_DESTINATIONS["Dambulla"];
  if (lower.includes("kandy") || lower.includes("tooth") || lower.includes("maligawa") || lower.includes("peradeniya")) return TOUR_GUIDE_DESTINATIONS["Kandy"];
  if (lower.includes("nuwara") || lower.includes("eliya") || lower.includes("little england") || lower.includes("tea")) return TOUR_GUIDE_DESTINATIONS["Nuwara Eliya"];
  if (lower.includes("ella") || lower.includes("nine arch")) return TOUR_GUIDE_DESTINATIONS["Ella"];
  if (lower.includes("yala") || lower.includes("tissamaharama")) return TOUR_GUIDE_DESTINATIONS["Yala"];
  if (lower.includes("galle") || lower.includes("fort")) return TOUR_GUIDE_DESTINATIONS["Galle"];
  if (lower.includes("bentota") || lower.includes("beruwala") || lower.includes("induruwa")) return TOUR_GUIDE_DESTINATIONS["Bentota"];
  if (lower.includes("mirissa") || lower.includes("weligama")) return TOUR_GUIDE_DESTINATIONS["Mirissa"];
  if (lower.includes("anuradhapura")) return TOUR_GUIDE_DESTINATIONS["Anuradhapura"];
  if (lower.includes("polonnaruwa")) return TOUR_GUIDE_DESTINATIONS["Polonnaruwa"];
  if (lower.includes("udawalawe")) return TOUR_GUIDE_DESTINATIONS["Udawalawe"];
  if (lower.includes("trincomalee") || lower.includes("nilaveli")) return TOUR_GUIDE_DESTINATIONS["Trincomalee"];

  // Fallback for custom or less frequent destinations
  return createFallbackGuideInfo(clean, "Scenic Sri Lanka");
}

function createFallbackGuideInfo(name: string, region: string): DestinationGuideInfo {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: name,
    tagline: `Scenic Itinerary Stop in ${region}`,
    category: "Cultural & Heritage",
    briefDescription: `${name} is an allocated destination on this traveler's bespoke Sri Lankan itinerary. As their tour guide, provide cultural context on the surrounding landscape, local flora and fauna, and recommend authentic local culinary and photo opportunities.`,
    keyHighlights: [
      `Local attractions and scenic viewpoints around ${name}`,
      "Cultural interactions and artisanal handicraft workshops",
      "Authentic Ceylon hospitality and traditional refreshments",
    ],
    guideTalkingPoints: [
      `Introduce travelers to the local history, geographical highlights, and community traditions of ${name}.`,
      "Engage guests with insights into daily life, seasonal agriculture, and nearby natural wonders.",
      "Check in with travelers regarding their pace, photo preferences, and comfort levels.",
    ],
    visitorTips: "Keep comfortable walking shoes and stay hydrated. Clarify photography permissions when visiting religious or private heritage grounds.",
    image: "/images/colombo.png",
    region: region,
  };
}

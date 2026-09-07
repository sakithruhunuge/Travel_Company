/**
 * AI Place Photo Resolver for Sri Lanka Travel Company
 *
 * Automatically resolves place-specific, high-definition AI-generated imagery
 * for Key Attractions whenever a correct photo is not found in the database.
 */

// Scraped Unsplash IDs that represent generic hotel bedrooms/pools rather than the attractions
const GENERIC_SCRAPED_HOTEL_IMAGE_PATTERNS = [
  "photo-1564501049412",
  "photo-1542314831068",
  "photo-1578575437130",
  "photo-1520250497591",
  "photo-1571003123894",
  "photo-1566073771259",
  "photo-1590490360182",
  "photo-1589182373726",
  "photo-1588258524675",
  "photo-1580618672591",
  "photo-1582719508461",
  "photo-1571896349842",
  "photo-1596394516093",
];

/**
 * Validates whether a given URL is a real, correct photo of the attraction
 * from the database, or an invalid/broken/scraped generic placeholder.
 */
export function isCorrectDatabasePhoto(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  if (!clean) return false;

  // Broken or redirect Google photos links
  if (clean.includes("photos.app.goo.gl")) return false;

  // Known scraped placeholder hotel stock images
  if (GENERIC_SCRAPED_HOTEL_IMAGE_PATTERNS.some((pattern) => clean.includes(pattern))) {
    return false;
  }

  // Generic fallback city photos used when no place photo was available
  if (clean === "/images/colombo.png") return false;

  return true;
}

/**
 * Resolves a dedicated AI-generated photo specifically crafted for the given place.
 */
export function getAiPhotoForPlace(
  name: string = "",
  city: string = "",
  description: string = ""
): string {
  const text = `${name} ${city} ${description}`.toLowerCase();

  // 1. Temple of the Sacred Tooth Relic (Dalada Maligawa, Kandy)
  if (
    text.includes("tooth") ||
    text.includes("maligawa") ||
    text.includes("dalada") ||
    text.includes("malwathu") ||
    text.includes("asgiri")
  ) {
    return "/maliga.png";
  }

  // 2. Sigiriya Ancient Rock Fortress / Pidurangala
  if (text.includes("sigiriya") || text.includes("lion rock") || text.includes("pidurangala")) {
    return "/sigiri.png";
  }

  // 3. Yala Safari, Wildlife, Leopards, National Parks
  if (
    text.includes("yala") ||
    text.includes("safari") ||
    text.includes("leopard") ||
    text.includes("cheetah") ||
    text.includes("wilpattu") ||
    text.includes("udawalawe") ||
    text.includes("minneriya") ||
    text.includes("kumana") ||
    text.includes("wildlife")
  ) {
    return "/chita.png";
  }

  // 4. Ella & Nine Arch Bridge, Little Adam's Peak, Demodara
  if (
    text.includes("nine arch") ||
    text.includes("demodara") ||
    text.includes("ella") ||
    text.includes("little adam")
  ) {
    return "/ella.png";
  }

  // 5. Mirissa Beach, Weligama, Coconut Tree Hill, Secret Beach, Coastal
  if (
    text.includes("mirissa") ||
    text.includes("coconut tree") ||
    text.includes("secret beach") ||
    text.includes("weligama") ||
    text.includes("whale")
  ) {
    return "/miris.png";
  }

  // 6. Sacred Temples, Cave Temples, Buddha Rock Statues (Dambulla, Sithulpawwa, Aukana, Viharas, Kovils)
  if (
    text.includes("dambulla") ||
    text.includes("cave temple") ||
    text.includes("rock temple") ||
    text.includes("sithulpawwa") ||
    text.includes("aukana") ||
    text.includes("bahirawakanda") ||
    text.includes("gangaramaya") ||
    text.includes("bodhiraja") ||
    text.includes("viharaya") ||
    text.includes("vihara") ||
    text.includes("kovil") ||
    text.includes("pansala") ||
    text.includes("dagoba") ||
    text.includes("pagoda") ||
    text.includes("stupa") ||
    text.includes("statue") ||
    text.includes("temple") ||
    text.includes("pirivena")
  ) {
    return "/pilima.png";
  }

  // 7. Tea Plantations, Nuwara Eliya, Pedro, Mackwoods
  if (
    text.includes("tea") ||
    text.includes("nuwara eliya") ||
    text.includes("plantation") ||
    text.includes("estate") ||
    text.includes("pedro") ||
    text.includes("mackwood") ||
    text.includes("horton")
  ) {
    return "/tea.png";
  }

  // 8. Colombo City Skyline, Galle Face, Lotus Tower, Museums
  if (
    text.includes("lotus tower") ||
    text.includes("galle face") ||
    text.includes("colombo") ||
    text.includes("pettah") ||
    text.includes("colpetty") ||
    text.includes("slave island")
  ) {
    return "/col.png";
  }

  // 9. Galle Fort, Dutch Fort, Lighthouse, Ramparts
  if (
    text.includes("galle fort") ||
    text.includes("dutch fort") ||
    text.includes("galle") ||
    text.includes("lighthouse") ||
    text.includes("unawatuna")
  ) {
    return "/images/galle.png";
  }

  // 10. Bentota Beach, River Safari, Madu Ganga, Water Sports
  if (
    text.includes("bentota") ||
    text.includes("madu") ||
    text.includes("river safari") ||
    text.includes("turtle")
  ) {
    return "/images/bentota.png";
  }

  // 11. Botanical Gardens, Parks, Nature Reserves
  if (
    text.includes("botanical") ||
    text.includes("peradeniya") ||
    text.includes("garden") ||
    text.includes("park") ||
    text.includes("forest") ||
    text.includes("nature")
  ) {
    return "/sri3.png";
  }

  // 12. Ancient Kingdoms, Ruins, Anuradhapura, Polonnaruwa
  if (
    text.includes("anuradhapura") ||
    text.includes("polonnaruwa") ||
    text.includes("ruins") ||
    text.includes("ancient")
  ) {
    return "/sri.png";
  }

  // 13. General Scenic Sri Lanka Landmark AI photo fallback
  return "/sri2.png";
}

export interface ResolvedPoiPhoto {
  photoUrl: string;
  isAiGenerated: boolean;
  fallbackAiUrl: string;
}

/**
 * Resolves the primary photo to display for a POI card.
 * If the database photo is missing, broken, or a scraped hotel stock image,
 * returns the AI-generated photo matching that place.
 */
export function resolvePoiPhoto(
  poi: {
    id?: string | number;
    name?: string;
    primary_image?: string | null;
    description?: string;
    is_ai_generated?: boolean;
  },
  city: string = "",
  isFailed: boolean = false
): ResolvedPoiPhoto {
  const placeName = poi.name || "Cultural Landmark";
  const fallbackAiUrl = getAiPhotoForPlace(placeName, city, poi.description);

  // If marked explicitly as AI generated by backend
  if (poi.is_ai_generated) {
    return {
      photoUrl: poi.primary_image || fallbackAiUrl,
      isAiGenerated: true,
      fallbackAiUrl,
    };
  }

  // If the image failed to load or is not a correct database photo of this place
  if (isFailed || !isCorrectDatabasePhoto(poi.primary_image)) {
    return {
      photoUrl: fallbackAiUrl,
      isAiGenerated: true,
      fallbackAiUrl,
    };
  }

  // Valid non-placeholder database photo
  return {
    photoUrl: poi.primary_image as string,
    isAiGenerated: false,
    fallbackAiUrl,
  };
}

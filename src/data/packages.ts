import { sriLankaImages } from "@/constants/sriLankaImages";

export interface TravelPackage {
  id: string;
  name: string;
  duration: string;
  destinations: string[];
  includes: string[];
  image: string;
  priceRange: string;
  rating: string;
}

export const sriLankaPackages: TravelPackage[] = [
  {
    id: "cultural-triangle",
    name: "Cultural Triangle Explorer",
    duration: "5 Days",
    destinations: ["Sigiriya", "Dambulla", "Kandy", "Polonnaruwa"],
    includes: ["Hotel accommodation", "Private transport", "Breakfast", "English-speaking guide"],
    image: sriLankaImages.packages.culturalTriangle.coverUrl,
    priceRange: "$450 - $600",
    rating: "4.9",
  },
  {
    id: "southern-beach",
    name: "Southern Beach Escape",
    duration: "5 Days",
    destinations: ["Galle", "Mirissa", "Unawatuna", "Bentota"],
    includes: ["Beach hotels", "Airport pickup", "Breakfast", "Transportation"],
    image: sriLankaImages.packages.southernBeach.coverUrl,
    priceRange: "$500 - $700",
    rating: "4.8",
  },
  {
    id: "hill-country",
    name: "Hill Country Adventure",
    duration: "6 Days",
    destinations: ["Kandy", "Nuwara Eliya", "Ella", "Horton Plains"],
    includes: ["Scenic train journey", "Hotel accommodation", "Transportation", "Guide"],
    image: sriLankaImages.packages.hillCountry.coverUrl,
    priceRange: "$550 - $750",
    rating: "5.0",
  },
  {
    id: "wildlife-safari",
    name: "Wildlife Safari Experience",
    duration: "4 Days",
    destinations: ["Yala National Park", "Udawalawe", "Bundala"],
    includes: ["Safari jeep", "Hotels", "Transportation", "Breakfast"],
    image: sriLankaImages.packages.wildlifeSafari.coverUrl,
    priceRange: "$400 - $550",
    rating: "4.7",
  },
  {
    id: "grand-tour",
    name: "Sri Lanka Grand Tour",
    duration: "10 Days",
    destinations: ["Colombo", "Sigiriya", "Kandy", "Nuwara Eliya", "Ella", "Yala", "Mirissa", "Galle"],
    includes: ["Premium hotels", "Airport transfers", "Private vehicle", "Guide", "Breakfast"],
    image: sriLankaImages.packages.grandTour.coverUrl,
    priceRange: "$1200 - $1600",
    rating: "4.95",
  },
];

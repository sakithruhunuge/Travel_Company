export interface DestinationPhoto {
  title: string;
  imageUrl: string;
  imageCredit: string;
  source: string;
}

export interface PackagePhoto {
  coverUrl: string;
  gallery: string[];
  caption: string;
}

export const sriLankaImages = {
  hero: {
    title: "Sigiriya Rock Fortress Aerial View",
    imageUrl: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=1920&q=80",
    imageCredit: "Arian Zwegers",
    source: "Unsplash",
  },
  destinations: [
    {
      title: "Sigiriya Rock Fortress",
      imageUrl: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Dylan Shaw",
      source: "Unsplash",
    },
    {
      title: "Dambulla Cave Temple",
      imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Oliver Withagen",
      source: "Unsplash",
    },
    {
      title: "Temple of the Tooth in Kandy",
      imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Hasitha Tudugala",
      source: "Unsplash",
    },
    {
      title: "Nuwara Eliya Tea Plantations",
      imageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Egor Myznik",
      source: "Unsplash",
    },
    {
      title: "Nine Arches Bridge, Ella",
      imageUrl: "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Yves Alarie",
      source: "Unsplash",
    },
    {
      title: "Yala National Park Safari",
      imageUrl: "https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Ronald Koppel",
      source: "Unsplash",
    },
    {
      title: "Mirissa Beach",
      imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Cody Board",
      source: "Unsplash",
    },
    {
      title: "Galle Fort",
      imageUrl: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Arian Zwegers",
      source: "Unsplash",
    },
    {
      title: "Bentota Beach",
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Simon English",
      source: "Unsplash",
    },
    {
      title: "Colombo Skyline",
      imageUrl: "https://images.unsplash.com/photo-1568849676085-51415703900f?auto=format&fit=crop&w=800&q=80",
      imageCredit: "Sacha Styles",
      source: "Unsplash",
    },
  ] as DestinationPhoto[],
  packages: {
    culturalTriangle: {
      coverUrl: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
      ],
      caption: "Explore ancient cities, temples, and rock fortresses.",
    },
    southernBeach: {
      coverUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      ],
      caption: "Relax on golden sand shores and watch coastal marine life.",
    },
    hillCountry: {
      coverUrl: "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
      ],
      caption: "Travel by train through emerald hills and misty tea valleys.",
    },
    wildlifeSafari: {
      coverUrl: "https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=800&q=80",
      ],
      caption: "Encounter leopards, elephants, and rare bird species.",
    },
    grandTour: {
      coverUrl: "https://images.unsplash.com/photo-1568849676085-51415703900f?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80",
      ],
      caption: "The ultimate 10-day loop of the entire island paradise.",
    },
  } as Record<string, PackagePhoto>,
  testimonials: {
    ellaTrain: "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80",
    sigiriyaHike: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80",
    southernBeaches: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    yalaSafari: "https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=800&q=80",
  },
};

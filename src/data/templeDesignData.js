export const templeStylesData = [
  {
    id: "dravidian",
    name: "Dravidian temple style",
    era: "South India",
    origin: "Seen across many regions and periods",
    description: "A broad family of South Indian temple designs, often recognised by tiered towers, sculpted details and columned halls. Each temple reflects its own place, period and community.",
    keyFeatures: [
      "A sanctum with a tower above it",
      "Carved stone or plaster details",
      "Halls and pathways around the sanctum",
      "Materials and decoration shaped by local practice"
    ],
    canonicalText: "Mayamata & Manasara are traditional design references",
    stonePreference: "Stone and other materials vary by place"
  },
  {
    id: "chola",
    name: "Chola-period temples",
    era: "Chola period",
    origin: "Examples include Thanjavur and Darasuram",
    description: "Temples from the Chola period are known for carefully composed stone architecture. Their layouts and details vary; historic examples can be useful references when discussing a new design.",
    keyFeatures: [
      "Prominent sanctum towers at some sites",
      "Stone sculpture and inscriptions",
      "Courtyards and connected temple spaces",
      "Details that reflect the place and period"
    ],
    canonicalText: "Historic temples are useful design references",
    stonePreference: "Stone choices vary by temple and location"
  },
  {
    id: "pandya",
    name: "Pandya-period temples",
    era: "Pandya period",
    origin: "Examples across Madurai and Tirunelveli regions",
    description: "Pandya-period temple sites include gateways, courtyards and richly detailed stonework. The arrangement differs from one temple to another and developed over time.",
    keyFeatures: [
      "Gateway towers at many temple entrances",
      "Carved stone architectural details",
      "Courtyards and circumambulatory paths",
      "Designs shaped by local history"
    ],
    canonicalText: "Local temple examples and traditions guide the discussion",
    stonePreference: "Materials vary by site"
  },
  {
    id: "vijayanagara",
    name: "Vijayanagara & Nayaka temples",
    era: "Vijayanagara and Nayaka periods",
    origin: "Examples include Hampi and Madurai",
    description: "Temples from these periods are often associated with large columned halls and elaborate sculpture. The form and decoration depend on the individual site.",
    keyFeatures: [
      "Columned halls for gatherings",
      "Sculpted pillars and brackets",
      "Carved stone ceilings and details",
      "Spaces shaped for worship and community use"
    ],
    canonicalText: "Historic buildings offer examples, not a single fixed template",
    stonePreference: "Materials vary by region and building"
  }
];

export const templeAnatomyData = [
  {
    id: "gopuram",
    name: "Gopuram (gateway tower)",
    role: "Entrance tower",
    meaning: "A tower commonly built over an entrance to a South Indian temple. Its form and decoration depend on the temple and local tradition.",
    geometry: "Often built in a tiered form above the gateway.",
    materials: "Materials vary. Some examples combine a stone base with plastered upper levels.",
    significance: "Helps mark the entrance and creates a transition into the temple spaces.",
    hotspot: { x: "28%", y: "35%" }
  },
  {
    id: "vimana",
    name: "Vimana (sanctum tower)",
    role: "Tower above the sanctum",
    meaning: "The tower built above the inner sanctum in many South Indian temple styles.",
    geometry: "Its shape and number of tiers vary by region, period and temple.",
    materials: "Materials depend on the design, local practice and project.",
    significance: "A prominent part of the temple's design above the sanctum.",
    hotspot: { x: "72%", y: "24%" }
  },
  {
    id: "garbhagriha",
    name: "Garbhagriha (inner sanctum)",
    role: "Inner shrine",
    meaning: "The central shrine where the principal deity is placed.",
    geometry: "Often a compact, enclosed space. The design follows the requirements of the temple and its tradition.",
    materials: "Materials vary by site and design.",
    significance: "The inner focus of worship in the temple.",
    hotspot: { x: "72%", y: "68%" }
  },
  {
    id: "mandapam",
    name: "Mandapam (hall)",
    role: "Pillared hall",
    meaning: "A covered space used for gathering, ceremonies or other temple activities.",
    geometry: "May be square or rectangular, with the layout arranged around its intended use.",
    materials: "Stone, wood and other materials may be used depending on the design.",
    significance: "Provides space for people to gather within the temple.",
    hotspot: { x: "52%", y: "62%" }
  },
  {
    id: "prakaram",
    name: "Prakaram (courtyard path)",
    role: "Courtyard or surrounding path",
    meaning: "An open or covered area around temple spaces. Some temples include paths for walking around the shrine.",
    geometry: "The layout follows the shape and arrangement of the temple site.",
    materials: "Surfaces and finishes vary by site.",
    significance: "Connects different areas and supports movement through the temple.",
    hotspot: { x: "42%", y: "82%" }
  },
  {
    id: "dhwajastambha",
    name: "Dhwajastambha (flagstaff)",
    role: "Temple flagstaff",
    meaning: "A flagstaff placed in some temples, often along the approach to the main shrine.",
    geometry: "Its position and form depend on the temple layout and practice.",
    materials: "Materials and coverings vary by temple.",
    significance: "A recognisable feature in the approach to the shrine at some temples.",
    hotspot: { x: "36%", y: "58%" }
  }
];

export type ImpressionStatus =
  | "On-going"
  | "New"
  | "Graduated"
  | "Terminated"
  | "Withdrawn"
  | "Completed";

export type ImpressionType =
  | "SETUP"
  | "Roll-out"
  | "TAPI-assisted"
  | "GIA (Community Based)"
  | "GIA (Region-initiated Projects) Internally Funded"
  | "GIA (Region-initiated Projects) Externally Funded"
  | "CEST";

export type ImpressionSector =
  | "Food Processing"
  | "Furniture"
  | "Gifts / Decors / Handicrafts"
  | "Metals & Engineering"
  | "Agriculture / Marine / Aquaculture / Forestry / Livestock"
  | "Health & Wellness Products"
  | "ICT"
  | "Other Regional Industry Priorities";

export type MarinduqueMunicipality =
  | "Boac"
  | "Mogpog"
  | "Gasan"
  | "Buenavista"
  | "Santa Cruz"
  | "Torrijos";

export type ImpressionProject = {
  code: string;
  title: string;
  description: string;
  type: ImpressionType;
  year: number;
  beneficiary: string;
  sector: ImpressionSector;
  municipality: MarinduqueMunicipality;
  status: ImpressionStatus;
  cost: number;
  implementor: string;
  latitude: number;
  longitude: number;
};

export const MUNICIPALITY_COORDS: Record<
  MarinduqueMunicipality,
  { lat: number; lng: number }
> = {
  Boac: { lat: 13.4463, lng: 121.839 },
  Mogpog: { lat: 13.4746, lng: 121.8637 },
  Gasan: { lat: 13.3235, lng: 121.8676 },
  Buenavista: { lat: 13.2544, lng: 121.933 },
  "Santa Cruz": { lat: 13.479, lng: 122.028 },
  Torrijos: { lat: 13.32, lng: 122.084 },
};

export const PROVINCE_NAME = "Marinduque";
export const REGION_NAME = "Region IV-B (MIMAROPA)";
export const IMPLEMENTOR = "PSTO-MARINDUQUE";

export const IMPRESSION_TYPES: ImpressionType[] = [
  "SETUP",
  "Roll-out",
  "TAPI-assisted",
  "GIA (Community Based)",
  "GIA (Region-initiated Projects) Internally Funded",
  "GIA (Region-initiated Projects) Externally Funded",
  "CEST",
];

export const IMPRESSION_STATUSES: ImpressionStatus[] = [
  "On-going",
  "New",
  "Graduated",
  "Terminated",
  "Withdrawn",
  "Completed",
];

export const IMPRESSION_SECTORS: ImpressionSector[] = [
  "Food Processing",
  "Furniture",
  "Gifts / Decors / Handicrafts",
  "Metals & Engineering",
  "Agriculture / Marine / Aquaculture / Forestry / Livestock",
  "Health & Wellness Products",
  "ICT",
  "Other Regional Industry Priorities",
];

export const MARINDUQUE_MUNICIPALITIES: MarinduqueMunicipality[] = [
  "Boac",
  "Mogpog",
  "Gasan",
  "Buenavista",
  "Santa Cruz",
  "Torrijos",
];

export const formatPeso = (n: number) =>
  "PHP " +
  new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const RAW_PROJECTS: Omit<ImpressionProject, "latitude" | "longitude">[] = [
  {
    code: "24-4B-04-01-045",
    title:
      "Productivity Improvement of Boac Delicacies Producers Association through Acquisition of Vacuum Frying and Sealing Equipment",
    description:
      "Provision of vacuum frying and vacuum sealing machines to increase output, extend shelf life, and improve packaging of Boac's traditional delicacies for wider market reach.",
    type: "SETUP",
    year: 2024,
    beneficiary: "Boac Delicacies Producers Association",
    sector: "Food Processing",
    municipality: "Boac",
    status: "On-going",
    cost: 1_850_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "23-GIA-MAR-04-018",
    title:
      "Upland Farming Support: Provision of Climate-Smart Agriculture Kits for Balimbing Farmers Cooperative",
    description:
      "Distribution of climate-smart farming kits, soil health tools, and training to help upland farmers adapt to changing weather and raise crop yields.",
    type: "GIA (Community Based)",
    year: 2023,
    beneficiary: "Balimbing Farmers Cooperative",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    municipality: "Boac",
    status: "On-going",
    cost: 2_300_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "22-4B-04-02-031",
    title:
      "Enhancement of the Coco Coir Processing Facility of Mogpog Coconut Farmers Association",
    description:
      "Upgrading of decorticating and twining equipment to convert coconut husk waste into coir products, adding value and creating rural jobs.",
    type: "SETUP",
    year: 2022,
    beneficiary: "Mogpog Coconut Farmers Association",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    municipality: "Mogpog",
    status: "Graduated",
    cost: 3_100_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "STARBOOKS-MAR-2023-006",
    title:
      "Deployment of STARBOOKS Science Learning Hub at Torrijos Central School",
    description:
      "Installation of the DOST STARBOOKS offline science digital library to give students and teachers access to STEM learning resources without internet.",
    type: "Roll-out",
    year: 2023,
    beneficiary: "DepEd Marinduque - Torrijos District",
    sector: "ICT",
    municipality: "Torrijos",
    status: "Completed",
    cost: 850_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "24-GIA-MAR-04-052",
    title:
      "Community Empowerment through Science and Technology (CEST) for Gasan Coastal Barangays",
    description:
      "Convergence of S&T interventions in livelihood, health, education, and disaster resilience for identified poor coastal barangays in Gasan.",
    type: "CEST",
    year: 2024,
    beneficiary: "Gasan Municipal Government",
    sector: "Other Regional Industry Priorities",
    municipality: "Gasan",
    status: "On-going",
    cost: 4_200_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "21-4B-04-03-022",
    title:
      "Technology Upgrading of Buenavista Furniture Makers through Modern Woodworking Machinery",
    description:
      "Acquisition of modern woodworking and finishing machinery to improve product quality, safety, and production capacity of local furniture makers.",
    type: "SETUP",
    year: 2021,
    beneficiary: "Buenavista Furniture Makers Association",
    sector: "Furniture",
    municipality: "Buenavista",
    status: "Completed",
    cost: 1_450_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "23-4B-04-05-039",
    title:
      "Process Improvement and Packaging Upgrade of Santa Cruz Cassava Chips Enterprise",
    description:
      "Provision of slicing, frying, and sealing equipment plus improved labeling to boost the productivity and marketability of cassava chips.",
    type: "SETUP",
    year: 2023,
    beneficiary: "Santa Cruz Cassava Chips Enterprise",
    sector: "Food Processing",
    municipality: "Santa Cruz",
    status: "On-going",
    cost: 980_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "20-4B-04-01-011",
    title:
      "Improvement of the Production Process of Marinduque Arrowroot (Uraro) Cookies Producers",
    description:
      "Modernization of arrowroot (uraro) cookie production with mixing, molding, and baking equipment to sustain this iconic Marinduque delicacy.",
    type: "SETUP",
    year: 2020,
    beneficiary: "Marinduque Arrowroot Producers Group",
    sector: "Food Processing",
    municipality: "Boac",
    status: "Graduated",
    cost: 1_200_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "22-GIA-MAR-04-027",
    title:
      "Provision of Solar-Powered Fish Drying Facility for Mogpog Fisherfolk Association",
    description:
      "Installation of a solar-powered fish dryer to reduce spoilage, improve dried-fish quality, and increase income for coastal fisherfolk.",
    type: "GIA (Community Based)",
    year: 2022,
    beneficiary: "Mogpog Fisherfolk Association",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    municipality: "Mogpog",
    status: "On-going",
    cost: 1_760_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "24-GIA-MAR-04-060",
    title:
      "Establishment of a Community-Based Aquaponics System in Gasan for Sustainable Vegetable Production",
    description:
      "Setup of an integrated aquaponics system combining fish culture and soilless vegetable growing for year-round, sustainable food production.",
    type: "GIA (Community Based)",
    year: 2024,
    beneficiary: "Gasan Vegetable Growers Cooperative",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    municipality: "Gasan",
    status: "New",
    cost: 520_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "19-4B-04-02-008",
    title:
      "Upgrading of the Metalcraft Production of Mogpog Blacksmiths through Improved Forging Equipment",
    description:
      "Provision of power hammers and forging tools to improve efficiency and safety of traditional blacksmiths producing bolos and farm implements.",
    type: "SETUP",
    year: 2019,
    beneficiary: "Mogpog Blacksmiths Association",
    sector: "Metals & Engineering",
    municipality: "Mogpog",
    status: "Terminated",
    cost: 2_050_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "23-GIA-MAR-04-041",
    title:
      "Herbal Processing and Health Products Development for Torrijos Rural Women's Association",
    description:
      "Training and equipment for processing local herbs into soaps, oils, and wellness products, creating income opportunities for rural women.",
    type: "GIA (Community Based)",
    year: 2023,
    beneficiary: "Torrijos Rural Women's Association",
    sector: "Health & Wellness Products",
    municipality: "Torrijos",
    status: "On-going",
    cost: 640_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "TAPI-MAR-2022-003",
    title:
      "TAPI-Assisted Invention Commercialization of a Low-Cost Copra Dryer by a Boac Inventor",
    description:
      "Support for prototyping and commercialization of a locally-invented low-cost copra dryer to help small coconut farmers dry produce efficiently.",
    type: "TAPI-assisted",
    year: 2022,
    beneficiary: "Local Inventor - Boac",
    sector: "Metals & Engineering",
    municipality: "Boac",
    status: "Completed",
    cost: 750_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "24-4B-04-04-055",
    title:
      "Acquisition of Modern Weaving Looms for Buenavista Handicrafts and Native Products Makers",
    description:
      "Provision of improved weaving looms and design training to raise the volume and quality of native woven handicrafts for gift and decor markets.",
    type: "SETUP",
    year: 2024,
    beneficiary: "Buenavista Handicrafts Makers Association",
    sector: "Gifts / Decors / Handicrafts",
    municipality: "Buenavista",
    status: "On-going",
    cost: 1_320_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "21-GIA-MAR-04-019",
    title:
      "Provision of Cold Storage Facility for the Santa Cruz Marine Products Traders",
    description:
      "Establishment of a cold storage and ice-making facility to preserve marine catch, reduce post-harvest losses, and stabilize traders' income.",
    type: "GIA (Community Based)",
    year: 2021,
    beneficiary: "Santa Cruz Marine Products Traders",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    municipality: "Santa Cruz",
    status: "Withdrawn",
    cost: 1_980_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "23-RIP-MAR-04-047",
    title:
      "Regional Science and Technology Week (RSTW) Provincial Celebration in Marinduque",
    description:
      "Provincial celebration of RSTW featuring technology exhibits, forums, and S&T promotion activities for students, MSMEs, and the community.",
    type: "GIA (Region-initiated Projects) Internally Funded",
    year: 2023,
    beneficiary: "Government Agencies, Academe, MSMEs, Students",
    sector: "Other Regional Industry Priorities",
    municipality: "Boac",
    status: "Completed",
    cost: 300_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "22-4B-04-01-034",
    title:
      "Establishment of a Shared Service Facility for Bakery Products in Boac Public Market",
    description:
      "Common bakery equipment facility that local bakers can share to lower production costs and standardize the quality of bread products.",
    type: "SETUP",
    year: 2022,
    beneficiary: "Boac Bakers Guild",
    sector: "Food Processing",
    municipality: "Boac",
    status: "On-going",
    cost: 2_600_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "20-GIA-MAR-04-015",
    title:
      "Livelihood Technology Transfer for Gasan Coco Sugar Producers Cooperative",
    description:
      "Transfer of coco sugar processing technology and equipment to the cooperative to produce high-value, health-oriented natural sweeteners.",
    type: "GIA (Community Based)",
    year: 2020,
    beneficiary: "Gasan Coco Sugar Producers Cooperative",
    sector: "Food Processing",
    municipality: "Gasan",
    status: "Graduated",
    cost: 890_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "24-RIP-MAR-04-058",
    title:
      "Externally-Funded Coastal Resource Mapping and Monitoring System for Marinduque",
    description:
      "Development of a GIS-based coastal resource mapping and monitoring system to support science-based fisheries and environmental management.",
    type: "GIA (Region-initiated Projects) Externally Funded",
    year: 2024,
    beneficiary: "Provincial Government of Marinduque",
    sector: "ICT",
    municipality: "Boac",
    status: "New",
    cost: 5_400_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "19-4B-04-06-006",
    title:
      "Technology Intervention in the Handicraft Production of Torrijos Buri Weavers",
    description:
      "Provision of stripping and weaving tools plus product development support to improve buri-based handicrafts and expand market opportunities.",
    type: "SETUP",
    year: 2019,
    beneficiary: "Torrijos Buri Weavers Association",
    sector: "Gifts / Decors / Handicrafts",
    municipality: "Torrijos",
    status: "Completed",
    cost: 680_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "23-CEST-MAR-04-044",
    title:
      "CEST Program Implementation for the Adopted Community of Barangay Malbog, Boac",
    description:
      "Integrated S&T package covering livelihood, potable water, health, and disaster preparedness for the adopted community of Barangay Malbog.",
    type: "CEST",
    year: 2023,
    beneficiary: "Barangay Malbog, Boac",
    sector: "Other Regional Industry Priorities",
    municipality: "Boac",
    status: "On-going",
    cost: 3_800_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "21-4B-04-03-024",
    title:
      "Modernization of the Buenavista Virgin Coconut Oil (VCO) Processing Line",
    description:
      "Upgrading of VCO extraction, filtering, and bottling equipment to meet food-safety standards and increase output of premium coconut oil.",
    type: "SETUP",
    year: 2021,
    beneficiary: "Buenavista VCO Producers Cooperative",
    sector: "Health & Wellness Products",
    municipality: "Buenavista",
    status: "Graduated",
    cost: 1_540_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "24-GIA-MAR-04-061",
    title:
      "Digital Livelihood and E-Commerce Training Hub for Santa Cruz Micro-Entrepreneurs",
    description:
      "Establishment of a training hub with computers and connectivity to teach micro-entrepreneurs online selling, digital payments, and marketing.",
    type: "GIA (Community Based)",
    year: 2024,
    beneficiary: "Santa Cruz Micro-Entrepreneurs Network",
    sector: "ICT",
    municipality: "Santa Cruz",
    status: "On-going",
    cost: 720_000,
    implementor: IMPLEMENTOR,
  },
  {
    code: "22-GIA-MAR-04-029",
    title:
      "Provision of Furniture-Making Equipment for the Mogpog Bamboo Craft Enterprise",
    description:
      "Provision of bamboo treatment and furniture-making equipment to produce durable, market-ready bamboo furniture and craft products.",
    type: "GIA (Community Based)",
    year: 2022,
    beneficiary: "Mogpog Bamboo Craft Enterprise",
    sector: "Furniture",
    municipality: "Mogpog",
    status: "On-going",
    cost: 1_100_000,
    implementor: IMPLEMENTOR,
  },
];

// Deterministic spread around each municipality center so pins don't stack.
const jitter = (index: number, salt: number) => {
  const v = Math.sin((index + 1) * (salt + 1) * 12.9898) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * 0.045;
};

export const MARINDUQUE_PROJECTS: ImpressionProject[] = RAW_PROJECTS.map(
  (project, index) => {
    const base = MUNICIPALITY_COORDS[project.municipality];
    return {
      ...project,
      latitude: Number((base.lat + jitter(index, 1)).toFixed(5)),
      longitude: Number((base.lng + jitter(index, 2)).toFixed(5)),
    };
  },
);

export type ProjectStatus =
  | "planning"
  | "ongoing"
  | "completed"
  | "delayed"
  | "on_hold"
  | "cancelled";

export type TaraProgram =
  | "SETUP"
  | "CEST"
  | "GIA"
  | "R&D"
  | "STARBOOKS"
  | "REIINN"
  | "iHub"
  | "Coral Restoration"
  | "Water Projects"
  | "Agriculture"
  | "Renewable Energy"
  | "Disaster Resilience"
  | "Technology Transfer"
  | "Innovation Hubs";

export type Province =
  | "Oriental Mindoro"
  | "Occidental Mindoro"
  | "Marinduque"
  | "Romblon"
  | "Palawan";

export type TaraSector =
  | "Food Processing"
  | "Furniture"
  | "Gifts / Decors / Handicrafts"
  | "Metals & Engineering"
  | "Agriculture / Marine / Aquaculture / Forestry / Livestock"
  | "Health & Wellness Products"
  | "ICT"
  | "Other Regional Industry Priorities";

export type TaraProject = {
  id: string;
  name: string;
  description: string;
  beneficiary: string;
  program: TaraProgram;
  sector: TaraSector;
  province: Province;
  municipality: string;
  barangay: string;
  latitude: number;
  longitude: number;
  budget: number;
  funding_source: string;
  status: ProjectStatus;
  progress: number;
  start_date: string;
  end_date: string;
  beneficiaries: number;
  partner_agency: string;
  latest_accomplishment: string;
  photo_url?: string | null;
};

export const PROVINCES: Province[] = [
  "Oriental Mindoro",
  "Occidental Mindoro",
  "Marinduque",
  "Romblon",
  "Palawan",
];

export const SECTORS: TaraSector[] = [
  "Food Processing",
  "Furniture",
  "Gifts / Decors / Handicrafts",
  "Metals & Engineering",
  "Agriculture / Marine / Aquaculture / Forestry / Livestock",
  "Health & Wellness Products",
  "ICT",
  "Other Regional Industry Priorities",
];

/** Year a project started (derived from its start_date). */
export const projectYear = (p: TaraProject) =>
  Number(p.start_date.slice(0, 4));

export const PROGRAMS: TaraProgram[] = [
  "SETUP",
  "CEST",
  "GIA",
  "R&D",
  "STARBOOKS",
  "REIINN",
  "iHub",
  "Coral Restoration",
  "Water Projects",
  "Agriculture",
  "Renewable Energy",
  "Disaster Resilience",
  "Technology Transfer",
  "Innovation Hubs",
];

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "ongoing",
  "completed",
  "delayed",
  "on_hold",
  "cancelled",
];

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; className: string; tone: string }
> = {
  planning: {
    label: "Planning",
    className: "bg-slate-500/20 text-slate-200 ring-slate-400/30",
    tone: "neutral",
  },
  ongoing: {
    label: "Ongoing",
    className: "bg-cyan-500/20 text-cyan-200 ring-cyan-400/30",
    tone: "info",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
    tone: "success",
  },
  delayed: {
    label: "Delayed",
    className: "bg-red-500/20 text-red-200 ring-red-400/30",
    tone: "danger",
  },
  on_hold: {
    label: "On Hold",
    className: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
    tone: "warning",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-500/20 text-rose-200 ring-rose-400/30",
    tone: "danger",
  },
};

export const PROGRAM_META: Record<
  TaraProgram,
  { short: string; pinClass: string; accent: string }
> = {
  SETUP: {
    short: "SETUP",
    pinClass: "project-pin--setup",
    accent: "text-cyan-300",
  },
  CEST: {
    short: "CEST",
    pinClass: "project-pin--cest",
    accent: "text-blue-300",
  },
  GIA: { short: "GIA", pinClass: "project-pin--gia", accent: "text-indigo-300" },
  "R&D": { short: "R&D", pinClass: "project-pin--rd", accent: "text-violet-300" },
  STARBOOKS: {
    short: "SB",
    pinClass: "project-pin--starbooks",
    accent: "text-amber-300",
  },
  REIINN: {
    short: "REI",
    pinClass: "project-pin--reiinn",
    accent: "text-teal-300",
  },
  iHub: {
    short: "iHub",
    pinClass: "project-pin--ihub",
    accent: "text-fuchsia-300",
  },
  "Coral Restoration": {
    short: "Coral",
    pinClass: "project-pin--coral",
    accent: "text-sky-300",
  },
  "Water Projects": {
    short: "Water",
    pinClass: "project-pin--water",
    accent: "text-blue-200",
  },
  Agriculture: {
    short: "Agri",
    pinClass: "project-pin--agri",
    accent: "text-lime-300",
  },
  "Renewable Energy": {
    short: "RE",
    pinClass: "project-pin--energy",
    accent: "text-yellow-300",
  },
  "Disaster Resilience": {
    short: "DRR",
    pinClass: "project-pin--drr",
    accent: "text-orange-300",
  },
  "Technology Transfer": {
    short: "TT",
    pinClass: "project-pin--tech",
    accent: "text-emerald-300",
  },
  "Innovation Hubs": {
    short: "Hub",
    pinClass: "project-pin--hub",
    accent: "text-pink-300",
  },
};

export const formatPeso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatCompact = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    n,
  );

/** Deterministic sample photo for a project (presentation build). */
export const projectImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/320`;

/** Description for a project — uses the authored text, falls back to a generated one. */
export const describeProject = (p: TaraProject) =>
  p.description?.trim()
    ? p.description
    : `${p.name} is a ${p.program} initiative implemented in Barangay ${p.barangay}, ${p.municipality}, ${p.province}. Funded through ${p.funding_source} with a budget of ${formatPeso(
        p.budget,
      )}, it benefits ${p.beneficiaries.toLocaleString()} beneficiaries in partnership with ${p.partner_agency}. As of the latest update it is ${p.status.toLowerCase()} at ${p.progress}% completion.`;

/** Demo seed — replace with Laravel/PostGIS API later. */
export const MOCK_TARA_PROJECTS: TaraProject[] = [
  {
    id: "prj-001",
    beneficiary: "Calapan Food Processors Association",
    sector: "Food Processing",
    name: "Calapan Food Processing SETUP Cluster",
    description:
      "Provision of shared food-processing and packaging equipment to a cluster of Calapan MSMEs to raise output, improve product quality, and widen market access.",
    program: "SETUP",
    province: "Oriental Mindoro",
    municipality: "Calapan City",
    barangay: "Ibaba East",
    latitude: 13.4117,
    longitude: 121.1803,
    budget: 4_850_000,
    funding_source: "GIA-SETUP",
    status: "ongoing",
    progress: 62,
    start_date: "2024-03-01",
    end_date: "2026-02-28",
    beneficiaries: 48,
    partner_agency: "DOST-MIMAROPA / LGU Calapan",
    latest_accomplishment: "Installed packaging equipment; 12 MSMEs trained.",
  },
  {
    id: "prj-002",
    beneficiary: "DepEd Marinduque - Torrijos District",
    sector: "ICT",
    name: "Torrijos STARBOOKS Learning Hub",
    description:
      "Deployment of the DOST STARBOOKS offline science digital library so Torrijos students and teachers can access STEM learning resources even without internet.",
    program: "STARBOOKS",
    province: "Marinduque",
    municipality: "Torrijos",
    barangay: "Marlangga",
    latitude: 13.347,
    longitude: 122.088,
    budget: 850_000,
    funding_source: "DOST-SEI",
    status: "completed",
    progress: 100,
    start_date: "2023-06-01",
    end_date: "2024-11-30",
    beneficiaries: 1200,
    partner_agency: "DepEd Marinduque",
    latest_accomplishment: "Hub inaugurated; offline STEM library live.",
  },
  {
    id: "prj-003",
    beneficiary: "Coron Municipal Fisherfolk & BFAR",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Coron Coral Restoration Pilot",
    description:
      "Pilot coral reef restoration through fragment transplantation across priority dive sites to rehabilitate marine biodiversity and sustain coastal tourism and fisheries.",
    program: "Coral Restoration",
    province: "Palawan",
    municipality: "Coron",
    barangay: "Poblacion 1",
    latitude: 11.9982,
    longitude: 120.2008,
    budget: 6_200_000,
    funding_source: "GIA",
    status: "ongoing",
    progress: 45,
    start_date: "2024-01-15",
    end_date: "2026-12-31",
    beneficiaries: 8,
    partner_agency: "BFAR / LGU Coron",
    latest_accomplishment: "Transplanted 2,400 coral fragments across 3 sites.",
  },
  {
    id: "prj-004",
    beneficiary: "Barangay Claudio Salgado Water Association",
    sector: "Other Regional Industry Priorities",
    name: "Sablayan Community Water System",
    description:
      "Construction of a community potable water system with new pipelines and reservoirs to deliver safe, reliable water to underserved barangays in Sablayan.",
    program: "Water Projects",
    province: "Occidental Mindoro",
    municipality: "Sablayan",
    barangay: "Claudio Salgado",
    latitude: 12.8345,
    longitude: 120.782,
    budget: 3_100_000,
    funding_source: "CEST",
    status: "delayed",
    progress: 38,
    start_date: "2023-09-01",
    end_date: "2025-08-31",
    beneficiaries: 620,
    partner_agency: "LGU Sablayan",
    latest_accomplishment: "Pipeline ROW delayed; redesign submitted.",
  },
  {
    id: "prj-005",
    beneficiary: "Barangay Poctoy Off-Grid Households",
    sector: "Other Regional Industry Priorities",
    name: "Odiongan Renewable Microgrid Demo",
    description:
      "Demonstration solar-plus-storage microgrid delivering stable, clean electricity to off-grid households and enterprises in Odiongan.",
    program: "Renewable Energy",
    province: "Romblon",
    municipality: "Odiongan",
    barangay: "Poctoy",
    latitude: 12.401,
    longitude: 121.988,
    budget: 9_750_000,
    funding_source: "GIA-Energy",
    status: "ongoing",
    progress: 55,
    start_date: "2024-05-01",
    end_date: "2026-04-30",
    beneficiaries: 210,
    partner_agency: "NPC / LGU Odiongan",
    latest_accomplishment: "Solar arrays commissioned; battery staging ongoing.",
  },
  {
    id: "prj-006",
    beneficiary: "Palawan Startups & MSMEs",
    sector: "ICT",
    name: "Puerto Princesa iHub Expansion",
    description:
      "Expansion of the Puerto Princesa innovation hub with prototyping equipment and co-working space to support startups, researchers, and MSMEs.",
    program: "iHub",
    province: "Palawan",
    municipality: "Puerto Princesa City",
    barangay: "San Pedro",
    latitude: 9.7645,
    longitude: 118.7473,
    budget: 12_400_000,
    funding_source: "Innovation Fund",
    status: "planning",
    progress: 12,
    start_date: "2025-01-01",
    end_date: "2027-06-30",
    beneficiaries: 90,
    partner_agency: "DOST-PSTC Palawan",
    latest_accomplishment: "Floor plan approved; equipment RFQ released.",
  },
  {
    id: "prj-007",
    beneficiary: "Balimbing Farmers Cooperative",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Boac CEST Upland Farming Support",
    description:
      "Convergence of S&T interventions delivering climate-smart farming kits, training, and soil health support to upland farming communities in Boac.",
    program: "CEST",
    province: "Marinduque",
    municipality: "Boac",
    barangay: "Balimbing",
    latitude: 13.446,
    longitude: 121.842,
    budget: 2_300_000,
    funding_source: "CEST",
    status: "ongoing",
    progress: 70,
    start_date: "2024-02-01",
    end_date: "2025-12-15",
    beneficiaries: 156,
    partner_agency: "DA / LGU Boac",
    latest_accomplishment: "Distributed climate-smart kits to 40 farms.",
  },
  {
    id: "prj-008",
    beneficiary: "Municipality of Mamburao (PDRRMO)",
    sector: "Other Regional Industry Priorities",
    name: "Mamburao Disaster Early Warning Node",
    description:
      "Installation of automated rain and river-level sensors linked to a community early-warning system to reduce flood risk for Mamburao residents.",
    program: "Disaster Resilience",
    province: "Occidental Mindoro",
    municipality: "Mamburao",
    barangay: "Balansay",
    latitude: 13.223,
    longitude: 120.597,
    budget: 1_980_000,
    funding_source: "GIA-DRRM",
    status: "on_hold",
    progress: 28,
    start_date: "2024-07-01",
    end_date: "2025-10-31",
    beneficiaries: 15_000,
    partner_agency: "PDRRMO Occidental Mindoro",
    latest_accomplishment: "Sensor procurement paused pending permitting.",
  },
  {
    id: "prj-009",
    beneficiary: "Roxas Seaweed Farmers Association",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Roxas Seaweed Processing SETUP",
    description:
      "Provision of drying, milling, and packaging equipment to seaweed farmers in Roxas to add value to raw seaweed and increase household income.",
    program: "SETUP",
    province: "Oriental Mindoro",
    municipality: "Roxas",
    barangay: "San Isidro",
    latitude: 12.585,
    longitude: 121.518,
    budget: 3_650_000,
    funding_source: "GIA-SETUP",
    status: "completed",
    progress: 100,
    start_date: "2022-11-01",
    end_date: "2024-09-30",
    beneficiaries: 35,
    partner_agency: "BFAR / DOST OrMin",
    latest_accomplishment: "Turned over facility; Q4 sales up 22%.",
  },
  {
    id: "prj-010",
    beneficiary: "Romblon State University",
    sector: "Other Regional Industry Priorities",
    name: "San Fernando REIINN Satellite Lab",
    description:
      "Establishment of a regional research and innovation satellite laboratory to support local testing, product development, and academe-industry collaboration.",
    program: "REIINN",
    province: "Romblon",
    municipality: "San Fernando",
    barangay: "Poblacion",
    latitude: 12.288,
    longitude: 122.6,
    budget: 5_400_000,
    funding_source: "REIINN",
    status: "ongoing",
    progress: 48,
    start_date: "2024-04-01",
    end_date: "2026-03-31",
    beneficiaries: 22,
    partner_agency: "SUC partner / DOST Romblon",
    latest_accomplishment: "Lab fit-out 60%; first demos scheduled.",
  },

  // ── Oriental Mindoro ──────────────────────────────────────────────
  {
    id: "prj-011",
    beneficiary: "Naujan Rice Farmers Cooperative",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Naujan Rice Mill Productivity Upgrade (SETUP)",
    description:
      "Acquisition of a modern multi-pass rice mill with GMP training to cut milling losses and improve rice quality for farmer-members in Naujan.",
    program: "SETUP",
    province: "Oriental Mindoro",
    municipality: "Naujan",
    barangay: "Montelago",
    latitude: 13.3253,
    longitude: 121.3028,
    budget: 4_200_000,
    funding_source: "GIA-SETUP",
    status: "ongoing",
    progress: 58,
    start_date: "2024-02-15",
    end_date: "2026-01-31",
    beneficiaries: 64,
    partner_agency: "DOST-MIMAROPA / LGU Naujan",
    latest_accomplishment:
      "Installed multi-pass rice mill; 18 farmer-members trained on GMP.",
  },
  {
    id: "prj-012",
    beneficiary: "Marfrancisco Coastal Communities",
    sector: "Other Regional Industry Priorities",
    name: "Pinamalayan CEST Coastal Community Program",
    description:
      "Integrated S&T package delivering livelihood, potable water, and health interventions to poor coastal barangays in Pinamalayan.",
    program: "CEST",
    province: "Oriental Mindoro",
    municipality: "Pinamalayan",
    barangay: "Marfrancisco",
    latitude: 13.0353,
    longitude: 121.4889,
    budget: 3_600_000,
    funding_source: "CEST",
    status: "ongoing",
    progress: 44,
    start_date: "2024-05-01",
    end_date: "2026-04-30",
    beneficiaries: 850,
    partner_agency: "LGU Pinamalayan / BFAR",
    latest_accomplishment:
      "Livelihood and potable water interventions rolled out in 3 barangays.",
  },
  {
    id: "prj-013",
    beneficiary: "Victoria Vegetable Growers Association",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Victoria Smart Agriculture Demonstration Farm",
    description:
      "Establishment of a smart-agriculture demonstration farm with soil and weather sensors to showcase precision-farming practices to local growers.",
    program: "Agriculture",
    province: "Oriental Mindoro",
    municipality: "Victoria",
    barangay: "Ordovilla",
    latitude: 13.1767,
    longitude: 121.2783,
    budget: 2_750_000,
    funding_source: "GIA",
    status: "delayed",
    progress: 33,
    start_date: "2023-10-01",
    end_date: "2025-09-30",
    beneficiaries: 120,
    partner_agency: "DA / LGU Victoria",
    latest_accomplishment:
      "Sensor network procurement delayed; site prep completed.",
  },
  {
    id: "prj-014",
    beneficiary: "Sabang Dive Operators & BFAR",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Puerto Galera Coral Reef Rehabilitation Initiative",
    description:
      "Rehabilitation of degraded reefs through coral fragment deployment in protected dive sites to restore marine biodiversity and sustain eco-tourism.",
    program: "Coral Restoration",
    province: "Oriental Mindoro",
    municipality: "Puerto Galera",
    barangay: "Sabang",
    latitude: 13.5163,
    longitude: 120.9569,
    budget: 5_800_000,
    funding_source: "GIA",
    status: "ongoing",
    progress: 51,
    start_date: "2024-01-10",
    end_date: "2026-12-31",
    beneficiaries: 14,
    partner_agency: "BFAR / DENR",
    latest_accomplishment:
      "Deployed 1,800 coral fragments across 2 protected dive sites.",
  },
  {
    id: "prj-015",
    beneficiary: "Oriental Mindoro Innovators & Startups",
    sector: "ICT",
    name: "Calapan City Innovation Hub (iHub) Expansion",
    description:
      "Expansion of the Calapan innovation hub with fabrication and prototyping equipment to nurture startups and student innovators.",
    program: "iHub",
    province: "Oriental Mindoro",
    municipality: "Calapan City",
    barangay: "Guinobatan",
    latitude: 13.3789,
    longitude: 121.1747,
    budget: 11_200_000,
    funding_source: "Innovation Fund",
    status: "planning",
    progress: 15,
    start_date: "2025-02-01",
    end_date: "2027-01-31",
    beneficiaries: 110,
    partner_agency: "DOST-PSTC Oriental Mindoro",
    latest_accomplishment: "Design approved; equipment procurement in progress.",
  },

  // ── Occidental Mindoro ────────────────────────────────────────────
  {
    id: "prj-016",
    beneficiary: "San Jose Aquaculture Traders Association",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "San Jose Aquaculture Cold Chain SETUP",
    description:
      "Installation of a blast freezer and ice plant to build a cold chain that reduces post-harvest losses for San Jose aquaculture traders.",
    program: "SETUP",
    province: "Occidental Mindoro",
    municipality: "San Jose",
    barangay: "Bubog",
    latitude: 12.3527,
    longitude: 121.0687,
    budget: 3_950_000,
    funding_source: "GIA-SETUP",
    status: "ongoing",
    progress: 62,
    start_date: "2024-03-01",
    end_date: "2026-02-28",
    beneficiaries: 78,
    partner_agency: "BFAR / LGU San Jose",
    latest_accomplishment:
      "Blast freezer and ice plant commissioned; traders onboarded.",
  },
  {
    id: "prj-017",
    beneficiary: "Barangay Rumbang Community Association",
    sector: "Other Regional Industry Priorities",
    name: "Rizal Renewable Energy Community Microgrid",
    description:
      "Community solar microgrid with battery storage providing reliable electricity to off-grid households in Rizal, Occidental Mindoro.",
    program: "Renewable Energy",
    province: "Occidental Mindoro",
    municipality: "Rizal",
    barangay: "Rumbang",
    latitude: 12.4183,
    longitude: 120.9469,
    budget: 8_600_000,
    funding_source: "GIA-Energy",
    status: "ongoing",
    progress: 47,
    start_date: "2024-04-15",
    end_date: "2026-03-31",
    beneficiaries: 320,
    partner_agency: "NPC / LGU Rizal",
    latest_accomplishment: "Solar array installed; battery storage staging.",
  },
  {
    id: "prj-018",
    beneficiary: "Abra de Ilog Poblacion Water Association",
    sector: "Other Regional Industry Priorities",
    name: "Abra de Ilog Potable Water Systems Project",
    description:
      "Development of potable water sources and distribution lines to deliver safe drinking water to households in Abra de Ilog.",
    program: "Water Projects",
    province: "Occidental Mindoro",
    municipality: "Abra de Ilog",
    barangay: "Poblacion",
    latitude: 13.4419,
    longitude: 120.7264,
    budget: 2_900_000,
    funding_source: "CEST",
    status: "on_hold",
    progress: 26,
    start_date: "2023-11-01",
    end_date: "2025-10-31",
    beneficiaries: 540,
    partner_agency: "LGU Abra de Ilog",
    latest_accomplishment: "Permitting on hold; source testing completed.",
  },
  {
    id: "prj-019",
    beneficiary: "DepEd Occidental Mindoro - Lubang District",
    sector: "ICT",
    name: "Lubang Island STARBOOKS Learning Network",
    description:
      "Deployment of multiple STARBOOKS offline STEM library nodes across Lubang Island schools to widen access to science learning.",
    program: "STARBOOKS",
    province: "Occidental Mindoro",
    municipality: "Lubang",
    barangay: "Tilik",
    latitude: 13.8567,
    longitude: 120.1361,
    budget: 780_000,
    funding_source: "DOST-SEI",
    status: "completed",
    progress: 100,
    start_date: "2023-05-01",
    end_date: "2024-10-31",
    beneficiaries: 1_450,
    partner_agency: "DepEd Occidental Mindoro",
    latest_accomplishment: "5 offline STEM library nodes live island-wide.",
  },
  {
    id: "prj-020",
    beneficiary: "Sablayan Cashew Processors Association",
    sector: "Food Processing",
    name: "Sablayan Technology Transfer for Cashew Processors",
    description:
      "Transfer of cashew shelling and processing technology to raise the productivity, safety, and product quality of Sablayan cashew processors.",
    program: "Technology Transfer",
    province: "Occidental Mindoro",
    municipality: "Sablayan",
    barangay: "Buenavista",
    latitude: 12.8419,
    longitude: 120.7719,
    budget: 1_680_000,
    funding_source: "GIA",
    status: "completed",
    progress: 100,
    start_date: "2022-09-01",
    end_date: "2024-08-31",
    beneficiaries: 92,
    partner_agency: "DTI / LGU Sablayan",
    latest_accomplishment: "Turned over cashew shelling line; sales up 28%.",
  },

  // ── Marinduque ────────────────────────────────────────────────────
  {
    id: "prj-021",
    beneficiary: "Gasan Coco Sugar Producers Cooperative",
    sector: "Food Processing",
    name: "Gasan Coco Sugar Production SETUP",
    description:
      "Provision of coco sap collection and evaporation equipment to enable Gasan producers to manufacture high-value natural coco sugar.",
    program: "SETUP",
    province: "Marinduque",
    municipality: "Gasan",
    barangay: "Bahi",
    latitude: 13.3312,
    longitude: 121.8676,
    budget: 1_450_000,
    funding_source: "GIA-SETUP",
    status: "ongoing",
    progress: 66,
    start_date: "2024-02-01",
    end_date: "2025-12-31",
    beneficiaries: 54,
    partner_agency: "DOST-PSTO Marinduque",
    latest_accomplishment: "Coco sap collection and evaporation units installed.",
  },
  {
    id: "prj-022",
    beneficiary: "Santa Cruz Marine Products Traders",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Santa Cruz Marine Products Cold Storage (GIA)",
    description:
      "Establishment of a cold storage and ice-making facility to preserve marine catch and reduce post-harvest losses for Santa Cruz traders.",
    program: "GIA",
    province: "Marinduque",
    municipality: "Santa Cruz",
    barangay: "Poblacion I",
    latitude: 13.479,
    longitude: 122.028,
    budget: 1_980_000,
    funding_source: "GIA-CB",
    status: "on_hold",
    progress: 24,
    start_date: "2024-06-01",
    end_date: "2025-11-30",
    beneficiaries: 130,
    partner_agency: "BFAR / LGU Santa Cruz",
    latest_accomplishment: "Site cleared; equipment delivery rescheduled.",
  },
  {
    id: "prj-023",
    beneficiary: "Buenavista VCO Producers Cooperative",
    sector: "Health & Wellness Products",
    name: "Buenavista Virgin Coconut Oil Health Products",
    description:
      "Upgrading of the VCO processing line to meet FDA standards and expand production of premium virgin coconut oil health products.",
    program: "GIA",
    province: "Marinduque",
    municipality: "Buenavista",
    barangay: "Bagacay",
    latitude: 13.2544,
    longitude: 121.933,
    budget: 1_540_000,
    funding_source: "GIA-CB",
    status: "completed",
    progress: 100,
    start_date: "2022-07-01",
    end_date: "2024-06-30",
    beneficiaries: 66,
    partner_agency: "DOST-PSTO Marinduque",
    latest_accomplishment: "VCO line FDA-compliant; retail listing secured.",
  },

  // ── Romblon ───────────────────────────────────────────────────────
  {
    id: "prj-024",
    beneficiary: "Romblon Marble Craftsmen Association",
    sector: "Gifts / Decors / Handicrafts",
    name: "Romblon Marble Craft Technology Transfer",
    description:
      "Provision of CNC marble cutting and finishing equipment to improve the precision, output, and product design of Romblon marble craftsmen.",
    program: "Technology Transfer",
    province: "Romblon",
    municipality: "Romblon",
    barangay: "Ilauran",
    latitude: 12.5779,
    longitude: 122.2708,
    budget: 3_250_000,
    funding_source: "GIA",
    status: "ongoing",
    progress: 53,
    start_date: "2024-03-01",
    end_date: "2026-02-28",
    beneficiaries: 145,
    partner_agency: "DTI / LGU Romblon",
    latest_accomplishment: "CNC marble cutting equipment installed and tested.",
  },
  {
    id: "prj-025",
    beneficiary: "Cajidiocan Upland Farmers Association",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Cajidiocan Upland Agriculture Support",
    description:
      "Distribution of climate-smart farming kits and training to upland farmers in Cajidiocan to raise yields and build climate resilience.",
    program: "Agriculture",
    province: "Romblon",
    municipality: "Cajidiocan",
    barangay: "Sugod",
    latitude: 12.4622,
    longitude: 122.6889,
    budget: 1_920_000,
    funding_source: "CEST",
    status: "ongoing",
    progress: 41,
    start_date: "2024-04-01",
    end_date: "2025-12-31",
    beneficiaries: 210,
    partner_agency: "DA / LGU Cajidiocan",
    latest_accomplishment: "Distributed climate-smart kits to 60 upland farms.",
  },
  {
    id: "prj-026",
    beneficiary: "Municipality of Santa Fe (PDRRMO)",
    sector: "Other Regional Industry Priorities",
    name: "Santa Fe Disaster Early Warning Network",
    description:
      "Installation of a community-based early warning sensor network to strengthen disaster preparedness and response in Santa Fe.",
    program: "Disaster Resilience",
    province: "Romblon",
    municipality: "Santa Fe",
    barangay: "Poblacion",
    latitude: 12.1508,
    longitude: 122.0244,
    budget: 2_150_000,
    funding_source: "GIA-DRRM",
    status: "planning",
    progress: 18,
    start_date: "2025-01-15",
    end_date: "2026-10-31",
    beneficiaries: 9_800,
    partner_agency: "PDRRMO Romblon",
    latest_accomplishment: "Sensor sites surveyed; MOA under finalization.",
  },
  {
    id: "prj-027",
    beneficiary: "Odiongan Food Processors Guild",
    sector: "Food Processing",
    name: "Odiongan Food Processing Shared Facility (SETUP)",
    description:
      "Establishment of a shared food-processing and packaging facility that Odiongan MSMEs can use to lower costs and standardize product quality.",
    program: "SETUP",
    province: "Romblon",
    municipality: "Odiongan",
    barangay: "Dapawan",
    latitude: 12.401,
    longitude: 121.988,
    budget: 2_480_000,
    funding_source: "GIA-SETUP",
    status: "ongoing",
    progress: 57,
    start_date: "2024-02-01",
    end_date: "2025-12-31",
    beneficiaries: 88,
    partner_agency: "DOST-PSTO Romblon",
    latest_accomplishment: "Shared kitchen and packaging equipment installed.",
  },

  // ── Palawan ───────────────────────────────────────────────────────
  {
    id: "prj-028",
    beneficiary: "El Nido Tourism Enterprises Council",
    sector: "Other Regional Industry Priorities",
    name: "El Nido Sustainable Tourism Innovation Hub",
    description:
      "Establishment of a tourism innovation hub offering digital tools and co-working space to support sustainable tourism enterprises in El Nido.",
    program: "Innovation Hubs",
    province: "Palawan",
    municipality: "El Nido",
    barangay: "Buena Suerte",
    latitude: 11.1957,
    longitude: 119.4076,
    budget: 9_900_000,
    funding_source: "Innovation Fund",
    status: "ongoing",
    progress: 39,
    start_date: "2024-05-01",
    end_date: "2026-12-31",
    beneficiaries: 260,
    partner_agency: "DOT / DOST-PSTC Palawan",
    latest_accomplishment: "Co-working and digital tools hub 40% fitted out.",
  },
  {
    id: "prj-029",
    beneficiary: "Roxas Palawan Seaweed Growers Association",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Roxas Palawan Seaweed Processing SETUP",
    description:
      "Provision of carrageenan drying and milling equipment to add value to seaweed and boost the incomes of Roxas, Palawan farmers.",
    program: "SETUP",
    province: "Palawan",
    municipality: "Roxas",
    barangay: "New Cuyo",
    latitude: 10.3086,
    longitude: 119.3444,
    budget: 3_700_000,
    funding_source: "GIA-SETUP",
    status: "ongoing",
    progress: 60,
    start_date: "2024-03-15",
    end_date: "2026-02-28",
    beneficiaries: 140,
    partner_agency: "BFAR / LGU Roxas",
    latest_accomplishment: "Carrageenan drying and milling equipment operational.",
  },
  {
    id: "prj-030",
    beneficiary: "Barangay Mainit Community Association",
    sector: "Other Regional Industry Priorities",
    name: "Brooke's Point Renewable Energy Livelihood Project",
    description:
      "Solar energy systems paired with livelihood support to power enterprises and improve living conditions in off-grid Brooke's Point communities.",
    program: "Renewable Energy",
    province: "Palawan",
    municipality: "Brooke's Point",
    barangay: "Mainit",
    latitude: 8.7756,
    longitude: 117.8339,
    budget: 7_450_000,
    funding_source: "GIA-Energy",
    status: "delayed",
    progress: 30,
    start_date: "2023-09-01",
    end_date: "2025-08-31",
    beneficiaries: 410,
    partner_agency: "NPC / LGU Brooke's Point",
    latest_accomplishment: "Grid interconnection permits delayed; panels staged.",
  },
  {
    id: "prj-031",
    beneficiary: "Narra Rice Farmers Association",
    sector: "Agriculture / Marine / Aquaculture / Forestry / Livestock",
    name: "Narra Community Agriculture GIA Program",
    description:
      "Provision of rice threshers and solar dryers with training to reduce post-harvest losses and increase farm income in Narra.",
    program: "Agriculture",
    province: "Palawan",
    municipality: "Narra",
    barangay: "Panacan",
    latitude: 9.2725,
    longitude: 118.4056,
    budget: 1_650_000,
    funding_source: "GIA-CB",
    status: "completed",
    progress: 100,
    start_date: "2022-10-01",
    end_date: "2024-09-30",
    beneficiaries: 175,
    partner_agency: "DA / LGU Narra",
    latest_accomplishment: "Turned over rice thresher and solar dryers; yield up.",
  },
  {
    id: "prj-032",
    beneficiary: "DepEd Palawan - Coron District",
    sector: "ICT",
    name: "Coron STARBOOKS and Digital Literacy Hub",
    description:
      "Establishment of an offline STEM library and digital literacy hub offering coding and computer classes to Coron learners.",
    program: "STARBOOKS",
    province: "Palawan",
    municipality: "Coron",
    barangay: "Poblacion 5",
    latitude: 11.9982,
    longitude: 120.2008,
    budget: 920_000,
    funding_source: "DOST-SEI",
    status: "completed",
    progress: 100,
    start_date: "2023-06-01",
    end_date: "2024-11-30",
    beneficiaries: 1_320,
    partner_agency: "DepEd Palawan",
    latest_accomplishment: "Offline STEM library and coding classes launched.",
  },
];

export const AI_INSIGHTS = [
  "Marinduque currently leads project completion rate among MIMAROPA provinces.",
  "Palawan received the highest technology intervention investments this year.",
  "Occidental Mindoro shows rising demand for renewable energy and water projects.",
  "3 projects flagged delayed — Sablayan Water System needs priority review.",
];

export const summarizeProjects = (projects: TaraProject[]) => {
  const total = projects.length;
  const active = projects.filter((p) => p.status === "ongoing").length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const onHold = projects.filter((p) => p.status === "on_hold").length;
  const delayed = projects.filter((p) => p.status === "delayed").length;
  const beneficiaries = projects.reduce((s, p) => s + p.beneficiaries, 0);
  const funding = projects.reduce((s, p) => s + p.budget, 0);
  const utilized = projects.reduce(
    (s, p) => s + Math.round((p.budget * p.progress) / 100),
    0,
  );
  const municipalities = new Set(projects.map((p) => p.municipality)).size;
  const barangays = new Set(projects.map((p) => p.barangay)).size;
  const partners = new Set(projects.map((p) => p.partner_agency)).size;

  return {
    total,
    active,
    completed,
    onHold,
    delayed,
    beneficiaries,
    funding,
    utilized,
    municipalities,
    barangays,
    partners,
  };
};

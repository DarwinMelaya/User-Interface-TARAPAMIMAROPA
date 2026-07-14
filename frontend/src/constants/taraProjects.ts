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

export type TaraProject = {
  id: string;
  name: string;
  program: TaraProgram;
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

/** Demo seed — replace with Laravel/PostGIS API later. */
export const MOCK_TARA_PROJECTS: TaraProject[] = [
  {
    id: "prj-001",
    name: "Calapan Food Processing SETUP Cluster",
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
    name: "Torrijos STARBOOKS Learning Hub",
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
    name: "Coron Coral Restoration Pilot",
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
    name: "Sablayan Community Water System",
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
    name: "Odiongan Renewable Microgrid Demo",
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
    name: "Puerto Princesa iHub Expansion",
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
    name: "Boac CEST Upland Farming Support",
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
    name: "Mamburao Disaster Early Warning Node",
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
    name: "Roxas Seaweed Processing SETUP",
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
    name: "San Fernando REIINN Satellite Lab",
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

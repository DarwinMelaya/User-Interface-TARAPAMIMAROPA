import { PROVINCES, type Province } from "./taraProjects";

export type EmploymentType = "regular" | "contract_of_service";

export type EmployeeOffice = Province | "Regional Office";

export type TaraEmployee = {
  id: string;
  name: string;
  position: string;
  office: EmployeeOffice;
  employmentType: EmploymentType;
  sex: "Male" | "Female";
  dateHired: string;
};

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  "regular",
  "contract_of_service",
];

export const EMPLOYMENT_META: Record<
  EmploymentType,
  { label: string; short: string; className: string; bar: string }
> = {
  regular: {
    label: "Regular",
    short: "Regular",
    className: "bg-blue-500/20 text-blue-200 ring-blue-400/30",
    bar: "bg-blue-500",
  },
  contract_of_service: {
    label: "Contract of Service",
    short: "COS",
    className: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
    bar: "bg-amber-500",
  },
};

export const EMPLOYEE_OFFICES: EmployeeOffice[] = [
  "Regional Office",
  ...PROVINCES,
];

/** Mock headcount for RD view: Regular vs COS across MIMAROPA offices. */
export const MOCK_EMPLOYEES: TaraEmployee[] = [
  // Regional Office
  {
    id: "e-ro-01",
    name: "Maria Santos",
    position: "Regional Director",
    office: "Regional Office",
    employmentType: "regular",
    sex: "Female",
    dateHired: "2012-03-15",
  },
  {
    id: "e-ro-02",
    name: "Jose Ramirez",
    position: "ARD for Technical Operations",
    office: "Regional Office",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2015-07-01",
  },
  {
    id: "e-ro-03",
    name: "Ana Villanueva",
    position: "Planning Officer III",
    office: "Regional Office",
    employmentType: "regular",
    sex: "Female",
    dateHired: "2018-01-22",
  },
  {
    id: "e-ro-04",
    name: "Carlo Mendoza",
    position: "Project Technical Assistant",
    office: "Regional Office",
    employmentType: "contract_of_service",
    sex: "Male",
    dateHired: "2023-06-01",
  },
  {
    id: "e-ro-05",
    name: "Liza Cruz",
    position: "Administrative Aide",
    office: "Regional Office",
    employmentType: "contract_of_service",
    sex: "Female",
    dateHired: "2024-02-12",
  },
  // Oriental Mindoro
  {
    id: "e-or-01",
    name: "Pedro Alcantara",
    position: "Provincial S&T Director",
    office: "Oriental Mindoro",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2014-05-10",
  },
  {
    id: "e-or-02",
    name: "Grace Dela Cruz",
    position: "Science Research Specialist II",
    office: "Oriental Mindoro",
    employmentType: "regular",
    sex: "Female",
    dateHired: "2017-09-18",
  },
  {
    id: "e-or-03",
    name: "Mark Torralba",
    position: "Science Research Specialist I",
    office: "Oriental Mindoro",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2019-11-04",
  },
  {
    id: "e-or-04",
    name: "Jenny Lopez",
    position: "Project Assistant II",
    office: "Oriental Mindoro",
    employmentType: "contract_of_service",
    sex: "Female",
    dateHired: "2022-08-15",
  },
  {
    id: "e-or-05",
    name: "Ryan Flores",
    position: "Science Aide",
    office: "Oriental Mindoro",
    employmentType: "contract_of_service",
    sex: "Male",
    dateHired: "2023-03-20",
  },
  {
    id: "e-or-06",
    name: "Sofia Reyes",
    position: "Encoder",
    office: "Oriental Mindoro",
    employmentType: "contract_of_service",
    sex: "Female",
    dateHired: "2024-01-08",
  },
  // Occidental Mindoro
  {
    id: "e-oc-01",
    name: "Roberto Lim",
    position: "Provincial S&T Director",
    office: "Occidental Mindoro",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2013-02-28",
  },
  {
    id: "e-oc-02",
    name: "Helen Aquino",
    position: "Science Research Specialist II",
    office: "Occidental Mindoro",
    employmentType: "regular",
    sex: "Female",
    dateHired: "2016-04-12",
  },
  {
    id: "e-oc-03",
    name: "Paolo Garcia",
    position: "Project Technical Assistant",
    office: "Occidental Mindoro",
    employmentType: "contract_of_service",
    sex: "Male",
    dateHired: "2022-10-03",
  },
  {
    id: "e-oc-04",
    name: "Nina Bautista",
    position: "Administrative Assistant",
    office: "Occidental Mindoro",
    employmentType: "contract_of_service",
    sex: "Female",
    dateHired: "2023-07-17",
  },
  // Marinduque
  {
    id: "e-mq-01",
    name: "Eduardo Tan",
    position: "Provincial S&T Director",
    office: "Marinduque",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2011-08-09",
  },
  {
    id: "e-mq-02",
    name: "Patricia Ong",
    position: "Science Research Specialist I",
    office: "Marinduque",
    employmentType: "regular",
    sex: "Female",
    dateHired: "2018-06-25",
  },
  {
    id: "e-mq-03",
    name: "Kevin Morales",
    position: "Project Assistant I",
    office: "Marinduque",
    employmentType: "contract_of_service",
    sex: "Male",
    dateHired: "2023-01-16",
  },
  {
    id: "e-mq-04",
    name: "Aira Santos",
    position: "Science Aide",
    office: "Marinduque",
    employmentType: "contract_of_service",
    sex: "Female",
    dateHired: "2024-04-02",
  },
  // Romblon
  {
    id: "e-rm-01",
    name: "Vicente Chavez",
    position: "Provincial S&T Director",
    office: "Romblon",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2010-12-01",
  },
  {
    id: "e-rm-02",
    name: "Diana Perez",
    position: "Science Research Specialist II",
    office: "Romblon",
    employmentType: "regular",
    sex: "Female",
    dateHired: "2015-03-30",
  },
  {
    id: "e-rm-03",
    name: "Francis Uy",
    position: "Science Research Specialist I",
    office: "Romblon",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2020-09-14",
  },
  {
    id: "e-rm-04",
    name: "Michelle Dizon",
    position: "Project Assistant II",
    office: "Romblon",
    employmentType: "contract_of_service",
    sex: "Female",
    dateHired: "2022-05-09",
  },
  {
    id: "e-rm-05",
    name: "Allan Go",
    position: "Encoder",
    office: "Romblon",
    employmentType: "contract_of_service",
    sex: "Male",
    dateHired: "2023-11-21",
  },
  // Palawan
  {
    id: "e-pw-01",
    name: "Ricardo Navarro",
    position: "Provincial S&T Director",
    office: "Palawan",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2009-04-20",
  },
  {
    id: "e-pw-02",
    name: "Catherine Sy",
    position: "Science Research Specialist II",
    office: "Palawan",
    employmentType: "regular",
    sex: "Female",
    dateHired: "2014-10-07",
  },
  {
    id: "e-pw-03",
    name: "Michael Abad",
    position: "Science Research Specialist I",
    office: "Palawan",
    employmentType: "regular",
    sex: "Male",
    dateHired: "2017-02-13",
  },
  {
    id: "e-pw-04",
    name: "Bea Villamor",
    position: "Science Research Specialist I",
    office: "Palawan",
    employmentType: "regular",
    sex: "Female",
    dateHired: "2019-08-26",
  },
  {
    id: "e-pw-05",
    name: "Danilo Ramos",
    position: "Project Technical Assistant",
    office: "Palawan",
    employmentType: "contract_of_service",
    sex: "Male",
    dateHired: "2021-12-06",
  },
  {
    id: "e-pw-06",
    name: "Kristine Lao",
    position: "Project Assistant II",
    office: "Palawan",
    employmentType: "contract_of_service",
    sex: "Female",
    dateHired: "2022-09-19",
  },
  {
    id: "e-pw-07",
    name: "Eric Manalo",
    position: "Science Aide",
    office: "Palawan",
    employmentType: "contract_of_service",
    sex: "Male",
    dateHired: "2023-05-29",
  },
  {
    id: "e-pw-08",
    name: "Paula Ignacio",
    position: "Administrative Aide",
    office: "Palawan",
    employmentType: "contract_of_service",
    sex: "Female",
    dateHired: "2024-03-11",
  },
];

export type OfficeHeadcount = {
  office: EmployeeOffice;
  regular: number;
  cos: number;
  total: number;
};

export const summarizeEmployees = (employees: TaraEmployee[]) => {
  let regular = 0;
  let cos = 0;
  const offices = new Set<EmployeeOffice>();
  for (const e of employees) {
    offices.add(e.office);
    if (e.employmentType === "regular") regular += 1;
    else cos += 1;
  }
  return {
    total: employees.length,
    regular,
    cos,
    offices: offices.size,
  };
};

export const headcountByOffice = (
  employees: TaraEmployee[],
): OfficeHeadcount[] => {
  return EMPLOYEE_OFFICES.map((office) => {
    const inOffice = employees.filter((e) => e.office === office);
    const regular = inOffice.filter(
      (e) => e.employmentType === "regular",
    ).length;
    const cos = inOffice.filter(
      (e) => e.employmentType === "contract_of_service",
    ).length;
    return { office, regular, cos, total: regular + cos };
  }).filter((row) => row.total > 0);
};

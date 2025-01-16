import PDLJS from "peopledatalabs";

const PDL_API_KEY = process.env.PDL_API_KEY || "";

export interface PDLCompanyData {
  employeeCountByRole: Record<string, number>;
  employeeGrowthRate12Month: Record<string, number>;
  founders: {
    name: string;
    title: string;
    yearsOfExperience: number;
    previousRoles: string[];
    education: string[];
  }[];
  techTeam: {
    composition: Record<string, number>;
    averageSeniority: Record<string, number>;
    phdCount: number;
  };
  recentChanges: {
    keyHires: string[];
    keyDepartures: string[];
  };
}

export async function getPDLCompanyData(
  companyName: string,
  companyUrl: string
): Promise<PDLCompanyData | null> {
  const PDLClient = new PDLJS({ apiKey: PDL_API_KEY });

  try {
    // Récupérer les données de l'entreprise
    const companiesRecords = await queryCompanyData(
      PDLClient,
      companyName,
      companyUrl
    );
    if (!companiesRecords?.length) return null;

    const [companyId, employeeCountByRole, employeeGrowthRate12Month] =
      getCompanyData(companiesRecords);

    // Récupérer les données des employés actuels et anciens
    const currentEmployees = await queryEmployeesData(PDLClient, companyId);
    const formerEmployees = await queryOldEmployeesData(PDLClient, companyId);

    // Analyser les données
    const founders = getBackgroundFounders(currentEmployees);
    const [avgSeniority, techComposition, phdCount, recentHires] =
      getTechTeamComposition(currentEmployees);
    const recentDepartures = getKeyDepartures(formerEmployees, companyId);

    return {
      employeeCountByRole,
      employeeGrowthRate12Month,
      founders,
      techTeam: {
        composition: techComposition,
        averageSeniority: avgSeniority,
        phdCount,
      },
      recentChanges: {
        keyHires: recentHires,
        keyDepartures: recentDepartures,
      },
    };
  } catch (error) {
    console.error("PDL data fetch error:", error);
    return null;
  }
}

async function queryCompanyData(
  client: any,
  companyName: string,
  companyUrl: string
): Promise<any[]> {
  const sqlQuery = `SELECT * FROM company WHERE (name = '${companyName}' and website = '${companyUrl}')`;
  const params = {
    dataset: "all",
    searchQuery: sqlQuery,
    size: 10,
    pretty: true,
  };
  const response = await client.company.search.sql(params);
  return response?.data;
}

function getCompanyData(
  companiesRecords: any[]
): [string, Record<string, number>, Record<string, number>] {
  const company = companiesRecords[0];
  return [
    company.id,
    company.employee_count_by_role || {},
    company.employee_growth_rate_12_month_by_role || {},
  ];
}

async function queryEmployeesData(
  client: any,
  companyId: string
): Promise<any[]> {
  const sqlQuery = `SELECT * FROM person WHERE (job_company_id = '${companyId}')`;
  const params = {
    dataset: "all",
    searchQuery: sqlQuery,
    size: 100,
    pretty: true,
  };
  const response = await client.person.search.sql(params);
  return response?.data;
}

async function queryOldEmployeesData(
  client: any,
  companyId: string
): Promise<any[]> {
  const sqlQuery = `SELECT * FROM person WHERE (experience.company.id = '${companyId}')`;
  const params = {
    dataset: "all",
    searchQuery: sqlQuery,
    size: 100,
    pretty: true,
  };
  const response = await client.person.search.sql(params);
  return response?.data;
}

function getBackgroundFounders(profiles: any[]): any[] {
  return profiles
    .filter((profile) => profile.job_title?.toLowerCase().includes("founder"))
    .map((profile) => ({
      name: profile.full_name,
      title: profile.job_title,
      yearsOfExperience: profile.inferred_years_experience,
      previousRoles: profile.experience?.map(
        (exp: any) => `${exp.title?.name} at ${exp.company?.name}`
      ),
      education: profile.education?.map(
        (ed: any) => `${ed.degrees.join(", ")} in ${ed.majors.join(", ")}`
      ),
    }));
}

function getTechTeamComposition(
  profiles: any[]
): [Record<string, number>, Record<string, number>, number, string[]] {
  const techTeam = profiles.filter((p) => p.job_title_role === "engineering");
  const composition: Record<string, number> = {};
  const seniority: Record<string, number> = {};
  let phdCount = 0;
  const recentHires: string[] = [];

  techTeam.forEach((profile) => {
    composition[profile.job_title] = (composition[profile.job_title] || 0) + 1;
    seniority[profile.job_title] = profile.inferred_years_experience || 0;
    if (profile.headline?.toLowerCase().includes("phd")) phdCount++;
  });

  return [seniority, composition, phdCount, recentHires];
}

function getKeyDepartures(profiles: any[], companyId: string): string[] {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return profiles
    .filter((profile) => {
      const endDate = new Date(profile.experience?.[0]?.end_date || "");
      return endDate > sixMonthsAgo;
    })
    .map((profile) => profile.job_title)
    .filter((title) => !title.toLowerCase().includes("junior"));
}

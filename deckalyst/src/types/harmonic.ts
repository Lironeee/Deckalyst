export interface HarmonicCompany {
  name?: string;
  description?: string;
  founded_date?: string;
  employee_count?: number;
  funding_total?: number;
  website_domain?: string;
  industry?: string;
  company_type?: string;
  stock_symbol?: string;

  location?: {
    country?: string;
    city?: string;
    state?: string;
    address?: string;
    postal_code?: string;
  };

  social_media?: {
    linkedin_url?: string;
    twitter_url?: string;
    facebook_url?: string;
    linkedin_followers?: number;
    twitter_followers?: number;
    facebook_followers?: number;
    linkedin_follower_growth?: {
      current: number;
      last_month: number;
      last_year: number;
      growth_rate: number;
    };
  };

  funding_rounds?: Array<{
    date: string;
    amount: number;
    currency: string;
    round_type: string;
    investors: Array<{
      name: string;
      type: string;
      website?: string;
    }>;
  }>;

  employee_count_history?: Array<{
    date: string;
    count: number;
    growth_rate?: number;
  }>;

  press_mentions?: Array<{
    date: string;
    title: string;
    source: string;
    url: string;
    sentiment?: "positive" | "neutral" | "negative";
  }>;

  awards?: Array<{
    date: string;
    name: string;
    organization: string;
    description?: string;
  }>;

  employees?: Array<{
    title: string;
    department: string;
    role_type: string;
    location?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    seniority_level?: string;
    contact?: {
      linkedin_url?: string;
      email?: string;
    };
    previous_experience?: Array<{
      company: string;
      title: string;
      start_date: string;
      end_date: string;
      duration: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      start_date?: string;
      end_date?: string;
    }>;
    skills?: string[];
  }>;

  employee_highlights?: Array<{
    category: string;
    text: string;
    employee?: {
      name: string;
      title: string;
    };
  }>;

  tech_stack?: Array<{
    category: string;
    technologies: string[];
  }>;

  competitors?: Array<{
    name: string;
    website?: string;
    description?: string;
    similarity_score?: number;
  }>;

  market_presence?: {
    regions: string[];
    languages: string[];
    target_industries?: string[];
    customer_segments?: string[];
  };

  growth_signals?: {
    hiring_velocity?: {
      current_openings: number;
      monthly_growth: number;
      departments: Record<string, number>;
    };
    product_launches?: Array<{
      date: string;
      name: string;
      description: string;
    }>;
    partnerships?: Array<{
      date: string;
      partner: string;
      type: string;
      description: string;
    }>;
  };

  financial_metrics?: {
    revenue_range?: string;
    burn_rate?: number;
    last_funding_date?: string;
    total_funding?: number;
    valuation?: number;
  };
}

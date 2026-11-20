export type FinancialGoal =
  | 'emergency_fund'
  | 'first_investment'
  | 'saving_for_purchase'
  | 'learning_basics';

export type IncomeRange =
  | 'under_5k'
  | '5k_to_15k'
  | '15k_to_35k'
  | 'above_35k';

export type ExpenseRatio =
  | 'under_50'
  | '50_to_75'
  | '75_to_95'
  | 'above_95';

export type SavingsLevel =
  | 'starting_0_5k'
  | 'cushion_5k_25k'
  | 'growing_25k_1l'
  | 'solid_above_1l';

export type EmergencyFundMonths =
  | 'none'
  | 'under_1_month'
  | '1_to_3_months'
  | '3_to_6_plus_months';

export type ExperienceLevel = 'none' | 'beginner' | 'some';

export type RiskPreference = 'low' | 'medium' | 'high';

export type KnowledgeLevel = 'new' | 'basic' | 'moderate';

export type BiggestConfusion =
  | 'saving'
  | 'budgeting'
  | 'investing'
  | 'insurance'
  | 'terminology';

export interface ScoreBreakdown {
  savingsAndEmergency: number; // out of 30
  expenseControl: number;      // out of 25
  investmentReadiness: number; // out of 25
  financialKnowledge: number;  // out of 20
}

export interface UserFinancialProfile {
  id: string;
  name?: string;
  city?: string;
  goal: FinancialGoal;
  incomeRange: IncomeRange;
  expenseRatio: ExpenseRatio;
  savingsLevel: SavingsLevel;
  emergencyFundMonths: EmergencyFundMonths;
  experience: ExperienceLevel;
  riskPreference: RiskPreference;
  knowledgeLevel: KnowledgeLevel;
  biggestConfusion: BiggestConfusion;
  score: number;
  scoreLabel: string;
  scoreBreakdown: ScoreBreakdown;
  scoreExplanation: string;
  educationalSuggestions: string[];
  recommendedTopics: LearningTopic[];
  completedAt: string;
}

export interface LearningTopic {
  id: string;
  title: string;
  summary: string;
  starterPrompt: string;
  estimatedMinutes: number;
  dashboardSectionId?: EducationalSectionId;
}

export type EducationalSectionId =
  | 'budgeting'
  | 'savings'
  | 'mutual_funds'
  | 'stocks'
  | 'fd'
  | 'ppf'
  | 'risk_management';

export interface SavedComparison {
  id: string;
  monthlyAmount: number;
  durationYears: number;
  fdRate: number;
  sipRate: number;
  ppfRate: number;
  totalInvested: number;
  fdMaturity: number;
  sipMaturity: number;
  ppfMaturity: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  simpleSummary?: string;
  createdAt: string;
}

export interface FinancialOption {
  id: string;
  name: string;
  shortCategory: string;
  riskLevel: 'Very Low' | 'Low' | 'Low to Moderate' | 'Moderate to High';
  riskKey: 'low' | 'medium' | 'high';
  expectedReturnRange: string;
  lockIn: string;
  liquidity: string;
  minimumAmount: string;
  whoItSuits: string;
  matchingGoals: FinancialGoal[];
  matchingRisks: RiskPreference[];
  keyTakeaway: string;
}

export interface AdminMetrics {
  totalSignups: number;
  waitlistCount: number;
  workshopStudentCount: number;
  collegeEnquiryCount: number;
  completedAssessments: number;
  completedGuidanceSessions: number;
  sessionCompletionRate: number;
  wtpResponses: {
    total: number;
    yes: number;
    maybe: number;
    no: number;
    yesRate: number;
  };
  mostRequestedTopics: Array<{ topic: string; count: number }>;
  feedbackSummary: {
    total: number;
    usefulYes: number;
    useAgainYes: number;
  };
  recentWaitlist: Array<{
    id: string;
    name: string;
    email: string;
    college: string;
    yearCourse: string;
    createdAt: string;
  }>;
  recentWorkshops: Array<{
    id: string;
    type: 'student' | 'college';
    name: string;
    organization: string;
    city: string;
    email: string;
    detail: string;
    createdAt: string;
  }>;
  recentFeedback: Array<{
    id: string;
    useful: string;
    useAgain: string;
    topHelpTopic: string;
    notes: string;
    createdAt: string;
  }>;
  recentWtp: Array<{
    id: string;
    willingness: 'Yes' | 'Maybe' | 'No';
    feedback: string;
    createdAt: string;
  }>;
}

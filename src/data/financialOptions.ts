import type {
  EmergencyFundMonths,
  ExpenseRatio,
  FinancialGoal,
  FinancialOption,
  KnowledgeLevel,
  RiskPreference,
} from '../types';

export const FINANCIAL_OPTIONS: FinancialOption[] = [
  {
    id: 'savings_account',
    name: 'Savings Account',
    shortCategory: 'Bank Cash',
    riskLevel: 'Very Low',
    riskKey: 'low',
    expectedReturnRange: '2.5% – 4.0% p.a.',
    lockIn: 'None',
    liquidity: 'Instant (UPI / ATM 24x7)',
    minimumAmount: '₹0 – ₹5,000 (bank dependent)',
    whoItSuits: 'Students keeping emergency money or monthly hostel and living expenses ready.',
    matchingGoals: ['emergency_fund', 'learning_basics'],
    matchingRisks: ['low', 'medium', 'high'],
    keyTakeaway: 'Keep 1–3 months of essential expenses here so you never have to break an investment in an emergency.',
  },
  {
    id: 'fixed_deposit',
    name: 'Fixed Deposit (FD)',
    shortCategory: 'Guaranteed Bank Deposit',
    riskLevel: 'Very Low',
    riskKey: 'low',
    expectedReturnRange: '6.5% – 7.5% p.a.',
    lockIn: '7 days – 10 years (early exit penalty applies)',
    liquidity: 'High (can break early with ~0.5–1% penalty)',
    minimumAmount: '₹1,000 (or ₹500 in some banks)',
    whoItSuits: 'Beginners saving a lump sum for a fixed short-term goal like a laptop, exam fee, or trip.',
    matchingGoals: ['emergency_fund', 'saving_for_purchase'],
    matchingRisks: ['low', 'medium'],
    keyTakeaway: 'Predictable returns with almost zero risk, though interest is taxed at your slab and barely beats inflation.',
  },
  {
    id: 'recurring_deposit',
    name: 'Recurring Deposit (RD)',
    shortCategory: 'Monthly Bank Saving',
    riskLevel: 'Very Low',
    riskKey: 'low',
    expectedReturnRange: '6.25% – 7.25% p.a.',
    lockIn: '6 months – 10 years',
    liquidity: 'Moderate (early closure allowed with minor penalty)',
    minimumAmount: '₹100 – ₹500 per month',
    whoItSuits: 'Students saving a small fixed amount every month from pocket money or a stipend for a near-term goal.',
    matchingGoals: ['saving_for_purchase', 'learning_basics'],
    matchingRisks: ['low'],
    keyTakeaway: 'Builds a monthly saving habit without market ups and downs.',
  },
  {
    id: 'mutual_fund_sip',
    name: 'Mutual Fund (SIP)',
    shortCategory: 'Market-Linked Investing',
    riskLevel: 'Moderate to High',
    riskKey: 'high',
    expectedReturnRange: '10% – 13% p.a. (market-linked, not guaranteed)',
    lockIn: 'None (except ELSS tax-saver: 3 years)',
    liquidity: 'High (2–3 working days to bank account)',
    minimumAmount: '₹100 – ₹500 per month',
    whoItSuits: 'Young earners or students investing for 3–5+ years who can stay calm during market dips.',
    matchingGoals: ['first_investment', 'learning_basics'],
    matchingRisks: ['medium', 'high'],
    keyTakeaway: 'Starts small via SIPs and compounds over years, but returns are market-linked and not guaranteed.',
  },
  {
    id: 'ppf',
    name: 'Public Provident Fund (PPF)',
    shortCategory: 'Govt-Backed Long Term',
    riskLevel: 'Very Low',
    riskKey: 'low',
    expectedReturnRange: '7.1% p.a. (govt-reviewed quarterly, tax-free)',
    lockIn: '15 years (partial withdrawal after year 6)',
    liquidity: 'Low (strict lock-in rules)',
    minimumAmount: '₹500 per year',
    whoItSuits: 'Young professionals wanting safe, tax-free long-term compounding they will not touch early.',
    matchingGoals: ['first_investment'],
    matchingRisks: ['low', 'medium'],
    keyTakeaway: 'Government-backed safety and tax-free maturity, best only for money you will not need for 15 years.',
  },
  {
    id: 'insurance',
    name: 'Term & Health Insurance',
    shortCategory: 'Financial Protection',
    riskLevel: 'Low',
    riskKey: 'low',
    expectedReturnRange: 'Protection cover (not an investment return)',
    lockIn: 'Annual renewal policy term',
    liquidity: 'N/A (pays out on hospitalization or covered event)',
    minimumAmount: '₹500 – ₹1,200/month approx. depending on age & cover',
    whoItSuits: 'Young professionals with dependents (term life) and anyone wanting hospital bill protection (health).',
    matchingGoals: ['emergency_fund', 'learning_basics'],
    matchingRisks: ['low', 'medium', 'high'],
    keyTakeaway: 'Insurance protects your savings from sudden medical bills; never mix pure protection with complex investment policies.',
  },
  {
    id: 'gold_etfs',
    name: 'Gold / Gold ETFs',
    shortCategory: 'Commodity Diversification',
    riskLevel: 'Low to Moderate',
    riskKey: 'medium',
    expectedReturnRange: '8% – 10% p.a. (long-term historical average, fluctuates)',
    lockIn: 'None (ETFs trade on exchange; SGBs have 8-year tenure)',
    liquidity: 'High for Gold ETFs (market hours)',
    minimumAmount: '₹100 – ₹1,000 approx. (1 ETF unit / digital SIP)',
    whoItSuits: 'Beginners looking to diversify 5–10% of savings as a hedge against inflation and rupee volatility.',
    matchingGoals: ['first_investment', 'saving_for_purchase'],
    matchingRisks: ['medium', 'high'],
    keyTakeaway: 'Paper gold like ETFs avoids making charges and storage worries, best kept as a small slice alongside core savings.',
  },
];

export const GOAL_LABELS: Record<FinancialGoal, string> = {
  emergency_fund: 'Build an emergency fund',
  first_investment: 'Make my first investment',
  saving_for_purchase: 'Save for a specific purchase',
  learning_basics: 'Learn personal finance basics',
};

export const RISK_LABELS: Record<RiskPreference, string> = {
  low: 'Low risk (Safety first)',
  medium: 'Medium risk (Balanced)',
  high: 'High risk (Long-term growth)',
};

export const INCOME_LABELS: Record<string, string> = {
  under_5k: 'Under ₹5,000 / month',
  '5k_to_15k': '₹5,000 – ₹15,000 / month',
  '15k_to_35k': '₹15,000 – ₹35,000 / month',
  above_35k: 'Above ₹35,000 / month',
};

export const EXPENSE_RATIO_LABELS: Record<ExpenseRatio, string> = {
  under_50: 'Under 50% of monthly money (strong surplus)',
  '50_to_75': '50% – 75% of monthly money (balanced)',
  '75_to_95': '75% – 95% of monthly money (tight buffer)',
  above_95: '95%+ or borrowing occasionally (no surplus yet)',
};

export const SAVINGS_LABELS: Record<string, string> = {
  starting_0_5k: 'Just starting (₹0 – ₹5,000)',
  cushion_5k_25k: 'Small cushion (₹5,000 – ₹25,000)',
  growing_25k_1l: 'Growing base (₹25,000 – ₹1,00,000)',
  solid_above_1l: 'Solid base (Above ₹1,00,000)',
};

export const EMERGENCY_FUND_LABELS: Record<EmergencyFundMonths, string> = {
  none: '0 months — no dedicated emergency cash yet',
  under_1_month: 'Less than 1 month of expenses saved',
  '1_to_3_months': '1 to 3 months of essential expenses ready',
  '3_to_6_plus_months': '3 to 6+ months of essential expenses ready',
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  none: 'None — completely new',
  beginner: 'Beginner — read a little, not started',
  some: 'Some — tried FD or a small SIP',
};

export const KNOWLEDGE_LABELS: Record<KnowledgeLevel, string> = {
  new: 'New — terms like inflation, SIP, and lock-in still feel unclear',
  basic: 'Basic — I know what FDs and SIPs are, unsure how to combine them',
  moderate: 'Moderate — I understand basics and want clearer risk & tax comparisons',
};

export const CONFUSION_LABELS: Record<string, string> = {
  saving: 'How much and where to save',
  budgeting: 'Managing monthly pocket money / salary',
  investing: 'Choosing between FD, SIP, and PPF',
  insurance: 'Understanding health & term insurance',
  terminology: 'Decoding jargon like NAV, XIRR, lock-in, inflation',
};

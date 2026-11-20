import type {
  BiggestConfusion,
  EducationalSectionId,
  EmergencyFundMonths,
  ExpenseRatio,
  ExperienceLevel,
  FinancialGoal,
  IncomeRange,
  KnowledgeLevel,
  LearningTopic,
  RiskPreference,
  SavingsLevel,
  ScoreBreakdown,
} from '../types';

export function computeConfidenceProfileDetails(input: {
  goal: FinancialGoal;
  incomeRange: IncomeRange;
  expenseRatio: ExpenseRatio;
  savingsLevel: SavingsLevel;
  emergencyFundMonths: EmergencyFundMonths;
  experience: ExperienceLevel;
  riskPreference: RiskPreference;
  knowledgeLevel: KnowledgeLevel;
  biggestConfusion: BiggestConfusion;
}): {
  score: number;
  scoreLabel: string;
  scoreBreakdown: ScoreBreakdown;
  scoreExplanation: string;
  educationalSuggestions: string[];
  recommendedTopics: LearningTopic[];
} {
  // 1. Savings & Emergency Cushion (max 30)
  let savingsPts = 4;
  if (input.savingsLevel === 'cushion_5k_25k') savingsPts = 8;
  else if (input.savingsLevel === 'growing_25k_1l') savingsPts = 12;
  else if (input.savingsLevel === 'solid_above_1l') savingsPts = 15;

  let emergencyPts = 2;
  if (input.emergencyFundMonths === 'under_1_month') emergencyPts = 6;
  else if (input.emergencyFundMonths === '1_to_3_months') emergencyPts = 11;
  else if (input.emergencyFundMonths === '3_to_6_plus_months') emergencyPts = 15;

  const savingsAndEmergency = savingsPts + emergencyPts;

  // 2. Expense Control (max 25)
  let expensePts = 6;
  if (input.expenseRatio === '75_to_95') expensePts = 12;
  else if (input.expenseRatio === '50_to_75') expensePts = 19;
  else if (input.expenseRatio === 'under_50') expensePts = 25;

  // 3. Investment Readiness (max 25)
  let expPts = 5;
  if (input.experience === 'beginner') expPts = 11;
  else if (input.experience === 'some') expPts = 17;

  let incomePts = 3;
  if (input.incomeRange === '5k_to_15k') incomePts = 5;
  else if (input.incomeRange === '15k_to_35k') incomePts = 7;
  else if (input.incomeRange === 'above_35k') incomePts = 8;

  const investmentReadiness = Math.min(25, expPts + incomePts);

  // 4. Financial Knowledge (max 20)
  let financialKnowledge = 6;
  if (input.knowledgeLevel === 'basic') financialKnowledge = 13;
  else if (input.knowledgeLevel === 'moderate') financialKnowledge = 19;

  const totalScore = Math.max(
    18,
    Math.min(100, savingsAndEmergency + expensePts + investmentReadiness + financialKnowledge)
  );

  let scoreLabel = 'Foundation Builder';
  if (totalScore >= 75) scoreLabel = 'Confident Planner';
  else if (totalScore >= 55) scoreLabel = 'Steady Saver';
  else if (totalScore >= 38) scoreLabel = 'Growing Beginner';

  // Tailored explanation of the score
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (expensePts >= 19) {
    strengths.push('you keep monthly expenses under control with room to save');
  } else {
    gaps.push('tight monthly expenses leave very little surplus for unexpected bills');
  }

  if (emergencyPts >= 11) {
    strengths.push('you already have at least 1 month of emergency cushion');
  } else {
    gaps.push('building a 1–3 month emergency fund before taking market risk is your safest next step');
  }

  if (financialKnowledge >= 13) {
    strengths.push('you already know basic terms like FDs and SIPs');
  } else {
    gaps.push('learning core terms in plain language will help you avoid confusing advice');
  }

  const strengthText =
    strengths.length > 0
      ? `Your score of ${totalScore}/100 puts you at the "${scoreLabel}" stage because ${strengths.join(' and ')}.`
      : `Your score of ${totalScore}/100 puts you at the "${scoreLabel}" stage—a very normal starting point for students and young earners.`;

  const gapText =
    gaps.length > 0
      ? ` Right now, ${gaps.join(', while ')}.`
      : ' Focus on matching each rupee to the right timeline—short-term safety first, long-term compounding second.';

  const scoreExplanation = `${strengthText}${gapText}`;

  // Concrete Educational Suggestions
  const educationalSuggestions: string[] = [];
  if (input.emergencyFundMonths === 'none' || input.emergencyFundMonths === 'under_1_month') {
    educationalSuggestions.push(
      'Build a dedicated ₹10,000–₹25,000 emergency fund in a liquid savings account or short FD before starting volatile market investments.'
    );
  }
  if (input.expenseRatio === '75_to_95' || input.expenseRatio === 'above_95') {
    educationalSuggestions.push(
      'Track your top 3 monthly spending categories for 30 days and move ₹500–₹1,000 into a separate savings account on the 1st of every month.'
    );
  } else {
    educationalSuggestions.push(
      'Automate your monthly surplus right after receiving pocket money or salary so saving happens before discretionary spending.'
    );
  }

  if (input.goal === 'first_investment') {
    educationalSuggestions.push(
      'Use our FD vs SIP vs PPF Comparison Calculator to see how ₹1,000–₹2,000/month grows over 3, 5, and 10 years—remembering SIPs are market-linked and not guaranteed.'
    );
  } else if (input.goal === 'saving_for_purchase') {
    educationalSuggestions.push(
      'For goals under 2 years (like a laptop or course fee), prioritize capital-safe options like FDs or RDs over equity mutual funds.'
    );
  }

  if (input.knowledgeLevel === 'new' || input.biggestConfusion === 'terminology') {
    educationalSuggestions.push(
      'Spend 10 minutes in the Educational Dashboard reading Budgeting, Savings, and Risk Management before comparing products.'
    );
  }

  // Personalized Learning Path
  const topics: LearningTopic[] = [];

  if (
    input.emergencyFundMonths === 'none' ||
    input.emergencyFundMonths === 'under_1_month' ||
    input.goal === 'emergency_fund'
  ) {
    topics.push({
      id: 'emergency-cushion',
      title: 'Building Your First ₹10,000–₹25,000 Safety Net',
      summary:
        'Why an emergency fund in a bank savings account or short FD comes before any market investment.',
      starterPrompt:
        'How much emergency fund should I build first based on my current savings and expenses, and where should I keep it?',
      estimatedMinutes: 3,
      dashboardSectionId: 'savings',
    });
  }

  if (
    input.expenseRatio === '75_to_95' ||
    input.expenseRatio === 'above_95' ||
    input.biggestConfusion === 'budgeting'
  ) {
    topics.push({
      id: 'simple-budget',
      title: 'The 50-30-20 Budget Adapted for Student Life',
      summary:
        'How to split monthly pocket money or your first salary into essentials, lifestyle, and automatic savings.',
      starterPrompt:
        'How should I budget my monthly income or pocket money using a simple rule with ₹ examples?',
      estimatedMinutes: 4,
      dashboardSectionId: 'budgeting',
    });
  }

  if (input.goal === 'first_investment' || input.biggestConfusion === 'investing') {
    topics.push({
      id: 'fd-vs-sip',
      title: 'FD vs Mutual Fund SIP vs PPF: Matching Your Timeline',
      summary:
        'Understand guaranteed returns vs market-linked growth, lock-ins, and why SIP returns fluctuate.',
      starterPrompt:
        'Explain FD vs Mutual Fund SIP vs PPF in simple words for my goal and risk preference.',
      estimatedMinutes: 4,
      dashboardSectionId: 'mutual_funds',
    });
  }

  if (input.biggestConfusion === 'insurance' || input.experience === 'some') {
    topics.push({
      id: 'insurance-basics',
      title: 'Risk Management: Health & Term Insurance First',
      summary:
        'Why hospital bills wipe out student savings and why pure protection differs from investment plans.',
      starterPrompt:
        'Explain health insurance and term insurance simply, and when a young professional actually needs them.',
      estimatedMinutes: 4,
      dashboardSectionId: 'risk_management',
    });
  }

  const fallbackSections: Array<{
    id: string;
    title: string;
    summary: string;
    starterPrompt: string;
    minutes: number;
    section: EducationalSectionId;
  }> = [
    {
      id: 'ppf-long-term',
      title: 'Understanding PPF & 15-Year Tax-Free Compounding',
      summary: 'How government-backed PPF compares to bank FDs when saving for long-term stability.',
      starterPrompt: 'How does PPF work in India, and when does its 15-year lock-in make sense for a young earner?',
      minutes: 3,
      section: 'ppf',
    },
    {
      id: 'stocks-basics',
      title: 'Stocks Explained Without Hype',
      summary: 'What buying a share actually means, why prices move daily, and risks beginners must respect.',
      starterPrompt: 'Explain how stocks work in India in simple words and why beginners should be cautious.',
      minutes: 4,
      section: 'stocks',
    },
    {
      id: 'fd-basics',
      title: 'How Fixed Deposits Work in India',
      summary: 'Predictable interest, premature exit penalties, and when inflation matters.',
      starterPrompt: 'Explain Fixed Deposits in simple words with a ₹10,000 example and mention any downsides.',
      minutes: 3,
      section: 'fd',
    },
  ];

  for (const fb of fallbackSections) {
    if (topics.length >= 4) break;
    if (!topics.some((t) => t.id === fb.id)) {
      topics.push({
        id: fb.id,
        title: fb.title,
        summary: fb.summary,
        starterPrompt: fb.starterPrompt,
        estimatedMinutes: fb.minutes,
        dashboardSectionId: fb.section,
      });
    }
  }

  return {
    score: totalScore,
    scoreLabel,
    scoreBreakdown: {
      savingsAndEmergency,
      expenseControl: expensePts,
      investmentReadiness,
      financialKnowledge,
    },
    scoreExplanation,
    educationalSuggestions,
    recommendedTopics: topics.slice(0, 4),
  };
}

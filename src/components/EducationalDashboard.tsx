import { useState } from 'react';
import type { User } from 'firebase/auth';
import { ArrowRight, Check } from 'lucide-react';
import type { EducationalSectionId } from '../types';
import AccountSyncBar from './AccountSyncBar';

interface EducationalTopicContent {
  id: EducationalSectionId;
  number: string;
  title: string;
  subtitle: string;
  simpleExplanation: string[];
  rupeeExampleTitle: string;
  rupeeExample: string;
  watchOut: string[];
  aiPrompt: string;
}

const EDUCATIONAL_SECTIONS: EducationalTopicContent[] = [
  {
    id: 'budgeting',
    number: '01',
    title: 'Budgeting',
    subtitle: 'Tell your pocket money or salary where to go before it disappears',
    simpleExplanation: [
      'A budget is not a punishment—it is simply a monthly plan that splits your money between must-pay bills, everyday fun, and future savings.',
      'For Indian students and freshers, the easiest starting point is the 50-30-20 framework: 50% for essentials (hostel/rent, food, travel, phone), 30% for wants (eating out, shopping, trips), and 20% for savings.',
      'The most important habit is paying yourself first: move your savings on the day you receive pocket money or salary instead of hoping money is left over at month-end.',
    ],
    rupeeExampleTitle: 'Example on ₹20,000 monthly pocket money / stipend',
    rupeeExample:
      '₹10,000 goes to hostel, mess, and travel · ₹6,000 goes to weekends, cafes, and subscriptions · ₹4,000 is moved on the 1st of the month into a separate savings account or RD.',
    watchOut: [
      'Watch out for small ₹199–₹499 UPI spends and No-Cost EMIs that silently eat up next month’s budget.',
      'If your essentials exceed 60% in a metro city like Delhi-NCR, aim for 10% savings first rather than giving up.',
    ],
    aiPrompt: 'How do I build a realistic monthly budget on ₹15,000–₹25,000 in India without feeling restricted?',
  },
  {
    id: 'savings',
    number: '02',
    title: 'Savings',
    subtitle: 'Build a safety buffer before taking any investment risk',
    simpleExplanation: [
      'Saving means setting money aside in safe, easy-to-reach places so you can handle emergencies or near-term goals without borrowing.',
      'Your first savings milestone is an Emergency Fund—enough cash to cover 3 months of basic living expenses kept in a bank savings account or sweep-in FD.',
      'Why save before investing? If your laptop breaks or you face an unexpected medical bill, an emergency fund prevents you from selling investments at a loss.',
    ],
    rupeeExampleTitle: 'Example emergency cushion for a college student',
    rupeeExample:
      'If your essential monthly expenses are ₹8,000, a 3-month emergency goal is ₹24,000. Saving ₹2,000/month gets you halfway (₹12,000) in just 6 months.',
    watchOut: [
      'Keeping large amounts idle in a 3% savings account for 10+ years loses purchasing power to ~6% inflation.',
      'Do not lock your emergency money into a 15-year PPF or volatile stocks.',
    ],
    aiPrompt: 'What is the difference between saving and investing, and how much emergency fund should I keep?',
  },
  {
    id: 'mutual_funds',
    number: '03',
    title: 'Mutual Funds',
    subtitle: 'Pool small amounts into a diversified basket managed by professionals',
    simpleExplanation: [
      'A mutual fund collects money from thousands of investors and invests it together in a basket of company shares (Equity funds), government/corporate bonds (Debt funds), or both (Hybrid funds).',
      'Instead of picking individual companies yourself, you buy units of the fund at its daily price, called the NAV (Net Asset Value).',
      'Most beginners invest through a SIP (Systematic Investment Plan)—an automatic monthly transfer starting as low as ₹100 or ₹500.',
    ],
    rupeeExampleTitle: 'Example ₹1,000/month SIP over 5 years',
    rupeeExample:
      'You put in ₹1,000 every month (₹60,000 total over 5 years). Because markets move up and down, your ₹1,000 buys more units when markets dip and fewer when markets rise.',
    watchOut: [
      'Mutual fund SIP returns are market-linked and NOT guaranteed—short-term values can drop 10%–30% during market downturns.',
      'Always check the Expense Ratio (annual management fee) and match equity funds only to goals 5+ years away.',
    ],
    aiPrompt: 'Explain how a Mutual Fund SIP works in simple words, including NAV, expense ratio, and market risk.',
  },
  {
    id: 'stocks',
    number: '04',
    title: 'Stocks',
    subtitle: 'Owning a tiny share of a real business—with real ups and downs',
    simpleExplanation: [
      'When you buy 1 stock (share) of an Indian company listed on NSE or BSE, you become a part-owner of that business.',
      'Over many years, if the company grows its profits, its share price and dividends tend to grow too. However, in the short term, share prices swing daily based on news, earnings, and investor mood.',
      'Picking individual stocks requires reading company financials and understanding business risks—most students start with diversified index mutual funds before buying individual shares.',
    ],
    rupeeExampleTitle: 'Example of stock price movement',
    rupeeExample:
      'Suppose you buy 2 shares of a company at ₹1,500 each (₹3,000 total). Six months later, the price could be ₹1,800 (+₹600) or ₹1,200 (-₹600) depending on business performance and market sentiment.',
    watchOut: [
      'Never invest rent, tuition fees, or borrowed money into stocks or intraday trading.',
      'Social-media "hot stock tips" are risky; always verify business fundamentals and remember losses are real if a company underperforms.',
    ],
    aiPrompt: 'Explain stocks vs mutual funds for a beginner in India, and why intraday trading is risky for students.',
  },
  {
    id: 'fd',
    number: '05',
    title: 'Fixed Deposits (FD)',
    subtitle: 'Predictable bank returns for short- and medium-term goals',
    simpleExplanation: [
      'A Fixed Deposit lets you lock a lump sum with a bank for a fixed period (from 7 days up to 10 years) at a pre-decided interest rate.',
      'Unlike stocks or equity mutual funds, an FD’s interest rate is fixed when you open it—you know the exact maturity amount on day one.',
      'Bank deposits up to ₹5 lakh per bank are insured by DICGC (a subsidiary of RBI), making FDs one of the safest places for near-term goals.',
    ],
    rupeeExampleTitle: 'Example ₹25,000 FD for 2 years at 7% p.a.',
    rupeeExample:
      'Depositing ₹25,000 for 2 years at 7% p.a. (quarterly compounding) grows to roughly ₹28,722—earning ₹3,722 with near-zero market volatility.',
    watchOut: [
      'If you break an FD before maturity, banks usually charge a 0.5%–1% interest penalty.',
      'FD interest is added to your taxable income once you cross taxable income slabs, so post-tax returns may barely beat inflation.',
    ],
    aiPrompt: 'When should a college student or fresh graduate choose an FD instead of a mutual fund?',
  },
  {
    id: 'ppf',
    number: '06',
    title: 'Public Provident Fund (PPF)',
    subtitle: 'Government-backed, tax-free long-term savings with a 15-year lock-in',
    simpleExplanation: [
      'PPF is a savings scheme backed by the Government of India, available at post offices and major banks.',
      'The interest rate (currently 7.1% p.a., reviewed quarterly by the government) and the final maturity amount are completely tax-free under EEE (Exempt-Exempt-Exempt) status.',
      'You can start with as little as ₹500 per financial year (up to ₹1.5 lakh/year), making it flexible for young earners who want guaranteed long-term wealth.',
    ],
    rupeeExampleTitle: 'Example ₹2,000/month in PPF for 15 years at 7.1% p.a.',
    rupeeExample:
      'Saving ₹24,000/year (₹3,60,000 total over 15 years) grows to roughly ₹6,50,000+ completely tax-free, backed by sovereign government guarantee.',
    watchOut: [
      'PPF has a strict 15-year lock-in period (with limited partial withdrawals only after year 6).',
      'Do not put money into PPF that you might need for an MBA fee, wedding, or emergency in the next 3–5 years.',
    ],
    aiPrompt: 'Is PPF good for someone in their early 20s? Explain the 15-year lock-in in simple words.',
  },
  {
    id: 'risk_management',
    number: '07',
    title: 'Risk Management',
    subtitle: 'Protect your savings before chasing higher returns',
    simpleExplanation: [
      'Risk management is about making sure one bad event—like a hospital stay, market crash, or job gap—does not wipe out years of hard-earned savings.',
      'Three pillars protect young earners: (1) an emergency fund in safe cash, (2) personal health insurance so medical bills do not drain family savings, and (3) pure term life insurance once people financially depend on your income.',
      'Diversification—spreading money across safe savings and growth assets instead of putting everything into one stock or crypto coin—keeps your overall risk balanced.',
    ],
    rupeeExampleTitle: 'Example: Why Health Insurance protects your investments',
    rupeeExample:
      'A sudden ₹1,50,000 hospital bill can wipe out 3 years of ₹4,000/month SIP savings overnight. A basic ₹5 lakh individual health cover (~₹600–₹800/month in your 20s) keeps your savings untouched.',
    watchOut: [
      'Avoid mixing insurance and investment in expensive endowment or ULIP plans until you fully understand lock-ins and returns.',
      'Remember: higher expected return always comes with higher risk—never believe any "guaranteed 20% return" pitch.',
    ],
    aiPrompt: 'Explain risk management for a 23-year-old starting their first job in India, including health vs term insurance.',
  },
];

interface EducationalDashboardProps {
  initialSection?: EducationalSectionId;
  completedTopics: EducationalSectionId[];
  onToggleComplete: (topicId: EducationalSectionId) => Promise<void> | void;
  onAskAiTopic: (prompt: string) => void;
  user: User | null;
  authReady: boolean;
  syncStatusText?: string;
}

export default function EducationalDashboard({
  initialSection = 'budgeting',
  completedTopics,
  onToggleComplete,
  onAskAiTopic,
  user,
  authReady,
  syncStatusText,
}: EducationalDashboardProps) {
  const [activeId, setActiveId] = useState<EducationalSectionId>(initialSection);
  const [savingTopic, setSavingTopic] = useState(false);

  const activeTopic =
    EDUCATIONAL_SECTIONS.find((s) => s.id === activeId) || EDUCATIONAL_SECTIONS[0];
  const isCompleted = completedTopics.includes(activeTopic.id);
  const progressPct = Math.round(
    (completedTopics.length / EDUCATIONAL_SECTIONS.length) * 100
  );

  const handleToggle = async (topicId: EducationalSectionId) => {
    setSavingTopic(true);
    try {
      await onToggleComplete(topicId);
    } finally {
      setSavingTopic(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm font-medium text-[#0F766E]">
            Educational Dashboard · Plain-English Money Guides
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
            Learn the 7 building blocks of personal finance
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Short, jargon-free guides with real ₹ examples and honest risk notes—designed for Indian students and young earners.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 space-y-1.5 min-w-[210px]">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 tabular-nums">
            <span>Reading Progress</span>
            <span>
              {completedTopics.length} / {EDUCATIONAL_SECTIONS.length} topics
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0F766E] rounded-full transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <AccountSyncBar
        user={user}
        authReady={authReady}
        syncStatusText={syncStatusText}
      />

      {/* Main Layout: Topic Navigator + Lesson Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation List */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-3 space-y-1">
          {EDUCATIONAL_SECTIONS.map((section) => {
            const active = section.id === activeTopic.id;
            const done = completedTopics.includes(section.id);
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F2942] text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono text-xs font-semibold shrink-0 ${
                      active ? 'text-[#FCD34D]' : 'text-[#0F766E]'
                    }`}
                  >
                    {section.number}
                  </span>
                  <span className="text-sm font-semibold truncate">
                    {section.title}
                  </span>
                </div>
                {done && (
                  <Check
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-[#FCD34D]' : 'text-[#0F766E]'
                    }`}
                    aria-label="Completed"
                  />
                )}
              </button>
            );
          })}
        </aside>

        {/* Right Lesson Detail */}
        <article className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="space-y-1">
              <div className="font-mono text-xs font-semibold text-[#0F766E]">
                Topic {activeTopic.number} of 07
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F2942]">
                {activeTopic.title}
              </h2>
              <p className="text-sm text-slate-600">{activeTopic.subtitle}</p>
            </div>

            <button
              type="button"
              disabled={savingTopic}
              onClick={() => void handleToggle(activeTopic.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompleted
                  ? 'bg-[#F0FDFA] text-[#0F766E] border-[#0F766E]/30'
                  : 'bg-[#F8FAFC] text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Completed' : 'Mark as Read'}</span>
            </button>
          </div>

          <div className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
            {activeTopic.simpleExplanation.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>

          <div className="bg-[#F0FDFA] border border-[#0F766E]/25 rounded-xl p-5 space-y-1.5">
            <div className="text-xs font-bold text-[#0F766E]">
              {activeTopic.rupeeExampleTitle}
            </div>
            <p className="text-sm text-[#0F2942] leading-relaxed">
              {activeTopic.rupeeExample}
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 space-y-2.5">
            <div className="text-xs font-bold text-[#0F2942]">
              Risks & things to watch out for
            </div>
            <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
              {activeTopic.watchOut.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Educational information only, not financial advice.
            </p>
            <button
              type="button"
              onClick={() => onAskAiTopic(activeTopic.aiPrompt)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <span>Ask FinGuide AI about {activeTopic.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}

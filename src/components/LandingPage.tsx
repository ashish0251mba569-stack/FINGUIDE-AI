import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { PageId } from './Navbar';

interface LandingPageProps {
  onNavigate: (page: PageId) => void;
}

const SAMPLE_PREVIEWS = [
  {
    id: 'sip',
    label: 'What is a SIP?',
    jargon: 'Rupee cost averaging across open-ended equity mutual fund NAVs via automated NACH mandates.',
    simple:
      'Think of a SIP like setting aside ₹500 every month automatically into a mutual fund, just like a recurring deposit. When market prices drop, your ₹500 buys more units; when prices rise, it buys fewer.',
    takeaway: 'A SIP lets you start investing small amounts monthly without trying to guess market highs and lows.',
  },
  {
    id: 'fd_vs_mf',
    label: 'FD vs Mutual Fund?',
    jargon: 'Guaranteed fixed-income deposit tenure yields versus mark-to-market debt or equity AUM volatility.',
    simple:
      'A Fixed Deposit gives you a fixed interest rate (around 6.5%–7.5% a year) with almost zero risk—great for money you need in 1–2 years. A Mutual Fund can grow faster over 5+ years, but its value moves up and down along the way.',
    takeaway: 'Use an FD for near-term safety and consider mutual funds only for goals at least 3–5 years away.',
  },
  {
    id: 'salary',
    label: 'First ₹30,000 salary?',
    jargon: 'Asset allocation buckets across liquid emergency reserves, term cover, and systematic equity exposure.',
    simple:
      'Start with a simple split: ₹15,000 for hostel, food, and bills; ₹9,000 for lifestyle; and ₹6,000 into a separate savings account until you build a ₹30,000 emergency cushion.',
    takeaway: 'Protect yourself with an emergency fund first before putting money into market-linked investments.',
  },
];

const COMPARISON_ROWS = [
  {
    platform: 'FinGuide AI',
    isOurs: true,
    personalization: 'Tailored to your goal, savings, experience & risk',
    simplicity: 'High — short sentences, ₹ examples, zero jargon',
    price: 'Free basic · ₹149/mo Premium',
    limitation: 'Educational guidance only; does not execute trades',
  },
  {
    platform: 'Google / YouTube & Influencers',
    isOurs: false,
    personalization: 'None — one-size-fits-all videos and blogs',
    simplicity: 'Mixed — scattered tips, often hype or complex terms',
    price: 'Free (ad-supported)',
    limitation: 'Hard to verify quality or know what fits your money',
  },
  {
    platform: 'Zerodha Varsity',
    isOurs: false,
    personalization: 'None — structured self-study chapters',
    simplicity: 'Moderate — textbook depth, strong on stock trading',
    price: 'Free',
    limitation: 'You still have to connect concepts to your personal goal',
  },
  {
    platform: 'Groww',
    isOurs: false,
    personalization: 'Product-level discovery for active investors',
    simplicity: 'Moderate — built around placing investment orders',
    price: '₹0 account opening · txn/regulatory fees apply',
    limitation: 'Built for investing transactions, not beginner education',
  },
];

const FAQS = [
  {
    q: 'Is FinGuide AI giving me stock tips or financial advice?',
    a: 'No. FinGuide AI is strictly an educational platform. We explain how savings accounts, fixed deposits, mutual funds, insurance, and PPF work in simple language so you feel confident before making any decision. For personal investment advice, always consult a SEBI-registered advisor.',
  },
  {
    q: 'Do I need a demat account or ₹50,000 to start using FinGuide AI?',
    a: 'Not at all. Most students start by taking the 5-minute Financial Confidence Check even with ₹0 or ₹1,000 saved from pocket money. We help you understand emergency funds and budgeting before you even think about market investments.',
  },
  {
    q: 'Why is this better than searching YouTube or asking friends?',
    a: 'YouTube videos and friends often share what worked for their salary and risk appetite—not yours. FinGuide AI adapts every explanation and comparison to your current savings, experience level, and comfort with risk.',
  },
  {
    q: 'What does the ₹149/month Premium plan include?',
    a: 'Our Free plan covers the Confidence Check, Compare tool, and 5 AI questions per day. Premium (₹149/month) unlocks unlimited AI guidance sessions, deeper personalized comparisons, and step-by-step topic walkthroughs. You can try a simulated free trial right inside the Pricing page.',
  },
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [activePreviewId, setActivePreviewId] = useState<string>('sip');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Waitlist state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [yearCourse, setYearCourse] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  const activePreview = SAMPLE_PREVIEWS.find((p) => p.id === activePreviewId) || SAMPLE_PREVIEWS[0];

  const handleWaitlistSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWaitlistError('');

    if (!name.trim() || !email.trim() || !college.trim() || !yearCourse.trim()) {
      setWaitlistError('Please fill in all four fields so we can tailor campus updates.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setWaitlistError('Please enter a valid email address.');
      return;
    }

    setWaitlistLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, college, yearCourse }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not join the waitlist.');
      }
      setWaitlistSuccess(true);
      setName('');
      setEmail('');
      setCollege('');
      setYearCourse('');
    } catch (err) {
      setWaitlistError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Headline & Primary CTA */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <p className="text-sm font-medium text-[#0F766E]">
                For Indian college students, MBA cohorts & young earners (18–28)
              </p>

              <h1
                className="font-display font-bold tracking-tight text-[#0F2942] leading-[1.12]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.35rem)', textWrap: 'balance' }}
              >
                Understand money and investments in simple language before you invest.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Skip scattered YouTube advice and confusing finance jargon. Get clear explanations and side-by-side comparisons tailored to your goal, monthly savings, and comfort with risk.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('check')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white rounded-xl transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F2942]"
                >
                  <span>Take the free 5-minute Financial Confidence Check</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('compare')}
                  className="inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-[#0F2942] hover:text-[#0F766E] underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Compare FD, SIP & PPF
                </button>
              </div>

              <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Dehradun · Delhi-NCR · Lucknow & Tier-2/3 Campuses</span>
                <span aria-hidden="true">/</span>
                <span>Educational guidance only — no trading or sales pitches</span>
              </div>
            </div>

            {/* Right Interactive Simple-Language Translator Card */}
            <div className="lg:col-span-5 flex">
              <div className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0F2942]">
                      See how FinGuide translates finance
                    </span>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      ₹ Examples
                    </span>
                  </div>

                  {/* Interactive topic tabs */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                    {SAMPLE_PREVIEWS.map((item) => {
                      const active = item.id === activePreviewId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActivePreviewId(item.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-white text-[#0F2942] shadow-sm'
                              : 'text-slate-600 hover:text-[#0F2942]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                    <div className="text-xs font-medium text-slate-500">
                      What typical blogs say
                    </div>
                    <p className="text-sm text-slate-500 line-through decoration-slate-300">
                      {activePreview.jargon}
                    </p>
                  </div>

                  <div className="bg-white border border-[#0F766E]/30 rounded-xl p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-[#0F766E]">
                      FinGuide AI explanation
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {activePreview.simple}
                    </p>
                    <div className="pt-2 border-t border-slate-100 text-xs text-[#0F2942]">
                      <span className="font-semibold">In simple words: </span>
                      {activePreview.takeaway}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('guidance')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] rounded-lg transition-colors cursor-pointer"
                >
                  Try asking your own question
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="max-w-2xl space-y-3 mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
            Why starting with money feels harder than it should
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Most students and fresh graduates want to save and invest responsibly, but end up postponing decisions because existing sources are not built for beginners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <div className="font-mono text-xs font-semibold text-[#0F766E]">01</div>
            <h3 className="font-display text-lg font-semibold text-[#0F2942]">
              Confusing jargon everywhere
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Terms like NAV, expense ratio, lock-in, and compounding are thrown around without plain-English examples in ₹.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <div className="font-mono text-xs font-semibold text-[#0F766E]">02</div>
            <h3 className="font-display text-lg font-semibold text-[#0F2942]">
              Scattered information
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              You open ten browser tabs comparing Fixed Deposits, SIPs, and PPF, yet still cannot tell which fits a 2-year versus 5-year goal.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <div className="font-mono text-xs font-semibold text-[#0F766E]">03</div>
            <h3 className="font-display text-lg font-semibold text-[#0F2942]">
              Relying on friends & influencers
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Social-media reels chase quick hype without knowing your pocket money, emergency savings, or comfort with risk.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS + BENEFITS (Asymmetric Rhythm) */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* How It Works - 3 Steps */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
                  How FinGuide AI works in 3 steps
                </h2>
                <p className="text-base text-slate-600">
                  Go from confused to clear in about five minutes, without opening any trading account.
                </p>
              </div>

              <div className="divide-y divide-slate-200 border-y border-slate-200">
                <div className="py-5 flex items-start gap-5">
                  <span className="font-mono text-sm font-semibold text-[#0F766E] pt-0.5 shrink-0">
                    01
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-semibold text-[#0F2942]">
                      Tell us your goal
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Take the 5-minute Financial Confidence Check covering your savings, pocket money or salary, experience, and comfort with risk.
                    </p>
                  </div>
                </div>

                <div className="py-5 flex items-start gap-5">
                  <span className="font-mono text-sm font-semibold text-[#0F766E] pt-0.5 shrink-0">
                    02
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-semibold text-[#0F2942]">
                      Get a simple personalized explanation
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Chat with FinGuide AI in plain English with real ₹ examples, clear risk explanations, and a one-line "In simple words" summary every time.
                    </p>
                  </div>
                </div>

                <div className="py-5 flex items-start gap-5">
                  <span className="font-mono text-sm font-semibold text-[#0F766E] pt-0.5 shrink-0">
                    03
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-semibold text-[#0F2942]">
                      Compare your options side by side
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      See Savings Accounts, FDs, RDs, SIPs, PPF, Insurance, and Gold ETFs matched against your own risk preference and timeline.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Panel */}
            <div className="lg:col-span-5">
              <div className="bg-[#0F2942] text-white rounded-2xl p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-6">
                  <h3 className="font-display text-xl font-bold tracking-tight">
                    Why students prefer FinGuide AI
                  </h3>

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-[#FCD34D]">
                        Understand faster
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        Short, structured explanations cut out 20-minute fluff so you grasp core rules in minutes.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-base font-semibold text-[#FCD34D]">
                        Feel confident before investing
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        Know exactly why an FD or SIP fits—or does not fit—your current savings cushion before committing ₹1.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-base font-semibold text-[#FCD34D]">
                        Zero jargon, zero sales pressure
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        No commissions, no affiliate brokerage pushes, and every complex term defined immediately.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('check')}
                  className="w-full py-3 px-5 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#FBBF24] rounded-xl transition-colors cursor-pointer"
                >
                  Check Your Confidence Score Free
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPARISON TABLE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="max-w-2xl space-y-2 mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
            How FinGuide AI compares to what you use today
          </h2>
          <p className="text-base text-slate-600">
            Generic finance content gives everyone the same answer. FinGuide AI connects education directly to your stage of life.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-4 px-5">Platform</th>
                  <th className="py-4 px-5">Personalization</th>
                  <th className="py-4 px-5">Beginner simplicity</th>
                  <th className="py-4 px-5">Price</th>
                  <th className="py-4 px-5">Main limitation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.platform}
                    className={row.isOurs ? 'bg-[#F0FDFA]' : 'bg-white'}
                  >
                    <td className="py-4 px-5 font-semibold text-[#0F2942]">
                      {row.platform}
                    </td>
                    <td className="py-4 px-5 text-slate-700">{row.personalization}</td>
                    <td className="py-4 px-5 text-slate-700">{row.simplicity}</td>
                    <td className="py-4 px-5 text-slate-700 tabular-nums">{row.price}</td>
                    <td className="py-4 px-5 text-slate-600">{row.limitation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. PRICING PREVIEW & FAQ */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Pricing Preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
                  Simple student pricing
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Start free with your Confidence Check and daily AI guidance. Upgrade only if you want unlimited coaching.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-display font-semibold text-[#0F2942]">Free Plan</div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Confidence Check, Compare tool & 5 AI questions/day
                    </p>
                  </div>
                  <div className="font-mono text-lg font-bold text-[#0F2942] tabular-nums shrink-0">
                    ₹0
                  </div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#0F766E]/40 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-display font-semibold text-[#0F2942]">
                      Premium Guidance
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Unlimited AI sessions, personalized comparisons & deep guides
                    </p>
                  </div>
                  <div className="font-mono text-lg font-bold text-[#0F766E] tabular-nums shrink-0">
                    ₹149/mo
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F2942] hover:text-[#0F766E] underline underline-offset-4 cursor-pointer"
              >
                <span>View full plans & start free trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* FAQ Accordion */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F2942]">
                Common questions from students
              </h2>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-[#F8FAFC]">
                {FAQS.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={item.q}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm sm:text-base font-semibold text-[#0F2942]">
                          {item.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WAITLIST / SIGN-UP FORM */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 lg:pt-20">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-3">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
              Join the FinGuide AI student community
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Get early access to campus financial-literacy sessions, beginner guides in ₹, and new personalized tools for college and MBA students.
            </p>
          </div>

          <div className="lg:col-span-7">
            {waitlistSuccess ? (
              <div className="bg-[#F0FDFA] border border-[#0F766E]/30 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-[#0F766E] font-semibold">
                  <Check className="w-5 h-5" />
                  <span>You are on the FinGuide AI student list</span>
                </div>
                <p className="text-sm text-slate-700">
                  Thanks for signing up! You can immediately take the 5-minute Financial Confidence Check to get your personalized learning path.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('check')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] rounded-lg transition-colors cursor-pointer"
                >
                  Take the Confidence Check now
                </button>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wl-name" className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="wl-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label htmlFor="wl-email" className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="wl-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.ac.in"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label htmlFor="wl-college" className="block text-xs font-medium text-slate-700 mb-1">
                    College / Organization
                  </label>
                  <input
                    id="wl-college"
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. DBS Global University, Dehradun"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label htmlFor="wl-course" className="block text-xs font-medium text-slate-700 mb-1">
                    Year & Course
                  </label>
                  <input
                    id="wl-course"
                    type="text"
                    value={yearCourse}
                    onChange={(e) => setYearCourse(e.target.value)}
                    placeholder="e.g. MBA 1st Year / B.Com Final Year"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                {waitlistError && (
                  <div className="sm:col-span-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {waitlistError}
                  </div>
                )}

                <div className="sm:col-span-2 pt-1">
                  <button
                    type="submit"
                    disabled={waitlistLoading}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {waitlistLoading ? 'Submitting...' : 'Join Free Student Access'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

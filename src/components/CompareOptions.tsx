import { useState } from 'react';
import type { User } from 'firebase/auth';
import { AlertTriangle, Bookmark, Check, HelpCircle, X } from 'lucide-react';
import {
  FINANCIAL_OPTIONS,
  GOAL_LABELS,
  RISK_LABELS,
} from '../data/financialOptions';
import type {
  FinancialGoal,
  FinancialOption,
  RiskPreference,
  SavedComparison,
  UserFinancialProfile,
} from '../types';
import { saveComparisonToFirestore } from '../firebase';
import AccountSyncBar from './AccountSyncBar';
import type { PageId } from './Navbar';

interface CompareOptionsProps {
  profile: UserFinancialProfile | null;
  onNavigate: (page: PageId) => void;
  user: User | null;
  authReady: boolean;
  savedComparisons: SavedComparison[];
  onComparisonSaved: (item: SavedComparison) => void;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

// Monthly Recurring Deposit / Monthly FD Equivalent compounded quarterly
function calculateFdMonthlySeries(monthlyAmount: number, years: number, annualRatePct: number): number {
  const months = years * 12;
  const r = annualRatePct / 100;
  let total = 0;
  for (let m = 0; m < months; m++) {
    const remainingYears = (months - m) / 12;
    total += monthlyAmount * Math.pow(1 + r / 4, 4 * remainingYears);
  }
  return total;
}

// Monthly Mutual Fund SIP formula (illustrating market-linked compounding)
function calculateSipMaturity(monthlyAmount: number, years: number, annualRatePct: number): number {
  const months = years * 12;
  const monthlyRate = annualRatePct / 12 / 100;
  if (monthlyRate === 0) {
    return monthlyAmount * months;
  }
  return (
    monthlyAmount *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
    (1 + monthlyRate)
  );
}

// PPF annual compounding with monthly deposits (interest credited annually)
function calculatePpfMaturity(monthlyAmount: number, years: number, annualRatePct: number): number {
  const r = annualRatePct / 100;
  let balance = 0;
  for (let y = 0; y < years; y++) {
    // Annual deposit = 12 * monthlyAmount; monthly contributions earn avg ~6.5/12 of annual rate in year of deposit
    const annualDeposit = monthlyAmount * 12;
    const interest = (balance + annualDeposit * (6.5 / 12)) * r;
    balance = balance + annualDeposit + interest;
  }
  return balance;
}

export default function CompareOptions({
  profile,
  onNavigate,
  user,
  authReady,
  savedComparisons,
  onComparisonSaved,
}: CompareOptionsProps) {
  // Calculator state
  const [monthlyInput, setMonthlyInput] = useState<string>('2000');
  const [durationInput, setDurationInput] = useState<string>('5');
  const [fdRateInput, setFdRateInput] = useState<string>('7.0');
  const [sipRateInput, setSipRateInput] = useState<string>('12.0');
  const [ppfRateInput, setPpfRateInput] = useState<string>('7.1');

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // Profile matrix highlight controls
  const [filterGoal, setFilterGoal] = useState<FinancialGoal>(
    profile?.goal || 'first_investment'
  );
  const [filterRisk, setFilterRisk] = useState<RiskPreference>(
    profile?.riskPreference || 'medium'
  );

  // AI Simple Explanation panel state
  const [selectedOption, setSelectedOption] = useState<FinancialOption | null>(null);
  const [explanation, setExplanation] = useState('');
  const [simpleSummary, setSimpleSummary] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  // Validate calculator inputs
  const monthlyAmount = Number(monthlyInput);
  const durationYears = Number(durationInput);
  const fdRate = Number(fdRateInput);
  const sipRate = Number(sipRateInput);
  const ppfRate = Number(ppfRateInput);

  const validationError = (() => {
    if (!Number.isFinite(monthlyAmount) || monthlyAmount < 100 || monthlyAmount > 1000000) {
      return 'Enter a monthly investment between ₹100 and ₹10,00,000.';
    }
    if (
      !Number.isFinite(durationYears) ||
      !Number.isInteger(durationYears) ||
      durationYears < 1 ||
      durationYears > 30
    ) {
      return 'Enter a whole-number duration between 1 and 30 years.';
    }
    if (
      !Number.isFinite(fdRate) ||
      fdRate < 0 ||
      fdRate > 30 ||
      !Number.isFinite(sipRate) ||
      sipRate < 0 ||
      sipRate > 30 ||
      !Number.isFinite(ppfRate) ||
      ppfRate < 0 ||
      ppfRate > 30
    ) {
      return 'Expected return rates must be between 0% and 30% p.a.';
    }
    return '';
  })();

  const totalInvested = validationError ? 0 : monthlyAmount * 12 * durationYears;
  const fdMaturity = validationError
    ? 0
    : Math.round(calculateFdMonthlySeries(monthlyAmount, durationYears, fdRate));
  const sipMaturity = validationError
    ? 0
    : Math.round(calculateSipMaturity(monthlyAmount, durationYears, sipRate));
  const ppfMaturity = validationError
    ? 0
    : Math.round(calculatePpfMaturity(monthlyAmount, durationYears, ppfRate));

  const handleSaveComparison = async () => {
    if (validationError || !user) return;
    setSaveLoading(true);
    setSaveMessage('');
    setSaveError('');

    const item: SavedComparison = {
      id: crypto.randomUUID(),
      monthlyAmount,
      durationYears,
      fdRate,
      sipRate,
      ppfRate,
      totalInvested,
      fdMaturity,
      sipMaturity,
      ppfMaturity,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveComparisonToFirestore(user, item);
      onComparisonSaved(item);
      setSaveMessage('Comparison scenario saved to your Firestore account.');
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? `Could not save scenario: ${err.message}`
          : 'Could not save scenario.'
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const matchesProfile = (opt: FinancialOption) =>
    opt.matchingGoals.includes(filterGoal) && opt.matchingRisks.includes(filterRisk);

  const handleExplainSimple = async (opt: FinancialOption) => {
    setSelectedOption(opt);
    setExplanation('');
    setSimpleSummary('');
    setAiError('');
    setLoadingAi(true);

    try {
      const res = await fetch('/api/ai/explain-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionName: opt.name,
          optionDetails: opt,
          profile: profile || { goal: filterGoal, riskPreference: filterRisk },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate simple explanation.');
      }
      setExplanation(data.explanation);
      setSimpleSummary(data.simpleSummary || '');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm font-medium text-[#0F766E]">
            Interactive Comparison Calculator & Matrix
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
            Compare FD, Mutual Fund SIP & PPF
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Enter your monthly investment amount, duration, and expected rates of return to see how your invested money and estimated returns grow side by side.
          </p>
        </div>

        {!profile && (
          <button
            type="button"
            onClick={() => onNavigate('check')}
            className="px-4 py-2.5 text-xs font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white rounded-lg transition-colors self-start lg:self-auto whitespace-nowrap cursor-pointer"
          >
            Take Confidence Check for Auto-Match
          </button>
        )}
      </div>

      <AccountSyncBar
        user={user}
        authReady={authReady}
        syncStatusText="Signed in — save any FD/SIP/PPF calculation directly to Firestore"
      />

      {/* INTERACTIVE FD vs SIP vs PPF CALCULATOR */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="calc-amount" className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Amount (₹)
            </label>
            <input
              id="calc-amount"
              type="number"
              min={100}
              max={1000000}
              step={100}
              value={monthlyInput}
              onChange={(e) => setMonthlyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div>
            <label htmlFor="calc-years" className="block text-xs font-semibold text-slate-700 mb-1">
              Duration (Years)
            </label>
            <input
              id="calc-years"
              type="number"
              min={1}
              max={30}
              step={1}
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div>
            <label htmlFor="calc-fd" className="block text-xs font-semibold text-slate-700 mb-1">
              FD Rate (% p.a.)
            </label>
            <input
              id="calc-fd"
              type="number"
              min={0}
              max={30}
              step={0.1}
              value={fdRateInput}
              onChange={(e) => setFdRateInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div>
            <label htmlFor="calc-sip" className="block text-xs font-semibold text-slate-700 mb-1">
              SIP Expected (% p.a.)
            </label>
            <input
              id="calc-sip"
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={sipRateInput}
              onChange={(e) => setSipRateInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div>
            <label htmlFor="calc-ppf" className="block text-xs font-semibold text-slate-700 mb-1">
              PPF Rate (% p.a.)
            </label>
            <input
              id="calc-ppf"
              type="number"
              min={0}
              max={30}
              step={0.1}
              value={ppfRateInput}
              onChange={(e) => setPpfRateInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>
        </div>

        {validationError ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
            {validationError}
          </div>
        ) : (
          <>
            {/* 3 Side-by-Side Maturity Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  id: 'fd',
                  title: 'Fixed Deposit / RD Equivalent',
                  subtitle: `Fixed ${fdRate}% p.a. · Quarterly compounding`,
                  invested: totalInvested,
                  maturity: fdMaturity,
                  returns: Math.max(0, fdMaturity - totalInvested),
                  note: 'Predictable bank rate. Interest above tax thresholds is taxable.',
                  accentColor: 'bg-[#0F2942]',
                },
                {
                  id: 'sip',
                  title: 'Mutual Fund (SIP)',
                  subtitle: `Illustrative ${sipRate}% p.a. · Market-linked`,
                  invested: totalInvested,
                  maturity: sipMaturity,
                  returns: Math.max(0, sipMaturity - totalInvested),
                  note: 'Market-linked and NOT guaranteed. Actual values move up and down.',
                  accentColor: 'bg-[#0F766E]',
                },
                {
                  id: 'ppf',
                  title: 'Public Provident Fund (PPF)',
                  subtitle: `Govt-backed ${ppfRate}% p.a. · Tax-free`,
                  invested: totalInvested,
                  maturity: ppfMaturity,
                  returns: Math.max(0, ppfMaturity - totalInvested),
                  note:
                    durationYears < 15
                      ? 'Note: PPF carries a 15-year lock-in (illustrative value shown for comparison).'
                      : 'Completes the full 15-year lock-in with tax-free maturity.',
                  accentColor: 'bg-[#B45309]',
                },
              ].map((card) => {
                const investedShare =
                  card.maturity > 0 ? Math.round((card.invested / card.maturity) * 100) : 100;
                return (
                  <div
                    key={card.id}
                    className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-1">
                      <h2 className="font-display text-lg font-bold text-[#0F2942]">
                        {card.title}
                      </h2>
                      <p className="text-xs text-slate-600">{card.subtitle}</p>
                    </div>

                    <dl className="space-y-2.5 text-sm border-y border-slate-200 py-3.5">
                      <div className="flex items-center justify-between">
                        <dt className="text-slate-600">Investment Amount</dt>
                        <dd className="font-mono font-semibold text-[#0F2942] tabular-nums">
                          {formatINR(card.invested)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-slate-600">Estimated Returns</dt>
                        <dd className="font-mono font-semibold text-[#0F766E] tabular-nums">
                          +{formatINR(card.returns)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <dt className="font-semibold text-[#0F2942]">Total Maturity Value</dt>
                        <dd className="font-mono text-lg font-bold text-[#0F2942] tabular-nums">
                          {formatINR(card.maturity)}
                        </dd>
                      </div>
                    </dl>

                    <div className="space-y-2">
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-slate-400"
                          style={{ width: `${investedShare}%` }}
                          title="Invested amount"
                        />
                        <div
                          className={`h-full ${card.accentColor}`}
                          style={{ width: `${Math.max(0, 100 - investedShare)}%` }}
                          title="Estimated returns"
                        />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{card.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mandatory Market-Linked Disclaimer Callout */}
            <div className="bg-[#FFFBEB] border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-[#78350F]">
              <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Mutual Fund SIP returns are market-linked and not guaranteed.
                </p>
                <p className="text-xs leading-relaxed">
                  Unlike Fixed Deposits or PPF, mutual fund investments depend on market performance. Returns can fluctuate year to year and may be higher or lower than your estimated {sipRate}% p.a., including temporary losses during market downturns.
                </p>
              </div>
            </div>

            {/* Save Comparison Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-600">
                {user
                  ? 'Save this calculation to compare scenarios later in your account.'
                  : 'Sign in with Google above if you want to save comparisons to your account.'}
              </div>
              <button
                type="button"
                disabled={!user || saveLoading}
                onClick={() => void handleSaveComparison()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] disabled:opacity-45 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{saveLoading ? 'Saving...' : 'Save This Comparison'}</span>
              </button>
            </div>

            {saveMessage && (
              <p className="text-xs font-medium text-[#0F766E]">{saveMessage}</p>
            )}
            {saveError && (
              <p className="text-xs font-medium text-red-700">{saveError}</p>
            )}
          </>
        )}

        {/* Saved Comparisons List (only for signed-in users) */}
        {user && savedComparisons.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#0F2942]">
              Your saved comparisons ({savedComparisons.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedComparisons.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 text-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[#0F2942] tabular-nums">
                      {formatINR(item.monthlyAmount)}/mo · {item.durationYears} yrs
                    </div>
                    <div className="text-slate-500 tabular-nums">
                      FD {item.fdRate}% / SIP {item.sipRate}% / PPF {item.ppfRate}%
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums text-[#0F2942]">
                    <div>SIP: {formatINR(item.sipMaturity)}</div>
                    <div className="text-slate-500">FD: {formatINR(item.fdMaturity)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* EXISTING GOAL & RISK MATCHING CONTROLS + 7-OPTION MATRIX */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F2942]">
            All 7 financial options compared side by side
          </h2>
          <p className="text-sm text-slate-600">
            Filter by your goal and risk comfort, or ask FinGuide AI to explain any option in plain words.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              Highlight options for Goal
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(GOAL_LABELS) as FinancialGoal[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilterGoal(g)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    filterGoal === g
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {GOAL_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              Highlight options for Risk Preference
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(RISK_LABELS) as RiskPreference[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRisk(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    filterRisk === r
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {RISK_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedOption && (
          <div className="bg-white border border-[#0F766E]/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-[#0F766E]">
                  FinGuide AI Plain-English Breakdown
                </div>
                <h2 className="font-display text-xl font-bold text-[#0F2942] mt-0.5">
                  {selectedOption.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOption(null)}
                aria-label="Close explanation"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingAi && (
              <p className="text-sm text-slate-600">
                Generating a beginner-friendly explanation with a ₹ example...
              </p>
            )}

            {aiError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
                {aiError}
              </div>
            )}

            {explanation && (
              <div className="space-y-4">
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {explanation}
                </div>
                {simpleSummary && (
                  <div className="bg-[#F0FDFA] border border-[#0F766E]/25 rounded-xl p-4 space-y-1">
                    <div className="text-xs font-bold text-[#0F766E]">In simple words</div>
                    <p className="text-sm font-medium text-[#0F2942]">{simpleSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200">
                  <th className="py-4 px-5 text-xs font-semibold text-slate-600 w-44 sticky left-0 bg-[#F8FAFC] z-10 border-r border-slate-200">
                    Criteria
                  </th>
                  {FINANCIAL_OPTIONS.map((opt) => {
                    const matched = matchesProfile(opt);
                    return (
                      <th
                        key={opt.id}
                        className={`py-4 px-4 align-top min-w-[190px] ${
                          matched ? 'bg-[#F0FDFA]' : 'bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="space-y-1">
                          {matched && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E]">
                              <Check className="w-3.5 h-3.5" />
                              <span>Matches your profile</span>
                            </div>
                          )}
                          <div className="font-display text-sm font-bold text-[#0F2942]">
                            {opt.name}
                          </div>
                          <div className="text-xs font-normal text-slate-500">
                            {opt.shortCategory}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                <tr>
                  <td className="py-4 px-5 font-semibold text-[#0F2942] sticky left-0 bg-white z-10 border-r border-slate-200">
                    Risk level
                  </td>
                  {FINANCIAL_OPTIONS.map((opt) => (
                    <td
                      key={opt.id}
                      className={`py-4 px-4 text-slate-700 font-medium ${
                        matchesProfile(opt) ? 'bg-[#F0FDFA]/50' : ''
                      }`}
                    >
                      {opt.riskLevel}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-4 px-5 font-semibold text-[#0F2942] sticky left-0 bg-white z-10 border-r border-slate-200">
                    Expected return range
                  </td>
                  {FINANCIAL_OPTIONS.map((opt) => (
                    <td
                      key={opt.id}
                      className={`py-4 px-4 text-slate-700 tabular-nums ${
                        matchesProfile(opt) ? 'bg-[#F0FDFA]/50' : ''
                      }`}
                    >
                      {opt.expectedReturnRange}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-4 px-5 font-semibold text-[#0F2942] sticky left-0 bg-white z-10 border-r border-slate-200">
                    Lock-in
                  </td>
                  {FINANCIAL_OPTIONS.map((opt) => (
                    <td
                      key={opt.id}
                      className={`py-4 px-4 text-slate-700 ${
                        matchesProfile(opt) ? 'bg-[#F0FDFA]/50' : ''
                      }`}
                    >
                      {opt.lockIn}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-4 px-5 font-semibold text-[#0F2942] sticky left-0 bg-white z-10 border-r border-slate-200">
                    Liquidity
                  </td>
                  {FINANCIAL_OPTIONS.map((opt) => (
                    <td
                      key={opt.id}
                      className={`py-4 px-4 text-slate-700 ${
                        matchesProfile(opt) ? 'bg-[#F0FDFA]/50' : ''
                      }`}
                    >
                      {opt.liquidity}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-4 px-5 font-semibold text-[#0F2942] sticky left-0 bg-white z-10 border-r border-slate-200">
                    Minimum amount
                  </td>
                  {FINANCIAL_OPTIONS.map((opt) => (
                    <td
                      key={opt.id}
                      className={`py-4 px-4 text-slate-700 tabular-nums ${
                        matchesProfile(opt) ? 'bg-[#F0FDFA]/50' : ''
                      }`}
                    >
                      {opt.minimumAmount}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-4 px-5 font-semibold text-[#0F2942] sticky left-0 bg-white z-10 border-r border-slate-200">
                    Who it suits
                  </td>
                  {FINANCIAL_OPTIONS.map((opt) => (
                    <td
                      key={opt.id}
                      className={`py-4 px-4 text-slate-600 leading-relaxed ${
                        matchesProfile(opt) ? 'bg-[#F0FDFA]/50' : ''
                      }`}
                    >
                      {opt.whoItSuits}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-4 px-5 font-semibold text-[#0F2942] sticky left-0 bg-white z-10 border-r border-slate-200">
                    Simple AI breakdown
                  </td>
                  {FINANCIAL_OPTIONS.map((opt) => (
                    <td
                      key={opt.id}
                      className={`py-4 px-4 ${
                        matchesProfile(opt) ? 'bg-[#F0FDFA]/50' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => void handleExplainSimple(opt)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F2942] bg-white hover:bg-[#0F2942] hover:text-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Explain this in simple language</span>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Note: Return ranges reflect general historical/prevailing rates in India for educational comparison only and are not guaranteed. Always consult a SEBI-registered advisor before investing.
      </p>
    </div>
  );
}

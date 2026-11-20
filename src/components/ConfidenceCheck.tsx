import { useState } from 'react';
import type { User } from 'firebase/auth';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import type {
  BiggestConfusion,
  EducationalSectionId,
  EmergencyFundMonths,
  ExpenseRatio,
  ExperienceLevel,
  FinancialGoal,
  IncomeRange,
  KnowledgeLevel,
  RiskPreference,
  SavingsLevel,
  UserFinancialProfile,
} from '../types';
import {
  CONFUSION_LABELS,
  EMERGENCY_FUND_LABELS,
  EXPENSE_RATIO_LABELS,
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  INCOME_LABELS,
  KNOWLEDGE_LABELS,
  RISK_LABELS,
  SAVINGS_LABELS,
} from '../data/financialOptions';
import { computeConfidenceProfileDetails } from '../utils/confidenceScoring';
import { formatFirestoreErrorForUI, saveAssessmentToFirestore } from '../firebase';
import AccountSyncBar from './AccountSyncBar';
import type { PageId } from './Navbar';

interface ConfidenceCheckProps {
  existingProfile: UserFinancialProfile | null;
  onSaveProfile: (profile: UserFinancialProfile) => void;
  onAskTopic: (prompt: string) => void;
  onOpenLearnSection: (sectionId: EducationalSectionId) => void;
  onNavigate: (page: PageId) => void;
  user: User | null;
  authReady: boolean;
}

const TOTAL_STEPS = 8;

export default function ConfidenceCheck({
  existingProfile,
  onSaveProfile,
  onAskTopic,
  onOpenLearnSection,
  onNavigate,
  user,
  authReady,
}: ConfidenceCheckProps) {
  const [step, setStep] = useState<number>(1);
  const [showResult, setShowResult] = useState<boolean>(Boolean(existingProfile));

  const [incomeRange, setIncomeRange] = useState<IncomeRange>(
    existingProfile?.incomeRange || '5k_to_15k'
  );
  const [expenseRatio, setExpenseRatio] = useState<ExpenseRatio>(
    existingProfile?.expenseRatio || '50_to_75'
  );
  const [savingsLevel, setSavingsLevel] = useState<SavingsLevel>(
    existingProfile?.savingsLevel || 'cushion_5k_25k'
  );
  const [emergencyFundMonths, setEmergencyFundMonths] = useState<EmergencyFundMonths>(
    existingProfile?.emergencyFundMonths || 'under_1_month'
  );
  const [goal, setGoal] = useState<FinancialGoal>(
    existingProfile?.goal || 'first_investment'
  );
  const [experience, setExperience] = useState<ExperienceLevel>(
    existingProfile?.experience || 'none'
  );
  const [riskPreference, setRiskPreference] = useState<RiskPreference>(
    existingProfile?.riskPreference || 'medium'
  );
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel>(
    existingProfile?.knowledgeLevel || 'basic'
  );
  const [biggestConfusion, setBiggestConfusion] = useState<BiggestConfusion>(
    existingProfile?.biggestConfusion || 'investing'
  );
  const [name, setName] = useState<string>(existingProfile?.name || '');
  const [city, setCity] = useState<string>(existingProfile?.city || '');

  const [submitting, setSubmitting] = useState(false);
  const [cloudSaved, setCloudSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleFinish = async () => {
    setSubmitting(true);
    setStatusMessage('');
    setCloudSaved(false);

    const computed = computeConfidenceProfileDetails({
      goal,
      incomeRange,
      expenseRatio,
      savingsLevel,
      emergencyFundMonths,
      experience,
      riskPreference,
      knowledgeLevel,
      biggestConfusion,
    });

    const profile: UserFinancialProfile = {
      id: crypto.randomUUID(),
      name: name.trim() || undefined,
      city: city.trim() || undefined,
      goal,
      incomeRange,
      expenseRatio,
      savingsLevel,
      emergencyFundMonths,
      experience,
      riskPreference,
      knowledgeLevel,
      biggestConfusion,
      score: computed.score,
      scoreLabel: computed.scoreLabel,
      scoreBreakdown: computed.scoreBreakdown,
      scoreExplanation: computed.scoreExplanation,
      educationalSuggestions: computed.educationalSuggestions,
      recommendedTopics: computed.recommendedTopics,
      completedAt: new Date().toISOString(),
    };

    // Save to Firestore if signed in with verified Google account
    if (user) {
      try {
        await saveAssessmentToFirestore(user, profile);
        setCloudSaved(true);
      } catch (err) {
        setStatusMessage(formatFirestoreErrorForUI(err));
      }
    }

    // Record anonymized MVP validation event
    try {
      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch {
      // Non-blocking telemetry
    }

    onSaveProfile(profile);
    setShowResult(true);
    setSubmitting(false);
  };

  const handleSaveCurrentToCloud = async () => {
    if (!user || !existingProfile) return;
    setSubmitting(true);
    setStatusMessage('');
    try {
      await saveAssessmentToFirestore(user, existingProfile);
      setCloudSaved(true);
    } catch (err) {
      setStatusMessage(formatFirestoreErrorForUI(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resetAssessment = () => {
    setStep(1);
    setShowResult(false);
    setStatusMessage('');
    setCloudSaved(false);
  };

  if (showResult && existingProfile) {
    const breakdown = existingProfile.scoreBreakdown;
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#0F766E]">
              5-Minute Financial Confidence Check Results
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942] mt-1">
              {existingProfile.name
                ? `${existingProfile.name}'s Financial Confidence Report`
                : 'Your Financial Confidence Report'}
            </h1>
          </div>

          <button
            type="button"
            onClick={resetAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors self-start cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Check</span>
          </button>
        </div>

        <AccountSyncBar
          user={user}
          authReady={authReady}
          syncStatusText={
            cloudSaved
              ? 'Assessment saved to your Firestore account'
              : 'Signed in — click Save to Account if this assessment is new'
          }
        />

        {user && !cloudSaved && (
          <div className="bg-[#F0FDFA] border border-[#0F766E]/30 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-[#0F2942]">
              You are signed in. Save this assessment result to your Firestore cloud history?
            </span>
            <button
              type="button"
              onClick={() => void handleSaveCurrentToCloud()}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D9488] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Result to Account'}
            </button>
          </div>
        )}

        {statusMessage && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            {statusMessage}
          </div>
        )}

        {/* Score + 4-Pillar Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 bg-[#0F2942] text-white rounded-2xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-300">
                Financial Confidence Score
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-5xl font-bold tabular-nums text-[#FCD34D]">
                  {existingProfile.score}
                </span>
                <span className="font-mono text-lg text-slate-300">/ 100</span>
              </div>
              <div className="text-base font-semibold text-white pt-1">
                Stage: {existingProfile.scoreLabel}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/15">
              <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
                  style={{ width: `${existingProfile.score}%` }}
                />
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {existingProfile.scoreExplanation}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-[#0F2942]">
                Score breakdown by area
              </h2>

              <div className="space-y-3.5">
                {[
                  {
                    label: 'Savings & Emergency Fund Cushion',
                    val: breakdown.savingsAndEmergency,
                    max: 30,
                  },
                  {
                    label: 'Monthly Expense Control',
                    val: breakdown.expenseControl,
                    max: 25,
                  },
                  {
                    label: 'Investment Readiness',
                    val: breakdown.investmentReadiness,
                    max: 25,
                  },
                  {
                    label: 'Financial Knowledge',
                    val: breakdown.financialKnowledge,
                    max: 20,
                  },
                ].map((item) => {
                  const pct = Math.round((item.val / item.max) * 100);
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-[#0F2942]">{item.label}</span>
                        <span className="font-mono font-semibold text-[#0F766E] tabular-nums">
                          {item.val} / {item.max}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F766E] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onNavigate('guidance')}
                className="px-5 py-2.5 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Start Personalized AI Guidance
              </button>
              <button
                type="button"
                onClick={() => onNavigate('compare')}
                className="px-5 py-2.5 text-sm font-semibold text-[#0F2942] bg-[#F1F5F9] hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Compare FD, SIP & PPF
              </button>
            </div>
          </div>
        </div>

        {/* Educational Suggestions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0F2942]">
            Educational suggestions for your stage
          </h2>
          <ul className="space-y-3">
            {existingProfile.educationalSuggestions.map((suggestion, idx) => (
              <li
                key={suggestion}
                className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed"
              >
                <span className="font-mono text-xs font-semibold text-[#0F766E] pt-0.5 shrink-0">
                  0{idx + 1}
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Educational information only, not financial advice. Consult a SEBI-registered advisor before making personal investment decisions.
          </p>
        </div>

        {/* Personalized Learning Path */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F2942]">
              Recommended next lessons
            </h2>
            <p className="text-sm text-slate-600">
              Open a topic in our Educational Dashboard or start a guided AI walkthrough.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {existingProfile.recommendedTopics.map((topic, index) => (
              <div
                key={topic.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-semibold text-[#0F766E]">
                      Lesson 0{index + 1}
                    </span>
                    <span className="tabular-nums">{topic.estimatedMinutes} min read</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#0F2942]">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {topic.summary}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  {topic.dashboardSectionId && (
                    <button
                      type="button"
                      onClick={() => onOpenLearnSection(topic.dashboardSectionId!)}
                      className="flex-1 px-4 py-2.5 text-xs font-semibold text-[#0F2942] bg-[#F1F5F9] hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Read Simple Guide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onAskTopic(topic.starterPrompt)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Ask FinGuide AI</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#0F766E]">
          5-Minute Assessment · Personalized Guidance
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
          Financial Confidence Check
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Answer 8 quick questions covering your income, expenses, savings, emergency fund, investments, and financial knowledge.
        </p>
      </div>

      <AccountSyncBar
        user={user}
        authReady={authReady}
        syncStatusText="Signed in — your score will save to your Firestore account upon completion"
      />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 tabular-nums">
          <span>Step {step} of {TOTAL_STEPS}</span>
          <span>{progressPct}% complete</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0F766E] rounded-full transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              1. What is your monthly income or pocket money range?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(INCOME_LABELS) as IncomeRange[]).map((key) => {
                const selected = incomeRange === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIncomeRange(key)}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F2942]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium tabular-nums">
                      {INCOME_LABELS[key]}
                    </span>
                    {selected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              2. Roughly how much of your monthly money goes to expenses (rent, food, travel, lifestyle)?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(EXPENSE_RATIO_LABELS) as ExpenseRatio[]).map((key) => {
                const selected = expenseRatio === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setExpenseRatio(key)}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F2942]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium">
                      {EXPENSE_RATIO_LABELS[key]}
                    </span>
                    {selected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              3. How much have you saved so far in total?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(SAVINGS_LABELS) as SavingsLevel[]).map((key) => {
                const selected = savingsLevel === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSavingsLevel(key)}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F2942]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium tabular-nums">
                      {SAVINGS_LABELS[key]}
                    </span>
                    {selected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              4. If an unexpected expense came up today, how many months of expenses could your emergency fund cover?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(EMERGENCY_FUND_LABELS) as EmergencyFundMonths[]).map((key) => {
                const selected = emergencyFundMonths === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEmergencyFundMonths(key)}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F2942]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium">
                      {EMERGENCY_FUND_LABELS[key]}
                    </span>
                    {selected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              5. What is your main financial goal right now?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(GOAL_LABELS) as FinancialGoal[]).map((key) => {
                const selected = goal === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGoal(key)}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F2942]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium">{GOAL_LABELS[key]}</span>
                    {selected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-[#0F2942]">
                6. Your investment experience & comfort with risk
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((key) => {
                  const selected = experience === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setExperience(key)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        selected
                          ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F2942]'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-sm font-medium">{EXPERIENCE_LABELS[key]}</span>
                      {selected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              <div className="text-sm font-semibold text-[#0F2942]">
                Comfort with short-term market ups and downs
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(RISK_LABELS) as RiskPreference[]).map((key) => {
                  const selected = riskPreference === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRiskPreference(key)}
                      className={`px-3.5 py-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#0F2942] bg-[#0F2942] text-white'
                          : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {RISK_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              7. How would you rate your financial knowledge right now?
            </h2>
            <p className="text-xs text-slate-500">
              For example: knowing how inflation affects savings, how FDs differ from SIPs, and why insurance matters.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(KNOWLEDGE_LABELS) as KnowledgeLevel[]).map((key) => {
                const selected = knowledgeLevel === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setKnowledgeLevel(key)}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F2942]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium">
                      {KNOWLEDGE_LABELS[key]}
                    </span>
                    {selected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              8. What feels most confusing right now?
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {(Object.keys(CONFUSION_LABELS) as BiggestConfusion[]).map((key) => {
                const selected = biggestConfusion === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBiggestConfusion(key)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F2942]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{CONFUSION_LABELS[key]}</span>
                    {selected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cc-name" className="block text-xs font-medium text-slate-600 mb-1">
                  First Name (optional)
                </label>
                <input
                  id="cc-name"
                  type="text"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label htmlFor="cc-city" className="block text-xs font-medium text-slate-600 mb-1">
                  City (optional)
                </label>
                <input
                  id="cc-city"
                  type="text"
                  maxLength={80}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dehradun, Lucknow, Delhi-NCR"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] rounded-lg transition-colors cursor-pointer"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              <span>{submitting ? 'Calculating Score...' : 'Get My Confidence Score'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

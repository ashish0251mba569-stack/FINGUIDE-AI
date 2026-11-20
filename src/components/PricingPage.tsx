import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import type { PageId } from './Navbar';

interface PricingPageProps {
  isPremiumTrial: boolean;
  onActivateTrial: () => void;
  onNavigate: (page: PageId) => void;
}

export default function PricingPage({
  isPremiumTrial,
  onActivateTrial,
  onNavigate,
}: PricingPageProps) {
  const [willingness, setWillingness] = useState<'Yes' | 'Maybe' | 'No' | ''>('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleWtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!willingness) {
      setError('Please select Yes, Maybe, or No.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/wtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ willingness, feedback }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not record response.');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <div className="max-w-2xl space-y-2">
        <p className="text-sm font-medium text-[#0F766E]">
          Student-Friendly Plans
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
          Start free, unlock unlimited guidance when you need it
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Built around a college budget. No hidden fees, no brokerage commissions, and no payment details required to test the Premium trial.
        </p>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Free Plan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#0F2942]">Free Plan</h2>
              <p className="text-sm text-slate-600">
                Everything you need to check where you stand and learn core concepts.
              </p>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl font-bold text-[#0F2942] tabular-nums">
                ₹0
              </span>
              <span className="text-sm text-slate-500">/ month</span>
            </div>

            <ul className="space-y-3 pt-4 border-t border-slate-200 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#0F766E] mt-0.5 shrink-0" />
                <span>Full 5-minute Financial Confidence Check & Score</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#0F766E] mt-0.5 shrink-0" />
                <span>Basic plain-English explanations & ₹ examples</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#0F766E] mt-0.5 shrink-0" />
                <span>Up to 5 personalized AI guidance questions per day</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#0F766E] mt-0.5 shrink-0" />
                <span>Side-by-side Compare tool (FD, SIP, PPF, Insurance & more)</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('check')}
            className="w-full py-3 px-4 text-sm font-semibold text-[#0F2942] bg-[#F1F5F9] hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Continue with Free Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-[#0F2942] text-white rounded-2xl p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#FCD34D]">
                Most Personalized
              </div>
              <h2 className="font-display text-xl font-bold">FinGuide Premium</h2>
              <p className="text-sm text-slate-200">
                Unlimited AI coaching tailored to your salary, savings, and upcoming financial milestones.
              </p>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl font-bold text-[#FCD34D] tabular-nums">
                ₹149
              </span>
              <span className="text-sm text-slate-300">/ month</span>
            </div>

            <ul className="space-y-3 pt-4 border-t border-white/15 text-sm text-slate-100">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#FCD34D] mt-0.5 shrink-0" />
                <span>Unlimited AI guidance sessions & follow-up questions</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#FCD34D] mt-0.5 shrink-0" />
                <span>Personalized product comparisons & AI breakdowns</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#FCD34D] mt-0.5 shrink-0" />
                <span>Advanced first-salary, tax basics & emergency planning guides</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#FCD34D] mt-0.5 shrink-0" />
                <span>Priority invite to live campus Q&A workshops</span>
              </li>
            </ul>
          </div>

          {isPremiumTrial ? (
            <div className="space-y-3">
              <div className="w-full py-3 px-4 text-sm font-semibold text-center text-[#0F2942] bg-[#FCD34D] rounded-xl">
                Simulated Premium Trial Active
              </div>
              <button
                type="button"
                onClick={() => onNavigate('guidance')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg transition-colors cursor-pointer"
              >
                Use Unlimited AI Guidance now
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onActivateTrial}
              className="w-full py-3 px-4 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#FBBF24] rounded-xl transition-colors cursor-pointer"
            >
              Start free premium trial
            </button>
          )}
        </div>
      </div>

      {/* Willingness-To-Pay Validation Card (Unlocked once trial started, or always testable after clicking trial) */}
      {isPremiumTrial && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
          {submitted ? (
            <div className="flex items-start gap-3 text-[#0F766E]">
              <Check className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-[#0F2942]">
                  Response recorded — thank you!
                </h3>
                <p className="text-sm text-slate-600">
                  Your honest answer helps us decide the right student pricing before launching paid plans. Enjoy your simulated unlimited trial!
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleWtpSubmit} className="space-y-5">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#0F766E]">
                  Pricing Feedback (Simulated Trial Active)
                </div>
                <h3 className="font-display text-xl font-bold text-[#0F2942]">
                  Would you pay ₹149/month for this?
                </h3>
                <p className="text-sm text-slate-600">
                  We are testing whether ₹149/month feels fair for unlimited personalized financial guidance. No real payment is charged.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {(['Yes', 'Maybe', 'No'] as const).map((option) => {
                  const selected = willingness === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setWillingness(option)}
                      className={`px-6 py-3 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <div>
                <label htmlFor="wtp-feedback" className="block text-xs font-medium text-slate-600 mb-1">
                  What would make ₹149/month worth it for you? (optional)
                </label>
                <textarea
                  id="wtp-feedback"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. ₹99/month feels easier for students, or add internship salary tax guides..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              {error && <p className="text-xs text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Submit Pricing Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

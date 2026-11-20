import { useState, type FormEvent } from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import type { AdminMetrics } from '../types';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  const fetchMetrics = async (pass: string) => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { 'x-admin-password': pass },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not load validation metrics.');
      }
      setMetrics(data as AdminMetrics);
      setAuthenticated(true);
      setSavedPassword(pass);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed.');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError('Enter the admin passcode.');
      return;
    }
    await fetchMetrics(password.trim());
  };

  if (!authenticated || !metrics) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-7 space-y-5">
          <div className="flex items-center gap-2.5 text-[#0F2942]">
            <Lock className="w-5 h-5 text-[#0F766E]" />
            <h1 className="font-display text-xl font-bold">
              Founder Validation Dashboard
            </h1>
          </div>
          <p className="text-sm text-slate-600">
            Enter your admin passcode to inspect live student sign-ups, assessment completions, guidance session rates, and ₹149/month willingness-to-pay metrics.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-pass" className="block text-xs font-medium text-slate-700 mb-1">
                Admin Passcode
              </label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passcode"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Unlock Validation Metrics'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const maxTopicCount = Math.max(1, ...metrics.mostRequestedTopics.map((t) => t.count));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#0F766E]">
            MVP Validation Tracker
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
            FinGuide AI Experiment Metrics
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void fetchMetrics(savedPassword)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F2942] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="text-xs font-medium text-slate-500">Total Sign-ups</div>
          <div className="font-mono text-3xl font-bold text-[#0F2942] tabular-nums">
            {metrics.totalSignups}
          </div>
          <div className="text-xs text-slate-600 tabular-nums">
            {metrics.waitlistCount} waitlist · {metrics.workshopStudentCount} workshop students
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="text-xs font-medium text-slate-500">
            Completed Confidence Checks
          </div>
          <div className="font-mono text-3xl font-bold text-[#0F2942] tabular-nums">
            {metrics.completedAssessments}
          </div>
          <div className="text-xs text-slate-600">
            Goal, savings & risk profiles saved
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Guidance Sessions</span>
            <span className="font-mono text-[#0F766E] tabular-nums">Target: 40%</span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-bold text-[#0F2942] tabular-nums">
              {metrics.completedGuidanceSessions}
            </span>
            <span className="font-mono text-sm font-semibold text-[#0F766E] tabular-nums">
              ({metrics.sessionCompletionRate}% rate)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0F766E] rounded-full"
              style={{ width: `${Math.min(100, metrics.sessionCompletionRate)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Willing to Pay ₹149/mo</span>
            <span className="font-mono text-[#B45309] tabular-nums">Target: 20%</span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-bold text-[#0F2942] tabular-nums">
              {metrics.wtpResponses.yesRate}%
            </span>
            <span className="text-xs text-slate-600 tabular-nums">
              ({metrics.wtpResponses.yes} Yes / {metrics.wtpResponses.maybe} Maybe / {metrics.wtpResponses.no} No)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] rounded-full"
              style={{ width: `${Math.min(100, metrics.wtpResponses.yesRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topic Demand + Feedback Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0F2942]">
            Most-Requested Topics
          </h2>
          <div className="space-y-3">
            {metrics.mostRequestedTopics.map((item) => {
              const pct = Math.round((item.count / maxTopicCount) * 100);
              return (
                <div key={item.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium text-[#0F2942]">
                      {item.topic}
                    </span>
                    <span className="font-mono text-xs text-slate-600 tabular-nums">
                      {item.count} responses
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F2942] rounded-full"
                      style={{ width: `${item.count === 0 ? 0 : pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0F2942]">
            Session Helpfulness & Campus Leads
          </h2>
          <dl className="divide-y divide-slate-200 text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-slate-600">Feedback surveys submitted</dt>
              <dd className="font-mono font-semibold text-[#0F2942] tabular-nums">
                {metrics.feedbackSummary.total}
              </dd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-slate-600">Rated explanation "Yes, useful"</dt>
              <dd className="font-mono font-semibold text-[#0F766E] tabular-nums">
                {metrics.feedbackSummary.usefulYes}
              </dd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-slate-600">Would use again ("Yes")</dt>
              <dd className="font-mono font-semibold text-[#0F766E] tabular-nums">
                {metrics.feedbackSummary.useAgainYes}
              </dd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-slate-600">College partnership enquiries</dt>
              <dd className="font-mono font-semibold text-[#0F2942] tabular-nums">
                {metrics.collegeEnquiryCount}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Recent Submissions Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="font-display text-base font-bold text-[#0F2942]">
              Recent Waitlist Sign-ups
            </h3>
          </div>
          {metrics.recentWaitlist.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No waitlist sign-ups yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">College</th>
                    <th className="py-2.5 px-4">Course</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {metrics.recentWaitlist.map((w) => (
                    <tr key={w.id}>
                      <td className="py-2.5 px-4 font-medium text-[#0F2942]">
                        {w.name}
                        <div className="text-slate-500 font-normal">{w.email}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{w.college}</td>
                      <td className="py-2.5 px-4 text-slate-600">{w.yearCourse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="font-display text-base font-bold text-[#0F2942]">
              Recent Workshop & Pricing Feedback
            </h3>
          </div>
          {metrics.recentWorkshops.length === 0 && metrics.recentWtp.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              No workshop registrations or pricing responses yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 text-xs">
              {metrics.recentWorkshops.map((ws) => (
                <div key={ws.id} className="p-4 space-y-0.5">
                  <div className="font-semibold text-[#0F2942]">
                    {ws.type === 'college' ? 'College Enquiry' : 'Workshop Student'} · {ws.name}
                  </div>
                  <div className="text-slate-600">
                    {ws.organization} ({ws.city}) · {ws.detail}
                  </div>
                </div>
              ))}
              {metrics.recentWtp.map((wt) => (
                <div key={wt.id} className="p-4 space-y-0.5 bg-[#FFFBEB]/50">
                  <div className="font-semibold text-[#0F2942]">
                    ₹149/mo Willingness: {wt.willingness}
                  </div>
                  {wt.feedback && (
                    <div className="text-slate-600">"{wt.feedback}"</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Check, Send } from 'lucide-react';
import type { ChatMessage, UserFinancialProfile } from '../types';
import { GOAL_LABELS, RISK_LABELS, SAVINGS_LABELS } from '../data/financialOptions';
import type { PageId } from './Navbar';

interface GuidanceChatProps {
  profile: UserFinancialProfile | null;
  initialPrompt: string | null;
  onClearInitialPrompt: () => void;
  isPremiumTrial: boolean;
  dailyQuestionsUsed: number;
  onIncrementDailyQuestions: () => void;
  onNavigate: (page: PageId) => void;
}

const FREE_DAILY_LIMIT = 5;

const STARTER_QUESTIONS = [
  'What is a SIP?',
  'FD vs mutual fund?',
  'How much should I save from my first salary?',
  'How do I build an emergency fund on ₹8,000 pocket money?',
  'What is the difference between term insurance and health insurance?',
];

export default function GuidanceChat({
  profile,
  initialPrompt,
  onClearInitialPrompt,
  isPremiumTrial,
  dailyQuestionsUsed,
  onIncrementDailyQuestions,
  onNavigate,
}: GuidanceChatProps) {
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Session completion & feedback survey state
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [useful, setUseful] = useState('');
  const [useAgain, setUseAgain] = useState('');
  const [topHelpTopic, setTopHelpTopic] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastAutoPromptRef = useRef<string | null>(null);

  const limitReached = !isPremiumTrial && dailyQuestionsUsed >= FREE_DAILY_LIMIT;
  const remainingFree = Math.max(0, FREE_DAILY_LIMIT - dailyQuestionsUsed);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    if (!isPremiumTrial && dailyQuestionsUsed >= FREE_DAILY_LIMIT) {
      setError(
        'You have used all 5 free AI guidance questions for today. Start the free simulated Premium trial on the Pricing page for unlimited questions.'
      );
      return;
    }

    setError('');
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          profile,
          sessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not reach FinGuide AI.');
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        simpleSummary: data.simpleSummary,
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...nextHistory, assistantMsg];
      setMessages(updatedMessages);
      onIncrementDailyQuestions();

      // Mark session completed automatically once the user has completed a meaningful exchange (2+ AI replies)
      const assistantCount = updatedMessages.filter((m) => m.role === 'assistant').length;
      if (assistantCount >= 2 && !sessionCompleted) {
        setSessionCompleted(true);
        fetch('/api/guidance/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, profileId: profile?.id }),
        }).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt !== lastAutoPromptRef.current) {
      lastAutoPromptRef.current = initialPrompt;
      onClearInitialPrompt();
      void sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCompleteAndSurvey = async () => {
    if (!sessionCompleted) {
      setSessionCompleted(true);
      try {
        await fetch('/api/guidance/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, profileId: profile?.id }),
        });
      } catch {
        // Non-blocking tracking
      }
    }
    setShowSurvey(true);
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    if (!useful || !useAgain || !topHelpTopic) {
      setFeedbackError('Please select an answer for all three questions.');
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          useful,
          useAgain,
          topHelpTopic,
          notes: feedbackNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit feedback.');
      }
      setFeedbackSubmitted(true);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to save feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Persistent Disclaimer Banner */}
      <div
        role="note"
        className="bg-[#FFFBEB] border border-amber-300/80 rounded-xl px-4 py-3 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#78350F]"
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Educational information only, not financial advice.</strong> For personal investment decisions, consult a SEBI-registered advisor.
          </span>
        </div>
        <span className="font-mono text-xs font-medium text-[#0F2942] whitespace-nowrap shrink-0 tabular-nums">
          {isPremiumTrial ? 'Premium Trial: Unlimited' : `Free Plan: ${remainingFree}/${FREE_DAILY_LIMIT} left today`}
        </span>
      </div>

      {/* Personalization Context Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {profile ? (
          <div className="space-y-1">
            <div className="text-xs font-medium text-[#0F766E]">
              Personalized to your Financial Confidence Profile
            </div>
            <div className="text-sm text-[#0F2942] font-medium">
              {GOAL_LABELS[profile.goal]} · {SAVINGS_LABELS[profile.savingsLevel]} · {RISK_LABELS[profile.riskPreference]}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-[#0F2942]">
              Want answers tailored to your savings and goal?
            </div>
            <p className="text-xs text-slate-600">
              Take the 5-minute Financial Confidence Check so FinGuide AI adapts ₹ examples to you.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => onNavigate('check')}
          className="px-4 py-2 text-xs font-semibold text-[#0F2942] bg-[#F1F5F9] hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {profile ? 'Update Profile' : 'Take Confidence Check'}
        </button>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white border border-slate-200 rounded-2xl flex flex-col min-h-[520px] overflow-hidden">
        {/* Conversation Area */}
        <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {messages.length === 0 ? (
            <div className="py-6 space-y-6">
              <div className="space-y-2 max-w-xl">
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2942]">
                  Ask FinGuide AI anything about money
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  No question is too basic. Every answer uses short sentences, concrete ₹ examples, clear risk notes, and ends with an "In simple words" summary.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-500">
                  Suggested starter questions
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {STARTER_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      disabled={loading || limitReached}
                      className="text-left px-4 py-2.5 text-sm font-medium text-[#0F2942] bg-[#F8FAFC] hover:bg-[#F0FDFA] border border-slate-200 hover:border-[#0F766E]/40 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] sm:max-w-[75%] bg-[#0F2942] text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[95%] sm:max-w-[85%] bg-[#F8FAFC] border border-slate-200 rounded-2xl rounded-bl-sm p-5 space-y-4">
                    <div className="text-xs font-semibold text-[#0F766E]">
                      FinGuide AI
                    </div>
                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {msg.content}
                    </div>
                    {msg.simpleSummary && (
                      <div className="bg-[#F0FDFA] border border-[#0F766E]/25 rounded-xl p-4 space-y-1">
                        <div className="text-xs font-bold text-[#0F766E]">
                          In simple words
                        </div>
                        <p className="text-sm font-medium text-[#0F2942] leading-relaxed">
                          {msg.simpleSummary}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-600">
                Preparing a simple explanation with ₹ examples...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error & Limit Notice */}
        {error && (
          <div className="mx-5 mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>{error}</span>
            {limitReached && (
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-[#F59E0B] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                Activate Free Trial
              </button>
            )}
          </div>
        )}

        {/* Session Complete Action Strip */}
        {messages.some((m) => m.role === 'assistant') && !showSurvey && !feedbackSubmitted && (
          <div className="px-5 py-3 bg-[#F8FAFC] border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-slate-600">
              {sessionCompleted
                ? 'Guidance session recorded. Help us improve with a 20-second check-in.'
                : 'Got the clarity you needed? Mark this session complete and share quick feedback.'}
            </span>
            <button
              type="button"
              onClick={() => void handleCompleteAndSurvey()}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0F2942] bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Finish Session & Rate Helpfulness
            </button>
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              limitReached
                ? 'Daily free question limit reached — start free trial on Pricing'
                : 'Ask a finance question (e.g. Should I put ₹2,000 in FD or SIP?)'
            }
            disabled={loading || limitReached}
            className="flex-1 px-4 py-3 text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || limitReached}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] disabled:opacity-50 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>

      {/* Post-Session Feedback Survey */}
      {showSurvey && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
          {feedbackSubmitted ? (
            <div className="flex items-start gap-3 text-[#0F766E]">
              <Check className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="font-semibold text-[#0F2942]">
                  Thank you for helping validate FinGuide AI!
                </div>
                <p className="text-sm text-slate-600">
                  Your feedback directly shapes which guides and ₹ examples we build next.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#0F2942]">
                  Quick 3-question check-in
                </h2>
                <p className="text-xs text-slate-600">
                  Takes 20 seconds — helps us know if simple personalized guidance is working for you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-[#0F2942]">
                    1. Was this explanation useful?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Yes', 'Somewhat', 'No'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setUseful(opt)}
                        className={`px-3.5 py-2 text-xs font-medium rounded-lg border cursor-pointer ${
                          useful === opt
                            ? 'bg-[#0F2942] text-white border-[#0F2942]'
                            : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-[#0F2942]">
                    2. Would you use FinGuide AI again?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Yes', 'Maybe', 'No'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setUseAgain(opt)}
                        className={`px-3.5 py-2 text-xs font-medium rounded-lg border cursor-pointer ${
                          useAgain === opt
                            ? 'bg-[#0F2942] text-white border-[#0F2942]'
                            : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-[#0F2942]">
                  3. What do you want FinGuide AI to help with most?
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'saving', label: 'Saving' },
                    { id: 'investing', label: 'Investing' },
                    { id: 'budgeting', label: 'Budgeting' },
                    { id: 'financial education', label: 'Financial Education' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTopHelpTopic(opt.id)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg border cursor-pointer ${
                        topHelpTopic === opt.id
                          ? 'bg-[#0F766E] text-white border-[#0F766E]'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="fb-notes" className="block text-xs font-medium text-slate-600 mb-1">
                  Anything confusing or missing? (optional)
                </label>
                <input
                  id="fb-notes"
                  type="text"
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="e.g. More examples for internship stipends"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              {feedbackError && (
                <p className="text-xs text-red-700">{feedbackError}</p>
              )}

              <button
                type="submit"
                disabled={feedbackLoading}
                className="px-5 py-2.5 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                {feedbackLoading ? 'Saving...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

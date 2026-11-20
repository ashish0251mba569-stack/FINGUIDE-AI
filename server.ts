import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'finguide2026';

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'finguide-store.json');

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  college: string;
  yearCourse: string;
  createdAt: string;
}

interface AssessmentEntry {
  id: string;
  name?: string;
  city?: string;
  goal: string;
  incomeRange: string;
  savingsLevel: string;
  experience: string;
  riskPreference: string;
  biggestConfusion: string;
  score: number;
  createdAt: string;
}

interface GuidanceSessionEntry {
  sessionId: string;
  profileId?: string;
  messageCount: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

interface FeedbackEntry {
  id: string;
  sessionId?: string;
  useful: string;
  useAgain: string;
  topHelpTopic: string;
  notes: string;
  createdAt: string;
}

interface WtpEntry {
  id: string;
  willingness: 'Yes' | 'Maybe' | 'No';
  feedback: string;
  createdAt: string;
}

interface WorkshopEntry {
  id: string;
  type: 'student' | 'college';
  name: string;
  organization: string;
  city: string;
  email: string;
  detail: string;
  createdAt: string;
}

interface StoreData {
  waitlist: WaitlistEntry[];
  assessments: AssessmentEntry[];
  guidanceSessions: GuidanceSessionEntry[];
  feedback: FeedbackEntry[];
  wtp: WtpEntry[];
  workshops: WorkshopEntry[];
}

const DEFAULT_STORE: StoreData = {
  waitlist: [],
  assessments: [],
  guidanceSessions: [],
  feedback: [],
  wtp: [],
  workshops: [],
};

function readStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
      return structuredClone(DEFAULT_STORE);
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      waitlist: Array.isArray(parsed.waitlist) ? parsed.waitlist : [],
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      guidanceSessions: Array.isArray(parsed.guidanceSessions) ? parsed.guidanceSessions : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
      wtp: Array.isArray(parsed.wtp) ? parsed.wtp : [],
      workshops: Array.isArray(parsed.workshops) ? parsed.workshops : [],
    };
  } catch (err) {
    console.error('Failed to read data store:', err);
    return structuredClone(DEFAULT_STORE);
  }
}

function writeStore(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write data store:', err);
  }
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 25000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const BASE_SYSTEM_PROMPT = `You are FinGuide AI, a friendly financial educator for Indian students and young professionals. Explain in simple English with short sentences and real examples in ₹. Avoid jargon, or define it immediately. Personalize using the user's profile (goal, savings, experience, risk preference). Never give specific buy/sell recommendations or guarantee returns. Always explain risks. Remind users this is educational information and not financial advice, and suggest a SEBI-registered advisor for personal advice.

Formatting rules:
- Keep paragraphs short and scannable (2-3 sentences max per paragraph or crisp bullet points).
- Use concrete Indian ₹ examples (e.g., ₹500/month SIP, ₹5,000 FD, ₹10,000 emergency cushion).
- Always end your response with a clearly labeled section on its own line starting with:
In simple words: <1-2 crisp, beginner-friendly takeaway sentences>`;

function formatProfileContext(profile: Record<string, unknown> | null | undefined): string {
  if (!profile) {
    return 'User profile: Not completed yet (treat as a college/MBA beginner in India learning personal finance basics).';
  }
  return [
    'User financial profile:',
    `- Goal: ${String(profile.goal || 'learning_basics')}`,
    `- Monthly income / pocket money: ${String(profile.incomeRange || 'not specified')}`,
    `- Monthly expenses ratio: ${String(profile.expenseRatio || 'not specified')}`,
    `- Current savings: ${String(profile.savingsLevel || 'not specified')}`,
    `- Emergency fund coverage: ${String(profile.emergencyFundMonths || 'not specified')}`,
    `- Investment experience: ${String(profile.experience || 'none')}`,
    `- Risk preference: ${String(profile.riskPreference || 'low')}`,
    `- Financial knowledge level: ${String(profile.knowledgeLevel || 'basic')}`,
    `- Biggest confusion: ${String(profile.biggestConfusion || 'terminology')}`,
  ].join('\n');
}

function splitSimpleSummary(text: string): { content: string; simpleSummary: string } {
  const markerRegex = /\n?\*{0,2}In simple words:\*{0,2}\s*/i;
  const match = text.match(markerRegex);
  if (!match || match.index === undefined) {
    return {
      content: text.trim(),
      simpleSummary: '',
    };
  }
  const mainPart = text.slice(0, match.index).trim();
  const summaryPart = text.slice(match.index + match[0].length).trim();
  return {
    content: mainPart || text.trim(),
    simpleSummary: summaryPart,
  };
}

function handleGeminiError(err: unknown, res: express.Response): void {
  console.error('Gemini API error:', err);
  let status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : undefined;
  let message = err instanceof Error ? err.message : String(err);

  // @google/genai ApiError often embeds JSON payload inside message
  try {
    const jsonMatch = message.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        error?: { code?: number; message?: string; status?: string };
      };
      if (parsed.error?.code && !status) {
        status = Number(parsed.error.code);
      }
      if (parsed.error?.message) {
        message = `${parsed.error.status || ''} ${parsed.error.message}`.trim();
      }
    }
  } catch {
    // Keep original message
  }

  if (message.includes('GEMINI_API_KEY')) {
    res.status(503).json({
      error: 'AI guidance service requires a configured GEMINI_API_KEY in Settings > Secrets.',
    });
    return;
  }
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    message.includes('403') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    message.includes('UNAUTHENTICATED')
  ) {
    res.status(401).json({
      error: 'Unable to authenticate with Gemini API. Please verify GEMINI_API_KEY in Settings > Secrets.',
    });
    return;
  }
  if (status === 404 || message.includes('NOT_FOUND') || message.includes('404')) {
    res.status(502).json({
      error: 'The configured Gemini model could not be reached for this API key. Please try again in a moment.',
    });
    return;
  }
  if (status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    res.status(429).json({
      error: 'AI guidance quota is temporarily busy. Please wait a moment and try again.',
    });
    return;
  }
  if (
    status === 504 ||
    message.includes('DEADLINE_EXCEEDED') ||
    message.includes('504')
  ) {
    res.status(504).json({
      error: 'The Gemini AI service took too long to respond. Please try again in a moment.',
    });
    return;
  }
  if (
    status === 503 ||
    message.includes('UNAVAILABLE') ||
    message.includes('fetch failed') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('ETIMEDOUT')
  ) {
    res.status(503).json({
      error: 'Could not reach the Gemini AI service right now (network or service unavailable). Please try again in a moment.',
    });
    return;
  }
  res.status(500).json({
    error: `Could not generate an AI explanation right now (${status ? `HTTP ${status}` : message.slice(0, 120)}). Please try again in a moment.`,
  });
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // AI Guidance Chat Endpoint
  app.post('/api/ai/guidance', async (req, res) => {
    try {
      const { message, history, profile, sessionId } = req.body as {
        message?: string;
        history?: Array<{ role: 'user' | 'assistant'; content: string }>;
        profile?: Record<string, unknown> | null;
        sessionId?: string;
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Please enter a question to ask FinGuide AI.' });
        return;
      }

      const ai = getAiClient();
      const systemInstruction = `${BASE_SYSTEM_PROMPT}\n\n${formatProfileContext(profile)}`;

      const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
      const conversationLines = recentHistory.map((item) =>
        `${item.role === 'user' ? 'Student' : 'FinGuide AI'}: ${item.content}`
      );
      conversationLines.push(`Student: ${message.trim()}`);

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: conversationLines.join('\n\n'),
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Received an empty response from the AI service. Please try again.' });
        return;
      }

      const { content, simpleSummary } = splitSimpleSummary(rawText);

      // Track guidance session activity
      if (sessionId) {
        const store = readStore();
        const existing = store.guidanceSessions.find((s) => s.sessionId === sessionId);
        if (existing) {
          existing.messageCount += 1;
        } else {
          store.guidanceSessions.push({
            sessionId,
            profileId: typeof profile?.id === 'string' ? profile.id : undefined,
            messageCount: 1,
            completed: false,
            createdAt: new Date().toISOString(),
          });
        }
        writeStore(store);
      }

      res.json({
        reply: content,
        simpleSummary,
      });
    } catch (err) {
      handleGeminiError(err, res);
    }
  });

  // AI Compare Option Simple Explanation Endpoint
  app.post('/api/ai/explain-option', async (req, res) => {
    try {
      const { optionName, optionDetails, profile } = req.body as {
        optionName?: string;
        optionDetails?: Record<string, unknown>;
        profile?: Record<string, unknown> | null;
      };

      if (!optionName) {
        res.status(400).json({ error: 'Missing financial option name.' });
        return;
      }

      const ai = getAiClient();
      const systemInstruction = `${BASE_SYSTEM_PROMPT}\n\n${formatProfileContext(profile)}`;
      const prompt = `Explain "${optionName}" in simple, everyday English for an Indian college student or young earner.
Details for reference:
- Risk level: ${String(optionDetails?.riskLevel || '')}
- Typical return/nature: ${String(optionDetails?.expectedReturnRange || '')}
- Lock-in: ${String(optionDetails?.lockIn || '')}
- Minimum amount: ${String(optionDetails?.minimumAmount || '')}

Cover:
1. What it actually is (no jargon)
2. A concrete ₹ example (e.g. putting ₹1,000 or ₹2,000)
3. Who it fits based on the user's goal/risk profile
4. Key risks or limitations to watch out for
5. Brief educational disclaimer (not financial advice; consult a SEBI-registered advisor for personal advice)
End with "In simple words: <1-2 sentence takeaway>".`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Received an empty explanation. Please try again.' });
        return;
      }

      const { content, simpleSummary } = splitSimpleSummary(rawText);
      res.json({ explanation: content, simpleSummary });
    } catch (err) {
      handleGeminiError(err, res);
    }
  });

  // Waitlist Sign-up
  app.post('/api/waitlist', (req, res) => {
    const { name, email, college, yearCourse } = req.body as Partial<WaitlistEntry>;
    if (!name?.trim() || !email?.trim() || !college?.trim() || !yearCourse?.trim()) {
      res.status(400).json({ error: 'Please fill in your name, email, college, and year/course.' });
      return;
    }
    const store = readStore();
    const entry: WaitlistEntry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      college: college.trim(),
      yearCourse: yearCourse.trim(),
      createdAt: new Date().toISOString(),
    };
    store.waitlist.unshift(entry);
    writeStore(store);
    res.json({ success: true, entry });
  });

  // Financial Confidence Assessment Save
  app.post('/api/assessments', (req, res) => {
    const body = req.body as Partial<AssessmentEntry>;
    if (!body.goal || !body.incomeRange || !body.savingsLevel || !body.experience || !body.riskPreference || !body.biggestConfusion) {
      res.status(400).json({ error: 'Incomplete assessment submission.' });
      return;
    }
    const store = readStore();
    const entry: AssessmentEntry = {
      id: body.id || crypto.randomUUID(),
      name: body.name?.trim(),
      city: body.city?.trim(),
      goal: body.goal,
      incomeRange: body.incomeRange,
      savingsLevel: body.savingsLevel,
      experience: body.experience,
      riskPreference: body.riskPreference,
      biggestConfusion: body.biggestConfusion,
      score: typeof body.score === 'number' ? body.score : 50,
      createdAt: new Date().toISOString(),
    };
    store.assessments.unshift(entry);
    writeStore(store);
    res.json({ success: true, id: entry.id });
  });

  // Mark Guidance Session Completed
  app.post('/api/guidance/complete', (req, res) => {
    const { sessionId, profileId } = req.body as { sessionId?: string; profileId?: string };
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId.' });
      return;
    }
    const store = readStore();
    const existing = store.guidanceSessions.find((s) => s.sessionId === sessionId);
    if (existing) {
      existing.completed = true;
      existing.completedAt = existing.completedAt || new Date().toISOString();
    } else {
      store.guidanceSessions.push({
        sessionId,
        profileId,
        messageCount: 1,
        completed: true,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
    writeStore(store);
    res.json({ success: true });
  });

  // Post-Session Feedback Survey
  app.post('/api/feedback', (req, res) => {
    const { sessionId, useful, useAgain, topHelpTopic, notes } = req.body as Partial<FeedbackEntry>;
    if (!useful || !useAgain || !topHelpTopic) {
      res.status(400).json({ error: 'Please answer all three quick feedback questions.' });
      return;
    }
    const store = readStore();
    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      sessionId,
      useful,
      useAgain,
      topHelpTopic,
      notes: (notes || '').trim(),
      createdAt: new Date().toISOString(),
    };
    store.feedback.unshift(entry);
    writeStore(store);
    res.json({ success: true, entry });
  });

  // Willingness-To-Pay Validation Response
  app.post('/api/wtp', (req, res) => {
    const { willingness, feedback } = req.body as Partial<WtpEntry>;
    if (willingness !== 'Yes' && willingness !== 'Maybe' && willingness !== 'No') {
      res.status(400).json({ error: 'Please select Yes, Maybe, or No.' });
      return;
    }
    const store = readStore();
    const entry: WtpEntry = {
      id: crypto.randomUUID(),
      willingness,
      feedback: (feedback || '').trim(),
      createdAt: new Date().toISOString(),
    };
    store.wtp.unshift(entry);
    writeStore(store);
    res.json({ success: true, entry });
  });

  // Workshop Student Registration
  app.post('/api/workshops/student', (req, res) => {
    const { name, email, college, city, yearCourse, topicInterest } = req.body as {
      name?: string;
      email?: string;
      college?: string;
      city?: string;
      yearCourse?: string;
      topicInterest?: string;
    };
    if (!name?.trim() || !email?.trim() || !college?.trim() || !city?.trim()) {
      res.status(400).json({ error: 'Please complete your name, email, college, and city.' });
      return;
    }
    const store = readStore();
    const entry: WorkshopEntry = {
      id: crypto.randomUUID(),
      type: 'student',
      name: name.trim(),
      organization: college.trim(),
      city: city.trim(),
      email: email.trim().toLowerCase(),
      detail: `${yearCourse?.trim() || 'Student'} · Interest: ${topicInterest?.trim() || 'General basics'}`,
      createdAt: new Date().toISOString(),
    };
    store.workshops.unshift(entry);
    writeStore(store);
    res.json({ success: true, entry });
  });

  // College / Student Group Partnership Enquiry
  app.post('/api/workshops/college', (req, res) => {
    const { contactName, email, collegeName, city, role, expectedStudents, message } = req.body as {
      contactName?: string;
      email?: string;
      collegeName?: string;
      city?: string;
      role?: string;
      expectedStudents?: string;
      message?: string;
    };
    if (!contactName?.trim() || !email?.trim() || !collegeName?.trim() || !city?.trim()) {
      res.status(400).json({ error: 'Please provide contact name, email, college/group name, and city.' });
      return;
    }
    const store = readStore();
    const entry: WorkshopEntry = {
      id: crypto.randomUUID(),
      type: 'college',
      name: contactName.trim(),
      organization: collegeName.trim(),
      city: city.trim(),
      email: email.trim().toLowerCase(),
      detail: `${role?.trim() || 'Coordinator'} · Est. ${expectedStudents?.trim() || '50+'} students${message?.trim() ? ` · "${message.trim()}"` : ''}`,
      createdAt: new Date().toISOString(),
    };
    store.workshops.unshift(entry);
    writeStore(store);
    res.json({ success: true, entry });
  });

  // Admin Login Verification
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body as { password?: string };
    if (!password || password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Incorrect admin passcode.' });
      return;
    }
    res.json({ authenticated: true });
  });

  // Admin Validation Metrics
  app.get('/api/admin/metrics', (req, res) => {
    const passcode = req.header('x-admin-password');
    if (passcode !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Unauthorized. Valid admin passcode required.' });
      return;
    }

    const store = readStore();
    const workshopStudents = store.workshops.filter((w) => w.type === 'student');
    const collegeEnquiries = store.workshops.filter((w) => w.type === 'college');

    const totalSignups = store.waitlist.length + workshopStudents.length;
    const completedAssessments = store.assessments.length;
    const completedGuidanceSessions = store.guidanceSessions.filter((s) => s.completed).length;

    const baselineUsers = Math.max(completedAssessments, store.guidanceSessions.length, totalSignups);
    const sessionCompletionRate =
      baselineUsers > 0 ? Math.round((completedGuidanceSessions / baselineUsers) * 100) : 0;

    const wtpTotal = store.wtp.length;
    const wtpYes = store.wtp.filter((w) => w.willingness === 'Yes').length;
    const wtpMaybe = store.wtp.filter((w) => w.willingness === 'Maybe').length;
    const wtpNo = store.wtp.filter((w) => w.willingness === 'No').length;
    const wtpYesRate = wtpTotal > 0 ? Math.round((wtpYes / wtpTotal) * 100) : 0;

    // Tally requested topics from feedback + assessment confusions
    const topicCounts: Record<string, number> = {
      saving: 0,
      investing: 0,
      budgeting: 0,
      'financial education': 0,
    };

    for (const f of store.feedback) {
      const key = f.topHelpTopic.toLowerCase();
      topicCounts[key] = (topicCounts[key] || 0) + 1;
    }

    for (const a of store.assessments) {
      const mapConfusion =
        a.biggestConfusion === 'terminology' || a.biggestConfusion === 'insurance'
          ? 'financial education'
          : a.biggestConfusion;
      topicCounts[mapConfusion] = (topicCounts[mapConfusion] || 0) + 1;
    }

    const mostRequestedTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    const usefulYes = store.feedback.filter((f) => f.useful === 'Yes').length;
    const useAgainYes = store.feedback.filter((f) => f.useAgain === 'Yes').length;

    res.json({
      totalSignups,
      waitlistCount: store.waitlist.length,
      workshopStudentCount: workshopStudents.length,
      collegeEnquiryCount: collegeEnquiries.length,
      completedAssessments,
      completedGuidanceSessions,
      sessionCompletionRate,
      wtpResponses: {
        total: wtpTotal,
        yes: wtpYes,
        maybe: wtpMaybe,
        no: wtpNo,
        yesRate: wtpYesRate,
      },
      mostRequestedTopics,
      feedbackSummary: {
        total: store.feedback.length,
        usefulYes,
        useAgainYes,
      },
      recentWaitlist: store.waitlist.slice(0, 15),
      recentWorkshops: store.workshops.slice(0, 15),
      recentFeedback: store.feedback.slice(0, 15),
      recentWtp: store.wtp.slice(0, 15),
    });
  });

  // Ensure unknown API routes always return JSON instead of SPA HTML
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinGuide AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

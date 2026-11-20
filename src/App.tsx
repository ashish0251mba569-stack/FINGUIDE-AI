import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Navbar, { type PageId } from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import ConfidenceCheck from './components/ConfidenceCheck';
import EducationalDashboard from './components/EducationalDashboard';
import GuidanceChat from './components/GuidanceChat';
import CompareOptions from './components/CompareOptions';
import PricingPage from './components/PricingPage';
import WorkshopsPage from './components/WorkshopsPage';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import {
  auth,
  fetchComparisonsFromFirestore,
  fetchLatestAssessmentFromFirestore,
  fetchLearningProgressFromFirestore,
  saveLearningProgressToFirestore,
} from './firebase';
import { computeConfidenceProfileDetails } from './utils/confidenceScoring';
import type {
  EducationalSectionId,
  SavedComparison,
  UserFinancialProfile,
} from './types';

const PROFILE_STORAGE_KEY = 'finguide_profile_v2';
const TRIAL_STORAGE_KEY = 'finguide_trial_v1';
const DAILY_USAGE_KEY = 'finguide_daily_usage_v1';
const LEARN_STORAGE_KEY = 'finguide_learn_v1';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [profile, setProfile] = useState<UserFinancialProfile | null>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserFinancialProfile) : null;
    } catch {
      return null;
    }
  });

  const [completedTopics, setCompletedTopics] = useState<EducationalSectionId[]>(() => {
    try {
      const raw = localStorage.getItem(LEARN_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as EducationalSectionId[]) : [];
    } catch {
      return [];
    }
  });

  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [activeLearnSection, setActiveLearnSection] =
    useState<EducationalSectionId>('budgeting');

  const [isPremiumTrial, setIsPremiumTrial] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TRIAL_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [dailyQuestionsUsed, setDailyQuestionsUsed] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(DAILY_USAGE_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as { date: string; count: number };
      return parsed.date === getTodayKey() ? parsed.count : 0;
    } catch {
      return 0;
    }
  });

  const [pendingGuidancePrompt, setPendingGuidancePrompt] = useState<string | null>(null);
  const [learnSyncStatus, setLearnSyncStatus] = useState<string | undefined>(undefined);

  // Firebase Auth listener & Firestore hydration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setSavedComparisons([]);
        setLearnSyncStatus(undefined);
        return;
      }

      try {
        const [latestAssessment, comparisons, learned] = await Promise.all([
          fetchLatestAssessmentFromFirestore(nextUser.uid),
          fetchComparisonsFromFirestore(nextUser.uid),
          fetchLearningProgressFromFirestore(nextUser.uid),
        ]);

        if (latestAssessment && latestAssessment.goal && latestAssessment.incomeRange) {
          const computed = computeConfidenceProfileDetails({
            goal: latestAssessment.goal,
            incomeRange: latestAssessment.incomeRange,
            expenseRatio: latestAssessment.expenseRatio || '50_to_75',
            savingsLevel: latestAssessment.savingsLevel || 'cushion_5k_25k',
            emergencyFundMonths: latestAssessment.emergencyFundMonths || 'under_1_month',
            experience: latestAssessment.experience || 'none',
            riskPreference: latestAssessment.riskPreference || 'medium',
            knowledgeLevel: latestAssessment.knowledgeLevel || 'basic',
            biggestConfusion: latestAssessment.biggestConfusion || 'investing',
          });
          setProfile({
            id: latestAssessment.id || crypto.randomUUID(),
            name: latestAssessment.name,
            city: latestAssessment.city,
            goal: latestAssessment.goal,
            incomeRange: latestAssessment.incomeRange,
            expenseRatio: latestAssessment.expenseRatio || '50_to_75',
            savingsLevel: latestAssessment.savingsLevel || 'cushion_5k_25k',
            emergencyFundMonths: latestAssessment.emergencyFundMonths || 'under_1_month',
            experience: latestAssessment.experience || 'none',
            riskPreference: latestAssessment.riskPreference || 'medium',
            knowledgeLevel: latestAssessment.knowledgeLevel || 'basic',
            biggestConfusion: latestAssessment.biggestConfusion || 'investing',
            score: latestAssessment.score ?? computed.score,
            scoreLabel: latestAssessment.scoreLabel || computed.scoreLabel,
            scoreBreakdown: computed.scoreBreakdown,
            scoreExplanation: computed.scoreExplanation,
            educationalSuggestions: computed.educationalSuggestions,
            recommendedTopics: computed.recommendedTopics,
            completedAt: latestAssessment.completedAt || new Date().toISOString(),
          });
        }

        setSavedComparisons(comparisons);

        if (learned.length > 0) {
          setCompletedTopics(learned as EducationalSectionId[]);
          setLearnSyncStatus('Reading progress synced with Firestore');
        }
      } catch (err) {
        console.error('Could not hydrate user data from Firestore:', err);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      if (profile) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(LEARN_STORAGE_KEY, JSON.stringify(completedTopics));
    } catch {
      // Ignore
    }
  }, [completedTopics]);

  const handleSaveProfile = (newProfile: UserFinancialProfile) => {
    setProfile(newProfile);
  };

  const handleToggleLearnTopic = async (topicId: EducationalSectionId) => {
    const next = completedTopics.includes(topicId)
      ? completedTopics.filter((id) => id !== topicId)
      : [...completedTopics, topicId];
    setCompletedTopics(next);

    if (user) {
      await saveLearningProgressToFirestore(user, next);
      setLearnSyncStatus('Reading progress saved to Firestore');
    }
  };

  const handleOpenLearnSection = (sectionId: EducationalSectionId) => {
    setActiveLearnSection(sectionId);
    setCurrentPage('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActivateTrial = () => {
    setIsPremiumTrial(true);
    try {
      localStorage.setItem(TRIAL_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const handleIncrementDailyQuestions = () => {
    setDailyQuestionsUsed((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem(
          DAILY_USAGE_KEY,
          JSON.stringify({ date: getTodayKey(), count: next })
        );
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleAskTopicFromRoadmap = (starterPrompt: string) => {
    setPendingGuidancePrompt(starterPrompt);
    setCurrentPage('guidance');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <Navbar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          hasProfile={Boolean(profile)}
        />

        <main className="flex-1">
          {currentPage === 'home' && <LandingPage onNavigate={setCurrentPage} />}

          {currentPage === 'check' && (
            <ConfidenceCheck
              existingProfile={profile}
              onSaveProfile={handleSaveProfile}
              onAskTopic={handleAskTopicFromRoadmap}
              onOpenLearnSection={handleOpenLearnSection}
              onNavigate={setCurrentPage}
              user={user}
              authReady={authReady}
            />
          )}

          {currentPage === 'learn' && (
            <EducationalDashboard
              initialSection={activeLearnSection}
              completedTopics={completedTopics}
              onToggleComplete={handleToggleLearnTopic}
              onAskAiTopic={handleAskTopicFromRoadmap}
              user={user}
              authReady={authReady}
              syncStatusText={learnSyncStatus}
            />
          )}

          {currentPage === 'guidance' && (
            <GuidanceChat
              profile={profile}
              initialPrompt={pendingGuidancePrompt}
              onClearInitialPrompt={() => setPendingGuidancePrompt(null)}
              isPremiumTrial={isPremiumTrial}
              dailyQuestionsUsed={dailyQuestionsUsed}
              onIncrementDailyQuestions={handleIncrementDailyQuestions}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'compare' && (
            <CompareOptions
              profile={profile}
              onNavigate={setCurrentPage}
              user={user}
              authReady={authReady}
              savedComparisons={savedComparisons}
              onComparisonSaved={(item) =>
                setSavedComparisons((prev) => [item, ...prev].slice(0, 5))
              }
            />
          )}

          {currentPage === 'pricing' && (
            <PricingPage
              isPremiumTrial={isPremiumTrial}
              onActivateTrial={handleActivateTrial}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'workshops' && <WorkshopsPage />}

          {currentPage === 'admin' && <AdminDashboard />}
        </main>

        <Footer onNavigate={setCurrentPage} />
      </div>
    </ErrorBoundary>
  );
}

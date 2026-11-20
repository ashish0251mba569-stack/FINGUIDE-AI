import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import type { SavedComparison, UserFinancialProfile } from './types';

const firebaseConfig = {
  apiKey: 'AIzaSyBsEoQOCdW0q9I5PliyM0Zlybf-MUsclTU',
  authDomain: 'finguide-ai-3e912.firebaseapp.com',
  projectId: 'finguide-ai-3e912',
  storageBucket: 'finguide-ai-3e912.firebasestorage.app',
  messagingSenderId: '108931479826',
  appId: '1:108931479826:web:7f9d9eb546c75eb1c8dbcb',
  measurementId: 'G-ZTHV573KE4',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const displayName = (user.displayName || user.email?.split('@')[0] || 'Student').slice(0, 100);
  const email = (user.email || '').slice(0, 160);

  if (!email) {
    throw new Error('Google account email is required to create your FinGuide profile.');
  }

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userRef,
        {
          uid: user.uid,
          displayName,
          email,
          createdAt: snap.data().createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function saveAssessmentToFirestore(
  user: User,
  profile: UserFinancialProfile
): Promise<void> {
  await ensureUserProfile(user);
  const docPath = `users/${user.uid}/assessments/${profile.id}`;
  const ref = doc(db, 'users', user.uid, 'assessments', profile.id);

  const payload: Record<string, unknown> = {
    id: profile.id.slice(0, 128),
    userId: user.uid,
    goal: profile.goal,
    incomeRange: profile.incomeRange,
    expenseRatio: profile.expenseRatio,
    savingsLevel: profile.savingsLevel,
    emergencyFundMonths: profile.emergencyFundMonths,
    experience: profile.experience,
    riskPreference: profile.riskPreference,
    knowledgeLevel: profile.knowledgeLevel,
    biggestConfusion: profile.biggestConfusion,
    score: Math.round(Math.max(0, Math.min(100, profile.score))),
    scoreLabel: profile.scoreLabel.slice(0, 60),
    createdAt: serverTimestamp(),
  };

  if (profile.name && profile.name.trim()) {
    payload.name = profile.name.trim().slice(0, 80);
  }
  if (profile.city && profile.city.trim()) {
    payload.city = profile.city.trim().slice(0, 80);
  }

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function fetchLatestAssessmentFromFirestore(
  uid: string
): Promise<Partial<UserFinancialProfile> | null> {
  const path = `users/${uid}/assessments`;
  try {
    const q = query(
      collection(db, 'users', uid, 'assessments'),
      where('userId', '==', uid)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const sorted = [...snap.docs].sort((a, b) => {
      const aTime = a.data().createdAt?.toMillis?.() ?? 0;
      const bTime = b.data().createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
    const data = sorted[0].data();
    return {
      id: String(data.id),
      name: typeof data.name === 'string' ? data.name : undefined,
      city: typeof data.city === 'string' ? data.city : undefined,
      goal: data.goal,
      incomeRange: data.incomeRange,
      expenseRatio: data.expenseRatio,
      savingsLevel: data.savingsLevel,
      emergencyFundMonths: data.emergencyFundMonths,
      experience: data.experience,
      riskPreference: data.riskPreference,
      knowledgeLevel: data.knowledgeLevel,
      biggestConfusion: data.biggestConfusion,
      score: Number(data.score),
      scoreLabel: String(data.scoreLabel),
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveComparisonToFirestore(
  user: User,
  comparison: SavedComparison
): Promise<void> {
  await ensureUserProfile(user);
  const docPath = `users/${user.uid}/comparisons/${comparison.id}`;
  const ref = doc(db, 'users', user.uid, 'comparisons', comparison.id);

  try {
    await setDoc(ref, {
      id: comparison.id.slice(0, 128),
      userId: user.uid,
      monthlyAmount: Number(comparison.monthlyAmount),
      durationYears: Math.round(comparison.durationYears),
      fdRate: Number(comparison.fdRate),
      sipRate: Number(comparison.sipRate),
      ppfRate: Number(comparison.ppfRate),
      totalInvested: Number(comparison.totalInvested),
      fdMaturity: Number(comparison.fdMaturity),
      sipMaturity: Number(comparison.sipMaturity),
      ppfMaturity: Number(comparison.ppfMaturity),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function fetchComparisonsFromFirestore(
  uid: string
): Promise<SavedComparison[]> {
  const path = `users/${uid}/comparisons`;
  try {
    const q = query(
      collection(db, 'users', uid, 'comparisons'),
      where('userId', '==', uid)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id),
        monthlyAmount: Number(data.monthlyAmount),
        durationYears: Number(data.durationYears),
        fdRate: Number(data.fdRate),
        sipRate: Number(data.sipRate),
        ppfRate: Number(data.ppfRate),
        totalInvested: Number(data.totalInvested),
        fdMaturity: Number(data.fdMaturity),
        sipMaturity: Number(data.sipMaturity),
        ppfMaturity: Number(data.ppfMaturity),
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
      };
    });
    return items
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

const VALID_TOPICS = new Set([
  'budgeting',
  'savings',
  'mutual_funds',
  'stocks',
  'fd',
  'ppf',
  'risk_management',
]);

export async function saveLearningProgressToFirestore(
  user: User,
  completedTopics: string[]
): Promise<void> {
  await ensureUserProfile(user);
  const docPath = `users/${user.uid}/learningProgress/summary`;
  const ref = doc(db, 'users', user.uid, 'learningProgress', 'summary');
  const sanitized = Array.from(new Set(completedTopics))
    .filter((t) => VALID_TOPICS.has(t))
    .slice(0, 10);

  try {
    await setDoc(ref, {
      userId: user.uid,
      completedTopics: sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function fetchLearningProgressFromFirestore(
  uid: string
): Promise<string[]> {
  const docPath = `users/${uid}/learningProgress/summary`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'learningProgress', 'summary'));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.completedTopics)
      ? data.completedTopics.filter((t): t is string => typeof t === 'string')
      : [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

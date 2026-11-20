import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Cloud, CloudOff, LogOut } from 'lucide-react';
import { formatAuthError, signInWithGoogle, signOutUser } from '../firebase';
import GoogleGIcon from './GoogleGIcon';

interface AccountSyncBarProps {
  user: User | null;
  authReady: boolean;
  syncStatusText?: string;
}

export default function AccountSyncBar({
  user,
  authReady,
  syncStatusText,
}: AccountSyncBarProps) {
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSignIn = async () => {
    setAuthError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError('');
    setBusy(true);
    try {
      await signOutUser();
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!authReady) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
        Checking Google account status...
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {user ? (
          <>
            <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm">
              <Cloud className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold text-[#0F2942]">
                  {user.displayName || user.email}
                </span>
                <span className="text-slate-500">
                  {' '}
                  · {syncStatusText || 'Signed in with Google (Firestore connected)'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{busy ? 'Signing out...' : 'Sign out'}</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-slate-600">
              <CloudOff className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Not signed in — results stay in this browser session only and are{' '}
                <strong className="text-[#0F2942]">not saved to your cloud account</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleSignIn()}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F2942] bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <GoogleGIcon className="w-4 h-4 shrink-0" />
              <span>{busy ? 'Opening Google...' : 'Sign in with Google'}</span>
            </button>
          </>
        )}
      </div>

      {authError && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {authError}
        </div>
      )}
    </div>
  );
}

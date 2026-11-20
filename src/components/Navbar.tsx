import { useState } from 'react';
import type { User } from 'firebase/auth';
import { LogOut, Menu, X } from 'lucide-react';
import { formatAuthError, signInWithGoogle, signOutUser } from '../firebase';
import GoogleGIcon from './GoogleGIcon';

export type PageId =
  | 'home'
  | 'check'
  | 'learn'
  | 'guidance'
  | 'compare'
  | 'pricing'
  | 'workshops'
  | 'admin';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  hasProfile: boolean;
  user: User | null;
  authReady: boolean;
}

const NAV_ITEMS: Array<{ id: PageId; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'check', label: 'Confidence Check' },
  { id: 'learn', label: 'Learn' },
  { id: 'compare', label: 'Compare' },
  { id: 'guidance', label: 'Guidance' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'workshops', label: 'Workshops' },
];

export default function Navbar({
  currentPage,
  onNavigate,
  hasProfile,
  user,
  authReady,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleNav = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignIn = async () => {
    setAuthError('');
    setAuthBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError('');
    setAuthBusy(true);
    try {
      await signOutUser();
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const shortName =
    user?.displayName?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    'Account';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 xl:gap-6">
        {/* Zone 1: Single clean brand wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-lg font-bold tracking-tight text-[#0F2942] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-sm"
        >
          FinGuide AI
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                  isActive
                    ? 'border-[#0F766E] text-[#0F2942]'
                    : 'border-transparent text-slate-600 hover:text-[#0F2942] hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Google Sign-In & Primary CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {authReady && (
            user ? (
              <div className="hidden sm:inline-flex items-center gap-2 shrink-0">
                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={shortName}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-[#0F2942] text-white text-[11px] font-semibold inline-flex items-center justify-center shrink-0">
                      {shortName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-[#0F2942] whitespace-nowrap max-w-[110px] truncate">
                    {shortName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={authBusy}
                  aria-label="Sign out"
                  title="Sign out"
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-[#0F2942] bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xl:inline">{authBusy ? 'Signing out...' : 'Sign out'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                disabled={authBusy}
                className="hidden sm:inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0F2942] bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F2942]"
              >
                <GoogleGIcon className="w-4 h-4 shrink-0" />
                <span>{authBusy ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => handleNav(hasProfile ? 'guidance' : 'check')}
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F2942]"
          >
            {hasProfile ? 'Open AI Guidance' : 'Start Free Check'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Inline Auth Error Notice */}
      {authError && (
        <div className="border-t border-red-200 bg-red-50 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-red-800">
            <span>{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError('')}
              className="font-semibold text-red-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0F2942] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {authReady && (
              user ? (
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={shortName}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-[#0F2942] text-white text-xs font-semibold inline-flex items-center justify-center shrink-0">
                        {shortName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#0F2942] truncate">
                        {user.displayName || shortName}
                      </div>
                      {user.email && (
                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    disabled={authBusy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{authBusy ? 'Signing out...' : 'Sign out'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSignIn()}
                  disabled={authBusy}
                  className="w-full py-3 px-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#0F2942] bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  <GoogleGIcon className="w-4 h-4 shrink-0" />
                  <span>{authBusy ? 'Opening Google...' : 'Sign in with Google'}</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => handleNav(hasProfile ? 'guidance' : 'check')}
              className="w-full py-3 px-4 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {hasProfile ? 'Open AI Guidance' : 'Start Free Check'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

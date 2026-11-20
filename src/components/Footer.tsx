import type { PageId } from './Navbar';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const go = (page: PageId) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200">
          <div className="md:col-span-5 space-y-3">
            <div className="font-display text-lg font-bold tracking-tight text-[#0F2942]">
              FinGuide AI
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              Understand money and investments in simple language before you invest. Built for college students, MBA cohorts, and young professionals across Dehradun, Delhi-NCR, Lucknow, and Tier-2/3 India.
            </p>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-[#0F2942]">Platform</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600">
              <li>
                <button type="button" onClick={() => go('home')} className="hover:text-[#0F2942] cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={() => go('check')} className="hover:text-[#0F2942] cursor-pointer">
                  Confidence Check
                </button>
              </li>
              <li>
                <button type="button" onClick={() => go('learn')} className="hover:text-[#0F2942] cursor-pointer">
                  Educational Guides
                </button>
              </li>
              <li>
                <button type="button" onClick={() => go('guidance')} className="hover:text-[#0F2942] cursor-pointer">
                  AI Guidance
                </button>
              </li>
              <li>
                <button type="button" onClick={() => go('compare')} className="hover:text-[#0F2942] cursor-pointer">
                  Compare Options
                </button>
              </li>
              <li>
                <button type="button" onClick={() => go('pricing')} className="hover:text-[#0F2942] cursor-pointer">
                  Pricing
                </button>
              </li>
              <li>
                <button type="button" onClick={() => go('workshops')} className="hover:text-[#0F2942] cursor-pointer">
                  Campus Workshops
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="text-sm font-semibold text-[#0F2942]">Disclaimer</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Educational information only, not financial advice. FinGuide AI does not execute trades, sell products, or offer specific buy/sell tips. Please consult a SEBI-registered investment advisor for personal financial advice.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>FinGuide AI · Financial Education for Young India (Ages 18–28)</p>
          <button
            type="button"
            onClick={() => go('admin')}
            className="text-slate-500 hover:text-[#0F2942] underline underline-offset-4 cursor-pointer"
          >
            Founder Validation Dashboard
          </button>
        </div>
      </div>
    </footer>
  );
}

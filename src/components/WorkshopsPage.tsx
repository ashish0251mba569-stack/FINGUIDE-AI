import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';

export default function WorkshopsPage() {
  const [activeTab, setActiveTab] = useState<'student' | 'college'>('student');

  // Student registration state
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sCollege, setSCollege] = useState('');
  const [sCity, setSCity] = useState('');
  const [sYearCourse, setSYearCourse] = useState('');
  const [sTopicInterest, setSTopicInterest] = useState('First salary & SIP basics');
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError] = useState('');
  const [sSuccess, setSSuccess] = useState(false);

  // College partnership state
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cCollege, setCCollege] = useState('');
  const [cCity, setCCity] = useState('');
  const [cRole, setCRole] = useState('');
  const [cExpected, setCExpected] = useState('50–100 students');
  const [cMessage, setCMessage] = useState('');
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState('');
  const [cSuccess, setCSuccess] = useState(false);

  const handleStudentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSError('');
    if (!sName.trim() || !sEmail.trim() || !sCollege.trim() || !sCity.trim()) {
      setSError('Please complete your name, email, college, and city.');
      return;
    }
    setSLoading(true);
    try {
      const res = await fetch('/api/workshops/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sName,
          email: sEmail,
          college: sCollege,
          city: sCity,
          yearCourse: sYearCourse,
          topicInterest: sTopicInterest,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not register.');
      setSSuccess(true);
      setSName('');
      setSEmail('');
      setSCollege('');
      setSCity('');
      setSYearCourse('');
    } catch (err) {
      setSError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSLoading(false);
    }
  };

  const handleCollegeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCError('');
    if (!cName.trim() || !cEmail.trim() || !cCollege.trim() || !cCity.trim()) {
      setCError('Please complete contact name, email, college/club name, and city.');
      return;
    }
    setCLoading(true);
    try {
      const res = await fetch('/api/workshops/college', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: cName,
          email: cEmail,
          collegeName: cCollege,
          city: cCity,
          role: cRole,
          expectedStudents: cExpected,
          message: cMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send enquiry.');
      setCSuccess(true);
      setCName('');
      setCEmail('');
      setCCollege('');
      setCCity('');
      setCRole('');
      setCMessage('');
    } catch (err) {
      setCError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setCLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      {/* Header & Campus Program Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-sm font-medium text-[#0F766E]">
            Free Financial-Literacy Workshops · Campus Partnerships
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2942]">
            Bring practical money clarity to your college campus
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            We run free 60-minute interactive workshops for MBA, BBA, B.Com, and engineering students across Dehradun, Delhi-NCR, Lucknow, and Tier-2/3 campuses—helping students understand budgeting, emergency funds, FDs, SIPs, and insurance before their first job.
          </p>

          <div className="pt-2 space-y-3">
            <h2 className="font-display text-base font-semibold text-[#0F2942]">
              What a 60-minute session covers
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#0F766E] pt-0.5">01</span>
                <span>Splitting your pocket money or first ₹30,000 salary without stress</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#0F766E] pt-0.5">02</span>
                <span>Live side-by-side walkthrough: Savings Account vs FD vs RD vs Mutual Fund SIP</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#0F766E] pt-0.5">03</span>
                <span>Common mistakes freshers make with influencer tips, credit cards, and insurance</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#0F766E] pt-0.5">04</span>
                <span>Guided hands-on demo of the Financial Confidence Check for every attendee</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Registration & Partnership Forms */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Segmented Tab Controls */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-[#0F2942] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F2942]'
              }`}
            >
              Student Registration
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('college')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'college'
                  ? 'bg-white text-[#0F2942] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F2942]'
              }`}
            >
              College Partnership
            </button>
          </div>

          {activeTab === 'student' ? (
            sSuccess ? (
              <div className="bg-[#F0FDFA] border border-[#0F766E]/30 rounded-xl p-6 space-y-2">
                <div className="flex items-center gap-2 text-[#0F766E] font-semibold">
                  <Check className="w-5 h-5" />
                  <span>Workshop seat request received</span>
                </div>
                <p className="text-sm text-slate-700">
                  We have saved your details and will email you the upcoming live online or campus workshop schedule for your city.
                </p>
                <button
                  type="button"
                  onClick={() => setSSuccess(false)}
                  className="text-xs font-semibold text-[#0F2942] underline underline-offset-4 pt-2 cursor-pointer"
                >
                  Register another student
                </button>
              </div>
            ) : (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0F2942]">
                    Register for a free student workshop
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Open to all undergraduate, postgraduate, and MBA students in India.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ws-name" className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="ws-name"
                      type="text"
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      placeholder="e.g. Rohan Verma"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div>
                    <label htmlFor="ws-email" className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="ws-email"
                      type="email"
                      value={sEmail}
                      onChange={(e) => setSEmail(e.target.value)}
                      placeholder="rohan@university.edu.in"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ws-college" className="block text-xs font-medium text-slate-700 mb-1">
                      College Name
                    </label>
                    <input
                      id="ws-college"
                      type="text"
                      value={sCollege}
                      onChange={(e) => setSCollege(e.target.value)}
                      placeholder="e.g. DBS Global University"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div>
                    <label htmlFor="ws-city" className="block text-xs font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      id="ws-city"
                      type="text"
                      value={sCity}
                      onChange={(e) => setSCity(e.target.value)}
                      placeholder="e.g. Dehradun / Lucknow / Noida"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ws-course" className="block text-xs font-medium text-slate-700 mb-1">
                      Year & Course
                    </label>
                    <input
                      id="ws-course"
                      type="text"
                      value={sYearCourse}
                      onChange={(e) => setSYearCourse(e.target.value)}
                      placeholder="e.g. MBA Finance Sem 2"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div>
                    <label htmlFor="ws-topic" className="block text-xs font-medium text-slate-700 mb-1">
                      Topic you want most
                    </label>
                    <select
                      id="ws-topic"
                      value={sTopicInterest}
                      onChange={(e) => setSTopicInterest(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    >
                      <option>First salary & SIP basics</option>
                      <option>Budgeting & pocket money saving</option>
                      <option>FD vs Mutual Funds vs PPF</option>
                      <option>Health & Term Insurance basics</option>
                    </select>
                  </div>
                </div>

                {sError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {sError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sLoading}
                  className="w-full py-3 px-4 text-sm font-semibold text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] hover:text-white disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                >
                  {sLoading ? 'Registering...' : 'Reserve Free Student Seat'}
                </button>
              </form>
            )
          ) : cSuccess ? (
            <div className="bg-[#F0FDFA] border border-[#0F766E]/30 rounded-xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#0F766E] font-semibold">
                <Check className="w-5 h-5" />
                <span>Partnership enquiry received</span>
              </div>
              <p className="text-sm text-slate-700">
                Thank you for reaching out! Our campus team will connect with you to schedule a free financial-literacy session for your students.
              </p>
              <button
                type="button"
                onClick={() => setCSuccess(false)}
                className="text-xs font-semibold text-[#0F2942] underline underline-offset-4 pt-2 cursor-pointer"
              >
                Submit another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleCollegeSubmit} className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0F2942]">
                  Host a workshop at your college or student club
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  For finance clubs, placement cells, faculty coordinators, and student bodies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cp-name" className="block text-xs font-medium text-slate-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    id="cp-name"
                    type="text"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="e.g. Ananya Joshi"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label htmlFor="cp-email" className="block text-xs font-medium text-slate-700 mb-1">
                    Official / Club Email
                  </label>
                  <input
                    id="cp-email"
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="financeclub@college.ac.in"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cp-college" className="block text-xs font-medium text-slate-700 mb-1">
                    College / Student Group
                  </label>
                  <input
                    id="cp-college"
                    type="text"
                    value={cCollege}
                    onChange={(e) => setCCollege(e.target.value)}
                    placeholder="e.g. Finance Society, Lucknow"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label htmlFor="cp-city" className="block text-xs font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    id="cp-city"
                    type="text"
                    value={cCity}
                    onChange={(e) => setCCity(e.target.value)}
                    placeholder="e.g. Dehradun"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cp-role" className="block text-xs font-medium text-slate-700 mb-1">
                    Your Role
                  </label>
                  <input
                    id="cp-role"
                    type="text"
                    value={cRole}
                    onChange={(e) => setCRole(e.target.value)}
                    placeholder="e.g. Club President / Faculty"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label htmlFor="cp-size" className="block text-xs font-medium text-slate-700 mb-1">
                    Expected Batch Size
                  </label>
                  <select
                    id="cp-size"
                    value={cExpected}
                    onChange={(e) => setCExpected(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option>30–50 students</option>
                    <option>50–100 students</option>
                    <option>100–250 students</option>
                    <option>250+ students</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cp-msg" className="block text-xs font-medium text-slate-700 mb-1">
                  Preferred dates or format (online / on-campus)
                </label>
                <textarea
                  id="cp-msg"
                  rows={2}
                  value={cMessage}
                  onChange={(e) => setCMessage(e.target.value)}
                  placeholder="Share preferred week or student cohort details..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              {cError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {cError}
                </p>
              )}

              <button
                type="submit"
                disabled={cLoading}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
              >
                {cLoading ? 'Sending Enquiry...' : 'Request Campus Partnership'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HiSearch,
  HiX,
  HiChevronDown,
  HiChevronUp,
  HiQuestionMarkCircle,
  HiAcademicCap,
  HiUserGroup,
  HiShieldCheck,
  HiServer,
  HiSparkles,
  HiKey,
  HiDeviceMobile,
  HiDatabase,
  HiOutlineBookOpen,
  HiMail,
  HiCheckCircle,
  HiInformationCircle
} from 'react-icons/hi';

const CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: HiQuestionMarkCircle, countRole: null },
  { id: 'students', label: 'Students', icon: HiAcademicCap, countRole: 'students' },
  { id: 'faculty', label: 'Faculty', icon: HiUserGroup, countRole: 'faculty' },
  { id: 'admin', label: 'Administrators', icon: HiShieldCheck, countRole: 'admin' },
  { id: 'technical', label: 'Technical / System', icon: HiServer, countRole: 'technical' },
];

const FAQ_ITEMS = [
  {
    id: 'eval-anonymity',
    category: 'students',
    relatedCategories: ['technical'],
    icon: HiShieldCheck,
    question: 'Are my evaluation responses completely anonymous?',
    summary: 'Student identities are separated from ratings and comments to ensure total confidentiality.',
    content: (
      <div className="space-y-3 text-[13px] text-psu-text leading-relaxed">
        <p>
          <strong>Yes, absolutely.</strong> The PSU Faculty Evaluation System (FEFAS) is engineered with
          privacy-by-design principles adhering to <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong>.
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-psu-muted">
          <li>
            <strong className="text-psu-text">Decoupled Submissions:</strong> While the system records that you have
            completed an evaluation (to prevent duplicate submissions and track clearance), your identity is
            cryptographically separated from the actual numerical ratings and qualitative comments.
          </li>
          <li>
            <strong className="text-psu-text">Aggregated Instructor Reports:</strong> Faculty members only receive
            aggregated statistical summaries, category averages, and de-identified written comments once the evaluation
            period has officially closed.
          </li>
          <li>
            <strong className="text-psu-text">Access Restriction:</strong> Neither instructors, department heads, nor
            campus administrators can trace specific ratings or feedback back to individual student accounts or ID numbers.
          </li>
        </ul>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[12px] text-blue-900 flex items-start gap-2">
          <HiInformationCircle className="w-4 h-4 mt-0.5 shrink-0 text-psu-primary" />
          <span>
            You can evaluate honestly and constructively knowing your candid feedback promotes instructional excellence
            without any risk of academic retaliation.
          </span>
        </div>
      </div>
    ),
    tags: ['anonymity', 'privacy', 'confidentiality', 'student ratings', 'security'],
  },
  {
    id: 'grading-thresholds',
    category: 'faculty',
    relatedCategories: ['students', 'admin'],
    icon: HiAcademicCap,
    question: 'What are the official PSU grading thresholds and verbal rating interpretations?',
    summary: 'Official FR-13 / NBC 461 QCE performance brackets from 1.00 to 5.00.',
    content: (
      <div className="space-y-3 text-[13px] text-psu-text leading-relaxed">
        <p>
          FEFAS computes faculty performance using the official{' '}
          <strong>PSU Faculty Evaluation Verbal Rating Scale (FR-13 / NBC 461 QCE Standard)</strong>:
        </p>
        <div className="overflow-x-auto rounded-lg border border-psu-border">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-100 text-psu-text font-semibold border-b border-psu-border">
              <tr>
                <th className="py-2.5 px-3">Numerical Range</th>
                <th className="py-2.5 px-3">Verbal Rating</th>
                <th className="py-2.5 px-3">Descriptive Anchor</th>
                <th className="py-2.5 px-3">Evaluation Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-psu-border bg-white font-medium">
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-psu-primary">4.51 – 5.00</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 font-semibold">
                    Outstanding
                  </span>
                </td>
                <td className="py-2 px-3 text-psu-muted">Always manifested</td>
                <td className="py-2 px-3 text-psu-muted">Role model; master instructional delivery</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-psu-primary">3.51 – 4.50</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-semibold">
                    Very Satisfactory
                  </span>
                </td>
                <td className="py-2 px-3 text-psu-muted">Often manifested</td>
                <td className="py-2 px-3 text-psu-muted">Consistently exceeds university performance criteria</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-psu-primary">2.51 – 3.50</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 font-semibold">
                    Satisfactory
                  </span>
                </td>
                <td className="py-2 px-3 text-psu-muted">Sometimes manifested</td>
                <td className="py-2 px-3 text-psu-muted">Meets fundamental instructional standards</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-psu-primary">1.51 – 2.50</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 font-semibold">
                    Fair
                  </span>
                </td>
                <td className="py-2 px-3 text-psu-muted">Seldom manifested</td>
                <td className="py-2 px-3 text-psu-muted">Targeted teaching interventions recommended</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-psu-primary">1.00 – 1.50</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 font-semibold">
                    Poor
                  </span>
                </td>
                <td className="py-2 px-3 text-psu-muted">Never / Rarely manifested</td>
                <td className="py-2 px-3 text-psu-muted">Immediate academic mentoring required</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-psu-muted">
          Scores are weighted across all validated student submissions per active semester. Final ratings
          underpin promotion, incentive awards, and faculty development plans.
        </p>
      </div>
    ),
    tags: ['grading', 'thresholds', 'rating scale', 'FR-13', 'NBC 461', 'scores', 'weights'],
  },
  {
    id: 'sentiment-recommendations',
    category: 'faculty',
    relatedCategories: ['admin', 'technical'],
    icon: HiSparkles,
    question: 'How does the Sentiment and Recommendation engine analyze evaluation feedback?',
    summary: 'Automated natural language processing that categorizes feedback sentiment and triggers improvement pathways.',
    content: (
      <div className="space-y-3 text-[13px] text-psu-text leading-relaxed">
        <p>
          FEFAS incorporates an intelligent <strong>Sentiment & Rule-Based Recommendation Engine</strong> to transform
          freeform student comments into actionable pedagogical insights:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 border border-psu-border rounded-lg space-y-1">
            <h4 className="font-semibold text-psu-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Sentiment Tone Analysis
            </h4>
            <p className="text-[12px] text-psu-muted">
              Written feedback under &quot;Strengths&quot; and &quot;Areas for Improvement&quot; is parsed for positive,
              neutral, and constructive sentiment markers, delivering high-level distribution breakdowns.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-psu-border rounded-lg space-y-1">
            <h4 className="font-semibold text-psu-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-psu-primary"></span>
              Rule-Based Action Plans
            </h4>
            <p className="text-[12px] text-psu-muted">
              Administrators configure trigger thresholds (e.g., criteria score &lt; 3.0 or specific improvement keywords).
              The system automatically correlates low scores with targeted faculty development training modules.
            </p>
          </div>
        </div>
        <p className="text-[12px] text-psu-muted">
          Faculty reports highlight both commendations for exemplary pedagogical practices and tailored recommendations
          for modern teaching strategies, assessment diversity, and classroom engagement.
        </p>
      </div>
    ),
    tags: ['sentiment', 'recommendations', 'nlp', 'ai rules', 'feedback analysis', 'comments'],
  },
  {
    id: 'mobile-access',
    category: 'technical',
    relatedCategories: ['students', 'faculty'],
    icon: HiDeviceMobile,
    question: 'Can I access and submit evaluations using my mobile phone or tablet?',
    summary: 'Full responsive support across modern iOS and Android browsers without requiring an app store download.',
    content: (
      <div className="space-y-3 text-[13px] text-psu-text leading-relaxed">
        <p>
          <strong>Yes.</strong> FEFAS is built with a responsive, mobile-first design that adapts smoothly to smartphones,
          tablets, laptops, and desktop workstations.
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-psu-muted">
          <li>
            <strong className="text-psu-text">Supported Browsers:</strong> Google Chrome, Apple Safari, Mozilla Firefox,
            and Microsoft Edge on both iOS and Android platforms.
          </li>
          <li>
            <strong className="text-psu-text">Optimized Form Controls:</strong> Rating matrices, option buttons, and
            comment boxes are touch-optimized for easy completion on smaller touchscreens.
          </li>
          <li>
            <strong className="text-psu-text">Network Continuity:</strong> An active internet connection is required during
            submission. If connection drops, please verify connectivity before tapping final submission.
          </li>
          <li>
            <strong className="text-psu-text">No App Download Needed:</strong> Access the portal directly via your device&apos;s
            browser using your standard university credentials.
          </li>
        </ul>
      </div>
    ),
    tags: ['mobile', 'tablet', 'phone', 'responsive', 'browser support', 'android', 'ios'],
  },
  {
    id: 'data-archiving-backups',
    category: 'technical',
    relatedCategories: ['admin'],
    icon: HiDatabase,
    question: 'How are evaluation records archived, backed up, and protected across semesters?',
    summary: 'Immutable semester archiving, database backups, and institutional data retention standards.',
    content: (
      <div className="space-y-3 text-[13px] text-psu-text leading-relaxed">
        <p>
          The evaluation system implements comprehensive data persistence and archiving procedures to maintain compliance
          with Philippine higher education auditing standards:
        </p>
        <div className="space-y-2">
          <div className="p-3 border border-psu-border rounded-lg bg-slate-50">
            <span className="font-semibold text-psu-text">Immutable Historical Archiving:</span>
            <p className="text-[12px] text-psu-muted mt-0.5">
              When an academic period is marked &quot;Closed&quot; by an administrator, submitted evaluations are locked against
              edits. Historical records remain accessible for longitudinal reports, accreditation reviews, and faculty
              rank re-evaluations.
            </p>
          </div>
          <div className="p-3 border border-psu-border rounded-lg bg-slate-50">
            <span className="font-semibold text-psu-text">Periodic Database Backups:</span>
            <p className="text-[12px] text-psu-muted mt-0.5">
              Automated database snapshots and encrypted off-site backups are conducted regularly by the MIS team.
              Audit logs capture every administrative account action, semester state transition, and configuration update.
            </p>
          </div>
          <div className="p-3 border border-psu-border rounded-lg bg-slate-50">
            <span className="font-semibold text-psu-text">Export Capabilities:</span>
            <p className="text-[12px] text-psu-muted mt-0.5">
              Authorized administrators can export comprehensive evaluation archives in standard Microsoft Excel (.xlsx)
              and Word (.docx) formats for offline institutional records.
            </p>
          </div>
        </div>
      </div>
    ),
    tags: ['backup', 'archiving', 'database', 'retention', 'security', 'audit logs', 'export'],
  },
  {
    id: 'password-reset',
    category: 'students',
    relatedCategories: ['faculty', 'admin', 'technical'],
    icon: HiKey,
    question: 'How do I reset my password if I forget my login credentials?',
    summary: 'Self-service password recovery via secure email reset token, or administrative verification.',
    content: (
      <div className="space-y-3 text-[13px] text-psu-text leading-relaxed">
        <p>
          If you have forgotten your password or are locked out of your FEFAS account:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2 text-psu-muted">
          <li>
            <strong className="text-psu-text">Navigate to Forgot Password:</strong> On the Login page, click the{' '}
            <Link to="/forgot-password" className="text-psu-primary underline font-medium">
              Forgot Password?
            </Link>{' '}
            link located below the password field.
          </li>
          <li>
            <strong className="text-psu-text">Enter University Email:</strong> Input your registered institutional email
            address associated with your student or faculty profile.
          </li>
          <li>
            <strong className="text-psu-text">Receive Reset Token:</strong> Check your inbox for a password reset email
            containing a one-time secure link. The link expires after <strong>1 hour</strong> for security.
          </li>
          <li>
            <strong className="text-psu-text">Set New Password:</strong> Follow the link to choose a strong password
            (minimum 8 characters, combining uppercase, lowercase, numbers, and symbols).
          </li>
        </ol>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-900">
          <strong>Didn&apos;t receive an email?</strong> Check your Spam/Junk folder. If your email address on file is
          incorrect or inactive, please contact your Campus MIS / ICT Office or an Administrator to request identity verification
          and a manual credential reset.
        </div>
      </div>
    ),
    tags: ['password', 'reset', 'forgot password', 'account', 'login', 'credentials'],
  },
  {
    id: 'student-multiple-evals',
    category: 'students',
    relatedCategories: [],
    icon: HiOutlineBookOpen,
    question: 'Can I edit or re-submit my faculty evaluation after clicking submit?',
    summary: 'Submissions are final to maintain survey integrity and prevent duplicate responses.',
    content: (
      <div className="space-y-2 text-[13px] text-psu-text leading-relaxed">
        <p>
          <strong>No.</strong> Once you review and submit your evaluation for a specific faculty member, your responses
          are permanently logged and cannot be edited. This ensures evaluation integrity and prevents retroactive changes.
        </p>
        <p className="text-psu-muted text-[12px]">
          Before clicking &quot;Submit Evaluation&quot;, please carefully review your rating selections on each criterion
          and ensure your written comments are respectful, constructive, and accurate.
        </p>
      </div>
    ),
    tags: ['submission', 'edit', 'student', 're-submit', 'draft'],
  },
  {
    id: 'faculty-view-results',
    category: 'faculty',
    relatedCategories: [],
    icon: HiUserGroup,
    question: 'When will faculty members be able to view their evaluation results?',
    summary: 'Evaluation reports become accessible once the active period is officially closed.',
    content: (
      <div className="space-y-2 text-[13px] text-psu-text leading-relaxed">
        <p>
          Faculty members can access their individual performance summaries and qualitative comments on the{' '}
          <strong>Reports</strong> page once the University Administrator officially closes the active evaluation period.
        </p>
        <p className="text-psu-muted text-[12px]">
          Holding result publication until semester closing ensures that student grading is not biased or affected by
          interim feedback during the ongoing term.
        </p>
      </div>
    ),
    tags: ['faculty results', 'view ratings', 'when available', 'semester close'],
  },
  {
    id: 'admin-periods-setup',
    category: 'admin',
    relatedCategories: ['technical'],
    icon: HiShieldCheck,
    question: 'How do Administrators activate or close an Academic Evaluation Period?',
    summary: 'Manage academic terms and active evaluation states through the Semesters module.',
    content: (
      <div className="space-y-2 text-[13px] text-psu-text leading-relaxed">
        <p>
          Administrators can manage evaluation cycles under <strong>Semesters (Academic Periods)</strong> in the top navigation:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-psu-muted text-[12px]">
          <li>Only <strong>one academic period</strong> can be active at any given time.</li>
          <li>Activating a new period automatically archives the previous period.</li>
          <li>Set evaluation start and end dates to define the window when students may evaluate.</li>
          <li>Evaluation forms are dynamically enabled only while the active period remains open.</li>
        </ul>
      </div>
    ),
    tags: ['admin', 'academic periods', 'semester', 'activation', 'dates'],
  },
  {
    id: 'admin-question-bank',
    category: 'admin',
    relatedCategories: [],
    icon: HiShieldCheck,
    question: 'Can evaluation questions and criteria be modified for upcoming terms?',
    summary: 'Customizable evaluation criteria and question sets under the Questions administration module.',
    content: (
      <div className="space-y-2 text-[13px] text-psu-text leading-relaxed">
        <p>
          Yes. Administrators with proper privileges can access the <strong>Questions</strong> module to update,
          reorder, activate, or archive evaluation criteria (e.g., Commitment, Knowledge of Subject, Teaching for
          Independent Learning, Management of Learning).
        </p>
        <p className="text-psu-muted text-[12px]">
          <em>Best practice:</em> Modify question banks prior to opening an evaluation period. Once students begin submitting
          evaluations, altering questionnaire items during an active period is restricted to prevent metric discrepancies.
        </p>
      </div>
    ),
    tags: ['questions', 'criteria', 'questionnaire', 'customization', 'admin'],
  },
  {
    id: 'tech-security-privacy',
    category: 'technical',
    relatedCategories: ['admin'],
    icon: HiServer,
    question: 'What security standards and access controls protect FEFAS data?',
    summary: 'JWT session tokens, bcrypt encryption, role-based access control, and comprehensive audit logs.',
    content: (
      <div className="space-y-2 text-[13px] text-psu-text leading-relaxed">
        <p>
          FEFAS implements robust defense-in-depth security measures to protect institutional records:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-psu-muted text-[12px]">
          <li><strong>Authentication:</strong> Encrypted JSON Web Tokens (JWT) with HTTP-only safety standards.</li>
          <li><strong>Password Security:</strong> One-way salted hash storage using <em>bcrypt</em>.</li>
          <li><strong>Role-Based Access (RBAC):</strong> Strict segmentation ensuring students, faculty, and administrators access only authorized endpoints.</li>
          <li><strong>System Audit Logging:</strong> Immutable logging of sensitive operations including logins, password changes, account modifications, and period state shifts.</li>
        </ul>
      </div>
    ),
    tags: ['security', 'jwt', 'bcrypt', 'audit logs', 'rbac', 'encryption'],
  },
];

const HelpFaq = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedIds, setExpandedIds] = useState(new Set(['eval-anonymity', 'grading-thresholds']));

  // Filter items based on active category and search term
  const filteredFaqs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return FAQ_ITEMS.filter((item) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category === selectedCategory ||
        item.relatedCategories.includes(selectedCategory);

      if (!matchesCategory) return false;

      // Search term filter
      if (!term) return true;

      const questionMatch = item.question.toLowerCase().includes(term);
      const summaryMatch = item.summary.toLowerCase().includes(term);
      const tagMatch = item.tags.some((tag) => tag.toLowerCase().includes(term));

      return questionMatch || summaryMatch || tagMatch;
    });
  }, [searchTerm, selectedCategory]);

  // Compute question counts per category
  const categoryCounts = useMemo(() => {
    const counts = { all: FAQ_ITEMS.length };
    CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = FAQ_ITEMS.filter(
          (item) => item.category === cat.id || item.relatedCategories.includes(cat.id)
        ).length;
      }
    });
    return counts;
  }, []);

  const toggleAccordion = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandedIds.size === filteredFaqs.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredFaqs.map((f) => f.id)));
    }
  };

  const isAllExpanded = filteredFaqs.length > 0 && expandedIds.size === filteredFaqs.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-psu-primary to-psu-secondary rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[12px] font-medium backdrop-blur-sm">
              <HiOutlineBookOpen className="w-4 h-4 text-psu-gold" />
              <span>Knowledge Base & Support</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Help & Frequently Asked Questions</h1>
            <p className="text-sm text-blue-100 max-w-xl">
              Guidance for students, faculty members, and system administrators navigating the Pangasinan State University
              Faculty Evaluation System (FEFAS).
            </p>
          </div>
          <div className="shrink-0 hidden sm:block">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <HiQuestionMarkCircle className="w-10 h-10 text-psu-gold" />
            </div>
          </div>
        </div>

        {/* Real-time Search Bar */}
        <div className="mt-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-psu-muted">
            <HiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions by keyword (e.g., anonymity, grading, sentiment, password, mobile)..."
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white text-psu-text text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-psu-gold shadow-md transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
              title="Clear search"
            >
              <HiX className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Role Segmented Categories Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-psu-border pb-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          const count = categoryCounts[category.id] || 0;

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-psu-primary text-white shadow-sm'
                  : 'bg-white text-psu-muted border border-psu-border hover:text-psu-text hover:border-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-psu-gold' : 'text-psu-muted'}`} />
              <span>{category.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-psu-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Header / Controls */}
      <div className="flex items-center justify-between text-[13px] text-psu-muted px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-psu-text">{filteredFaqs.length}</strong>{' '}
            {filteredFaqs.length === 1 ? 'question' : 'questions'}
            {searchTerm && (
              <>
                {' '}
                matching &quot;<span className="text-psu-primary font-medium">{searchTerm}</span>&quot;
              </>
            )}
          </span>
        </div>
        {filteredFaqs.length > 0 && (
          <button
            onClick={handleExpandAll}
            className="text-psu-primary hover:underline font-medium text-[12px] flex items-center gap-1 cursor-pointer"
          >
            {isAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      {/* Accordion FAQ List */}
      {filteredFaqs.length === 0 ? (
        <div className="bg-white border border-psu-border rounded-xl p-8 text-center space-y-3">
          <HiQuestionMarkCircle className="w-12 h-12 text-psu-muted mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-psu-text">No matching questions found</h3>
          <p className="text-[13px] text-psu-muted max-w-md mx-auto">
            We couldn&apos;t find any answers matching your criteria. Try adjusting your search term or selecting another
            role category above.
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-2 inline-flex items-center px-4 py-2 text-xs font-semibold text-psu-primary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedIds.has(faq.id);
            const Icon = faq.icon;

            return (
              <div
                key={faq.id}
                className={`bg-white border transition-all rounded-xl overflow-hidden ${
                  isExpanded ? 'border-psu-primary shadow-sm ring-1 ring-psu-primary/20' : 'border-psu-border hover:border-gray-300'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isExpanded ? 'bg-psu-primary text-white' : 'bg-slate-100 text-psu-primary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold text-psu-text leading-snug">
                          {faq.question}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-psu-muted">
                          {faq.category}
                        </span>
                      </div>
                      {!isExpanded && (
                        <p className="text-[12px] text-psu-muted line-clamp-1">
                          {faq.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-psu-muted mt-1">
                    {isExpanded ? (
                      <HiChevronUp className="w-5 h-5 text-psu-primary" />
                    ) : (
                      <HiChevronDown className="w-5 h-5 hover:text-psu-text" />
                    )}
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3">
                    {faq.content}

                    {/* Tag list */}
                    {faq.tags && faq.tags.length > 0 && (
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-psu-muted">Tags:</span>
                        {faq.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchTerm(tag);
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Support & Contact Card */}
      <div className="bg-white border border-psu-border rounded-xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-psu-text flex items-center gap-2">
              <HiMail className="w-5 h-5 text-psu-primary" />
              Still have questions or need technical assistance?
            </h3>
            <p className="text-[13px] text-psu-muted">
              Contact the Pangasinan State University Management Information Systems (MIS) Office or Campus ICT Administrator.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/privacy"
              className="px-3.5 py-2 text-[12px] font-medium text-psu-text border border-psu-border rounded-lg hover:bg-slate-50 transition"
            >
              Privacy Policy
            </Link>
            <a
              href="mailto:support.fefas@psu.edu.ph"
              className="px-4 py-2 text-[12px] font-semibold text-white bg-psu-primary rounded-lg hover:bg-psu-secondary transition shadow-sm"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpFaq;

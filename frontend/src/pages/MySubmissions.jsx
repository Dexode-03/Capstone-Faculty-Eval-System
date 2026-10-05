import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineClipboardCheck,
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineStar,
  HiOutlineEmojiHappy,
  HiOutlineEmojiSad,
  HiOutlineMinusSm,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineLockClosed,
  HiArrowLeft,
} from 'react-icons/hi';
import evaluationService from '../services/evaluationService';

// ── Sentiment badge ──────────────────────────────────────────────────────────
const SentimentBadge = ({ sentiment }) => {
  const map = {
    positive: {
      label: 'Positive',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Icon: HiOutlineEmojiHappy,
    },
    negative: {
      label: 'Negative',
      cls: 'bg-red-50 text-red-700 border-red-200',
      Icon: HiOutlineEmojiSad,
    },
    neutral: {
      label: 'Neutral',
      cls: 'bg-slate-50 text-slate-600 border-slate-200',
      Icon: HiOutlineMinusSm,
    },
  };
  const { label, cls, Icon } = map[sentiment] || map.neutral;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

// ── Star rating display ──────────────────────────────────────────────────────
const StarRating = ({ rating }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <HiOutlineStar
        key={n}
        className={`w-3.5 h-3.5 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
        style={{ fill: n <= rating ? '#fbbf24' : 'none' }}
      />
    ))}
    <span className="ml-1 text-[12px] font-semibold text-psu-text">{rating}/5</span>
  </span>
);

// ── Single submission card ───────────────────────────────────────────────────
const SubmissionCard = ({ submission }) => {
  const [expanded, setExpanded] = useState(false);

  const date = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const hasFeedback = submission.strengths || submission.weaknesses;

  return (
    <div className="bg-white border border-psu-border rounded-xl overflow-hidden transition-shadow hover:shadow-md">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-psu-primary/10 flex items-center justify-center">
            <HiOutlineAcademicCap className="w-5 h-5 text-psu-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-psu-text text-[14px] leading-tight truncate">
              {submission.faculty_name}
            </p>
            <p className="text-[12px] text-psu-muted mt-0.5">{submission.department}</p>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <SentimentBadge sentiment={submission.sentiment} />
          <StarRating rating={submission.rating} />
        </div>
      </div>

      {/* Date row */}
      <div className="px-5 pb-3 flex items-center gap-1.5 text-[12px] text-psu-muted">
        <HiOutlineCalendar className="w-3.5 h-3.5" />
        Submitted {date}
        {/* Privacy note */}
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-psu-muted/70">
          <HiOutlineLockClosed className="w-3 h-3" />
          Anonymous submission
        </span>
      </div>

      {/* Expandable feedback */}
      {hasFeedback && (
        <>
          <div className="border-t border-psu-border/60" />
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full px-5 py-2.5 flex items-center justify-between text-[12px] font-medium text-psu-primary hover:bg-psu-primary/5 transition-colors"
          >
            <span>{expanded ? 'Hide' : 'View'} my feedback</span>
            {expanded ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="px-5 pb-4 grid gap-3">
              {submission.strengths && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">Strengths noted</p>
                  <p className="text-[13px] text-emerald-900 leading-relaxed">{submission.strengths}</p>
                </div>
              )}
              {submission.weaknesses && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider mb-1">Areas for improvement</p>
                  <p className="text-[13px] text-red-900 leading-relaxed">{submission.weaknesses}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await evaluationService.getMyEvaluations();
        setSubmissions(res.data.evaluations || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load your submission history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Loading skeleton ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 h-8 w-48 bg-psu-border/60 rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-4 h-28 bg-psu-border/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-[13px] text-psu-primary underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-psu-muted hover:text-psu-primary mb-4 transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-psu-primary/10 flex items-center justify-center">
            <HiOutlineClipboardCheck className="w-6 h-6 text-psu-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-psu-text tracking-tight">My Submissions</h1>
            <p className="text-[13px] text-psu-muted mt-0.5">
              Your evaluation history — submitted anonymously
            </p>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          <HiOutlineLockClosed className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            Your evaluations are submitted <strong>anonymously</strong>. Only you can see this list.
            Faculty members and other students cannot see who submitted which evaluation.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {submissions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-psu-border rounded-xl bg-white">
          <HiOutlineClipboardCheck className="w-10 h-10 text-psu-muted/50 mx-auto mb-3" />
          <p className="text-[15px] font-medium text-psu-text">No submissions yet</p>
          <p className="text-[13px] text-psu-muted mt-1">
            Your completed evaluations will appear here once submitted.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-block text-[13px] font-medium text-psu-primary underline"
          >
            Go to Evaluations
          </Link>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] text-psu-muted">
              <span className="font-semibold text-psu-text">{submissions.length}</span>{' '}
              {submissions.length === 1 ? 'evaluation' : 'evaluations'} submitted
            </p>
            <div className="flex gap-2 text-[12px]">
              {['positive', 'neutral', 'negative'].map(s => {
                const count = submissions.filter(e => e.sentiment === s).length;
                if (!count) return null;
                const colors = { positive: 'text-emerald-600', neutral: 'text-slate-500', negative: 'text-red-600' };
                return (
                  <span key={s} className={`font-medium ${colors[s]}`}>
                    {count} {s}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Submission list */}
          <div className="flex flex-col gap-3">
            {submissions.map((s, i) => (
              <SubmissionCard key={s.submission_id ?? s.evaluation_id ?? i} submission={s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MySubmissions;

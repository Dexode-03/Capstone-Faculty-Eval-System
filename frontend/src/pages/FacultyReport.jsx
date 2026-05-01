import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiArrowLeft,
  HiOutlineChat,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiEmojiHappy,
  HiEmojiSad,
  HiMinusCircle,
} from 'react-icons/hi';
import evaluationService from '../services/evaluationService';
import facultyService from '../services/facultyService';

const heatBg = (sentiment, rate) => {
  const alpha = Math.max(0.08, Math.min(0.85, rate / 100));
  if (sentiment === 'positive') return `rgba(30, 64, 175, ${alpha})`;
  if (sentiment === 'neutral') return `rgba(234, 179, 8, ${alpha})`;
  return `rgba(239, 68, 68, ${alpha})`;
};

// ── Sentiment badge ───────────────────────────────────────────────
const SentimentBadge = ({ label }) => {
  const styles = {
    positive: 'bg-psu-primary/10 text-psu-primary',
    neutral:  'bg-gray-100 text-psu-muted',
    negative: 'bg-red-50 text-red-600',
  };
  const Icon = label === 'positive' ? HiEmojiHappy : label === 'negative' ? HiEmojiSad : HiMinusCircle;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${styles[label] || styles.neutral}`}>
      <Icon className="h-3.5 w-3.5 mr-1" />
      {label}
    </span>
  );
};

/**
 * FacultyReport supports two modes:
 * 1. Admin mode  — URL has :id param → fetches data for that faculty member
 * 2. Self mode   — No :id param (faculty viewing their own report via /reports)
 *                  → fetches from /api/evaluation/my-report
 */
const FacultyReport = () => {
  const { id } = useParams();
  const isSelfMode = !id;

  const [faculty,  setFaculty]  = useState(null);
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (isSelfMode) {
          // Faculty viewing their own report
          const res = await evaluationService.getMyFacultyReport();
          setFaculty(res.data.faculty);
          setReport(res.data);
        } else {
          // Admin viewing a specific faculty member's report
          const [facultyRes, reportRes] = await Promise.all([
            facultyService.getById(id),
            evaluationService.getFacultyEvaluations(id),
          ]);
          setFaculty(facultyRes.data.faculty);
          setReport(reportRes.data);
        }
      } catch {
        setError('Failed to load evaluation report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, isSelfMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-[13px] text-red-500">{error}</p>
        {!isSelfMode && (
          <Link to="/faculty" className="text-psu-primary text-[13px] mt-3 inline-block hover:underline">
            Back to faculty list
          </Link>
        )}
      </div>
    );
  }

  if (!report || report.totalEvaluations === 0) {
    return (
      <div>
        {!isSelfMode && (
          <Link
            to="/faculty"
            className="inline-flex items-center gap-1.5 text-[13px] text-psu-muted hover:text-psu-text transition-colors mb-8"
          >
            <HiArrowLeft className="h-4 w-4" />
            Back to Faculty
          </Link>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-psu-primary/10 border border-psu-border flex items-center justify-center flex-shrink-0">
              <span className="text-[16px] font-semibold text-psu-primary">
                {faculty?.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div>
              <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-0.5">
                {isSelfMode ? 'My Evaluation Report' : 'Faculty Report'}
              </p>
              <h1 className="text-2xl font-semibold text-psu-text tracking-tight">{faculty?.name}</h1>
              <p className="text-[13px] text-psu-muted mt-0.5">{faculty?.department}</p>
            </div>
          </div>
        </div>
        <div className="border border-psu-border bg-white rounded-lg px-6 py-16 text-center">
          <p className="text-[14px] font-semibold text-psu-text">No evaluations yet</p>
          <p className="text-[13px] text-psu-muted mt-1">
            {isSelfMode
              ? 'Your evaluation report will appear here once students start submitting evaluations.'
              : 'Reports will appear here once students start submitting evaluations.'}
          </p>
        </div>
      </div>
    );
  }

  const total = report.sentimentOverview.positive + report.sentimentOverview.neutral + report.sentimentOverview.negative;
  const pct   = v => total === 0 ? 0 : Math.round((v / total) * 100);

  return (
    <div>
      {/* Back — admin only */}
      {!isSelfMode && (
        <Link
          to="/faculty"
          className="inline-flex items-center gap-1.5 text-[13px] text-psu-muted hover:text-psu-text transition-colors mb-8"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Faculty
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-psu-primary/10 border border-psu-border flex items-center justify-center flex-shrink-0">
            <span className="text-[16px] font-semibold text-psu-primary">
              {faculty?.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </span>
          </div>
          <div>
            <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-0.5">
              {isSelfMode ? 'My Evaluation Report' : 'Faculty Report'}
            </p>
            <h1 className="text-2xl font-semibold text-psu-text tracking-tight">{faculty?.name}</h1>
            <p className="text-[13px] text-psu-muted mt-0.5">{faculty?.department}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[12px] text-psu-muted uppercase tracking-wider">Total evaluations</p>
          <p className="text-3xl font-bold text-psu-text tabular-nums">{report.totalEvaluations}</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Average Rating</p>
          <p className="text-4xl font-bold text-psu-text tabular-nums mb-2">{report.averageRating}</p>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-psu-primary/10 text-psu-primary text-[13px] font-semibold">
            {report.averageRating} / 5
          </span>
        </div>
      </div>

      {/* Category averages */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineChartBar className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Category Averages</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {Object.entries(report.categoryAverages).map(([category, avg]) => (
            <div key={category} className="px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-[13px] font-medium text-psu-text">{category}</p>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="w-32 h-1.5 bg-gray-100 rounded-full hidden sm:block">
                  <div
                    className="bg-psu-primary h-full rounded-full transition-all duration-700"
                    style={{ width: `${(avg / 5) * 100}%` }}
                  />
                </div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-psu-primary/10 text-psu-primary text-[13px] font-bold tabular-nums">
                  {avg}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment heat map */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border">
          <h2 className="text-[13px] font-semibold text-psu-text">Sentiment Heat Map</h2>
          <p className="text-[12px] text-psu-muted mt-1">
            Darker cells indicate higher share of that sentiment in this faculty report.
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'positive', label: 'Positive', count: report.sentimentOverview.positive, icon: HiEmojiHappy },
              { key: 'neutral', label: 'Neutral', count: report.sentimentOverview.neutral, icon: HiMinusCircle },
              { key: 'negative', label: 'Negative', count: report.sentimentOverview.negative, icon: HiEmojiSad },
            ].map((item) => {
              const rate = pct(item.count);
              return (
                <div
                  key={item.key}
                  className="rounded-lg px-4 py-4 text-white"
                  style={{ backgroundColor: heatBg(item.key, rate) }}
                  title={`${item.count} / ${total} (${rate}%)`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider opacity-95 inline-flex items-center gap-1">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums mt-1">{rate}%</p>
                  <p className="text-[11px] opacity-95 mt-1">{item.count} of {total}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prescriptive recommendations */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineLightBulb className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Prescriptive Recommendations</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {report.recommendations.map((rec, i) => {
            const isPositive = rec.toLowerCase().includes('excellent') ||
                               rec.toLowerCase().includes('strong') ||
                               rec.toLowerCase().includes('appreciate') ||
                               rec.toLowerCase().includes('maintain') ||
                               rec.toLowerCase().includes('nominating') ||
                               rec.toLowerCase().includes('recognition');
            return (
              <div key={i} className="px-6 py-4 flex items-start gap-3">
                {isPositive ? (
                  <HiOutlineCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <HiOutlineExclamation className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-[14px] text-psu-text leading-relaxed">{rec}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent feedback */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineChat className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Recent Feedback</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {report.recentFeedback.map(item => (
            <div key={item.id} className="px-6 py-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-psu-primary/10 text-psu-primary text-[13px] font-bold tabular-nums flex-shrink-0">
                  {item.rating}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <SentimentBadge label={item.sentiment} />
                  <span className="text-[11px] text-psu-muted tabular-nums">
                    {new Date(item.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] font-semibold text-psu-muted uppercase tracking-wider mb-1">Strengths</p>
                  <p className="text-[14px] text-psu-text leading-relaxed">
                    {item.strengths?.trim() ? item.strengths : 'No strengths provided.'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-psu-muted uppercase tracking-wider mb-1">Weaknesses</p>
                  <p className="text-[14px] text-psu-text leading-relaxed">
                    {item.weaknesses?.trim() ? item.weaknesses : 'No weaknesses provided.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyReport;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiArrowRight,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi';
import evaluationService from '../services/evaluationService';

// ── Health badge ──────────────────────────────────────────────────────────────
const HealthBadge = ({ status }) => {
  const map = {
    excellent:         'bg-green-50 text-green-700 border-green-200',
    good:              'bg-psu-primary/10 text-psu-primary border-psu-primary/20',
    fair:              'bg-amber-50 text-amber-700 border-amber-200',
    needs_improvement: 'bg-red-50 text-red-600 border-red-200',
    insufficient_data: 'bg-gray-100 text-psu-muted border-psu-border',
  };
  const labels = {
    excellent:         'Excellent',
    good:              'Good',
    fair:              'Fair',
    needs_improvement: 'Needs Improvement',
    insufficient_data: 'Insufficient Data',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${map[status] || map.insufficient_data}`}>
      {labels[status] || status}
    </span>
  );
};

// ── Mini stacked sentiment bar ────────────────────────────────────────────────
const SentimentBar = ({ positive, neutral, negative }) => {
  const total = positive + neutral + negative || 1;
  const pPct  = Math.round((positive / total) * 100);
  const nPct  = Math.round((neutral  / total) * 100);
  const nePct = Math.round((negative / total) * 100);
  return (
    <div className="flex h-2 rounded-full overflow-hidden w-full bg-gray-100">
      <div className="bg-green-400 transition-all"    style={{ width: `${pPct}%`  }} title={`${pPct}% positive`}  />
      <div className="bg-amber-300 transition-all"    style={{ width: `${nPct}%`  }} title={`${nPct}% neutral`}   />
      <div className="bg-red-400 transition-all"      style={{ width: `${nePct}%` }} title={`${nePct}% negative`} />
    </div>
  );
};

// ── Department card inside year-level section ─────────────────────────────────
const DeptCard = ({ group }) => {
  const [open, setOpen] = useState(false);
  const { sentimentCounts: sc } = group;

  return (
    <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Left: dept name + badge */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-psu-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <HiOutlineOfficeBuilding className="h-4 w-4 text-psu-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-psu-text leading-snug truncate">{group.department}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <HealthBadge status={group.status} />
                <span className="text-[11px] text-psu-muted flex items-center gap-1">
                  <HiOutlineUsers className="h-3 w-3" />
                  {group.evaluatedStudents} student{group.evaluatedStudents !== 1 ? 's' : ''}
                </span>
                <span className="text-[11px] text-psu-muted">
                  {group.totalEvaluations} evaluation{group.totalEvaluations !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Right: rating + sentiment snapshot */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-psu-text tabular-nums leading-none">{group.avgRating}</p>
              <p className="text-[10px] text-psu-muted mt-0.5">avg / 5</p>
            </div>
            <div className="flex flex-col gap-1 text-[11px] text-psu-muted min-w-[80px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                {group.positiveRate}% pos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                {group.negativeRate}% neg
              </span>
            </div>
          </div>
        </div>

        {/* Sentiment bar */}
        <div className="mt-4">
          <SentimentBar
            positive={sc.positive}
            neutral={sc.neutral}
            negative={sc.negative}
          />
          <div className="flex justify-between mt-1 text-[10px] text-psu-muted">
            <span>{sc.positive} positive</span>
            <span>{sc.neutral} neutral</span>
            <span>{sc.negative} negative</span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-psu-primary hover:text-psu-primary/80 transition-colors"
        >
          <HiOutlineLightBulb className="h-3.5 w-3.5" />
          {open ? 'Hide' : 'Show'} recommendations
          {open ? <HiChevronUp className="h-3.5 w-3.5" /> : <HiChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expandable recommendations */}
      {open && (
        <div className="border-t border-psu-border bg-gray-50/60 divide-y divide-psu-border">

          {/* Prescriptive recommendations */}
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold text-psu-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HiOutlineClipboardList className="h-3.5 w-3.5" />
              Prescriptive Recommendations
            </p>
            <div className="space-y-2">
              {(group.recommendations || []).map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-psu-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-psu-primary">{i + 1}</span>
                  </div>
                  <p className="text-[13px] text-psu-text leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top keywords */}
          {(group.topWeaknessKeywords?.length > 0 || group.topStrengthKeywords?.length > 0) && (
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Weakness keywords */}
              {group.topWeaknessKeywords?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-2">
                    Top Concern Keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.topWeaknessKeywords.map(({ word, count }) => (
                      <span
                        key={word}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[11px]"
                      >
                        {word}
                        <span className="text-[10px] opacity-70">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strength keywords */}
              {group.topStrengthKeywords?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-2">
                    Top Strength Keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.topStrengthKeywords.map(({ word, count }) => (
                      <span
                        key={word}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 text-[11px]"
                      >
                        {word}
                        <span className="text-[10px] opacity-70">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Year-level section with its dept cards ────────────────────────────────────
const YearSection = ({ yearLevel, groups }) => {
  const totalEvals    = groups.reduce((s, g) => s + g.totalEvaluations, 0);
  const totalStudents = groups.reduce((s, g) => s + g.evaluatedStudents, 0);
  const avgRating     = groups.length
    ? parseFloat((groups.reduce((s, g) => s + g.avgRating, 0) / groups.length).toFixed(2))
    : 0;
  const allSC = groups.reduce(
    (acc, g) => ({
      positive: acc.positive + g.sentimentCounts.positive,
      neutral:  acc.neutral  + g.sentimentCounts.neutral,
      negative: acc.negative + g.sentimentCounts.negative,
    }),
    { positive: 0, neutral: 0, negative: 0 }
  );
  const totalSC    = allSC.positive + allSC.neutral + allSC.negative || 1;
  const posRate    = Math.round((allSC.positive / totalSC) * 100);

  return (
    <div className="mb-10">
      {/* Year-level header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-psu-primary flex items-center justify-center flex-shrink-0">
            <HiOutlineAcademicCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-psu-text leading-tight">{yearLevel}</h3>
            <p className="text-[12px] text-psu-muted">
              {groups.length} department{groups.length !== 1 ? 's' : ''} · {totalStudents} student{totalStudents !== 1 ? 's' : ''} · {totalEvals} evaluation{totalEvals !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Year-level aggregate stats */}
        <div className="flex items-center gap-4 text-[12px] shrink-0">
          <div className="flex items-center gap-1.5 text-psu-muted">
            <HiOutlineArrowUp className="h-3.5 w-3.5 text-green-500" />
            <span>{posRate}% positive</span>
          </div>
          <div className="text-psu-text font-semibold tabular-nums">
            {avgRating} / 5 avg
          </div>
        </div>
      </div>

      {/* Thin aggregate bar */}
      <SentimentBar positive={allSC.positive} neutral={allSC.neutral} negative={allSC.negative} />
      <div className="mt-2 mb-5 flex gap-4 text-[11px] text-psu-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> {allSC.positive} positive</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300 inline-block" /> {allSC.neutral} neutral</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> {allSC.negative} negative</span>
      </div>

      {/* Department cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groups.map(g => (
          <DeptCard key={`${g.year_level}-${g.department}`} group={g} />
        ))}
      </div>
    </div>
  );
};

// ── Main Reports page ─────────────────────────────────────────────────────────
const Reports = () => {
  const [analysis,    setAnalysis]    = useState(null);
  const [yearData,    setYearData]    = useState(null);   // { groups, yearLevels }
  const [activeYear,  setActiveYear]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [sysRes, yearRes] = await Promise.all([
          evaluationService.getSystemAnalysis(),
          evaluationService.getAnalysisByYearDepartment(),
        ]);
        setAnalysis(sysRes.data);
        setYearData(yearRes.data);
        if (yearRes.data?.yearLevels?.length > 0) {
          setActiveYear(yearRes.data.yearLevels[0]);
        }
      } catch {
        setError('Failed to load system analysis.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
      </div>
    );
  }

  if (!analysis || analysis.totalEvaluations === 0) {
    return (
      <div>
        <div className="mb-10">
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Analytics</p>
          <h1 className="text-3xl font-semibold text-psu-text tracking-tight">System Reports</h1>
          <p className="text-[13px] text-psu-muted mt-1">Prescriptive analysis across all faculty and departments.</p>
        </div>
        <div className="border border-psu-border bg-white rounded-lg px-6 py-16 text-center">
          <p className="text-[14px] font-semibold text-psu-text">No evaluations yet</p>
          <p className="text-[13px] text-psu-muted mt-1">
            Reports will appear here once students start submitting evaluations.
          </p>
        </div>
      </div>
    );
  }

  const sentimentCounts = analysis.sentimentCounts || { positive: 0, neutral: 0, negative: 0 };
  const total = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  const pct   = v => total === 0 ? 0 : Math.round((v / total) * 100);

  // Groups for the active year tab
  const activeGroups = yearData?.groups?.filter(g => g.year_level === activeYear) || [];

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-10">
        <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Analytics</p>
        <h1 className="text-3xl font-semibold text-psu-text tracking-tight">System Reports</h1>
        <p className="text-[13px] text-psu-muted mt-1">
          Prescriptive analysis across all faculty and departments.
        </p>
      </div>

      {/* ── Overview row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">System Health</p>
          <HealthBadge status={analysis.overallHealth} />
        </div>
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Avg. Rating</p>
          <p className="text-3xl font-bold text-psu-text tabular-nums">{analysis.avgRating}</p>
          <p className="text-[11px] text-psu-muted mt-0.5">out of 5</p>
        </div>
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Positive Rate</p>
          <p className="text-3xl font-bold text-psu-primary tabular-nums">{analysis.positiveRate}%</p>
          <p className="text-[11px] text-psu-muted mt-0.5">{sentimentCounts.positive} evaluations</p>
        </div>
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Total Evaluations</p>
          <p className="text-3xl font-bold text-psu-text tabular-nums">{analysis.totalEvaluations}</p>
          <p className="text-[11px] text-psu-muted mt-0.5">this semester</p>
        </div>
      </div>

      {/* ── System recommendations ── */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineLightBulb className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">System-wide Recommendations</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {analysis.systemRecommendations.map((rec, i) => (
            <div key={i} className="px-6 py-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-psu-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-psu-primary">{i + 1}</span>
              </div>
              <p className="text-[14px] text-psu-text leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Keyword trends ── */}
      {analysis.trends.length > 0 && (
        <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
            <HiOutlineChartBar className="h-4 w-4 text-psu-muted" />
            <h2 className="text-[13px] font-semibold text-psu-text">Keyword Trends</h2>
          </div>
          <div className="divide-y divide-psu-border">
            {analysis.trends.map((trend, i) => (
              <div key={i} className="px-6 py-4 flex items-start gap-3">
                {trend.type === 'positive' ? (
                  <HiOutlineCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <HiOutlineExclamation className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-[14px] text-psu-text leading-relaxed">{trend.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sentiment breakdown ── */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border">
          <h2 className="text-[13px] font-semibold text-psu-text">Sentiment Breakdown</h2>
        </div>
        <div className="p-6">
          <div className="flex h-3 rounded-full overflow-hidden mb-6">
            <div className="bg-psu-primary transition-all" style={{ width: `${pct(sentimentCounts.positive)}%` }} />
            <div className="bg-psu-gold transition-all"    style={{ width: `${pct(sentimentCounts.neutral)}%`  }} />
            <div className="bg-red-400 transition-all"     style={{ width: `${pct(sentimentCounts.negative)}%` }} />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Positive', val: sentimentCounts.positive, pctVal: pct(sentimentCounts.positive), color: 'bg-psu-primary', badge: 'bg-psu-primary/10 text-psu-primary' },
              { label: 'Neutral',  val: sentimentCounts.neutral,  pctVal: pct(sentimentCounts.neutral),  color: 'bg-psu-gold',    badge: 'bg-amber-50 text-amber-600'         },
              { label: 'Negative', val: sentimentCounts.negative, pctVal: pct(sentimentCounts.negative), color: 'bg-red-400',     badge: 'bg-red-50 text-red-600'             },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${item.badge}`}>
                    {item.label}
                  </span>
                  <span className="text-[13px] font-semibold text-psu-text tabular-nums">
                    {item.val} <span className="font-normal text-psu-muted">({item.pctVal}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full">
                  <div className={`${item.color} h-full rounded-full transition-all duration-700`} style={{ width: `${item.pctVal}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          NEW SECTION: YEAR LEVEL × DEPARTMENT BREAKDOWN
      ═══════════════════════════════════════════════════════════════════════ */}
      {yearData?.groups?.length > 0 && (
        <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
          {/* Section header */}
          <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
            <HiOutlineAcademicCap className="h-4 w-4 text-psu-muted" />
            <h2 className="text-[13px] font-semibold text-psu-text">
              Sentiment by Year Level &amp; Department
            </h2>
          </div>

          {/* Year-level tabs */}
          {yearData.yearLevels?.length > 1 && (
            <div className="px-6 pt-4 pb-0 flex items-center gap-2 flex-wrap border-b border-psu-border">
              {yearData.yearLevels.map(yr => (
                <button
                  key={yr}
                  onClick={() => setActiveYear(yr)}
                  className={`
                    px-4 py-2 text-[12px] font-semibold rounded-t-lg border-b-2 transition-colors
                    ${activeYear === yr
                      ? 'border-psu-primary text-psu-primary bg-psu-primary/5'
                      : 'border-transparent text-psu-muted hover:text-psu-text hover:border-psu-border'
                    }
                  `}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}

          {/* Active year content */}
          <div className="p-6">
            {activeGroups.length === 0 ? (
              <p className="text-[13px] text-psu-muted text-center py-8">
                No data for {activeYear}.
              </p>
            ) : (
              <YearSection yearLevel={activeYear} groups={activeGroups} />
            )}
          </div>
        </div>
      )}

      {/* ── Department breakdown ── */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineUserGroup className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Department Breakdown</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {analysis.departmentInsights.map(dept => (
            <div key={dept.department} className="px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <p className="text-[14px] font-medium text-psu-text">{dept.department}</p>
                  <HealthBadge status={dept.status} />
                </div>
                <div className="flex items-center gap-4 text-[12px] text-psu-muted flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <HiOutlineArrowUp className="h-3 w-3 text-green-500" />
                    {dept.positiveRate}% positive
                  </span>
                  <span className="flex items-center gap-1">
                    <HiOutlineArrowDown className="h-3 w-3 text-red-400" />
                    {dept.negativeRate}% negative
                  </span>
                  <span className="tabular-nums font-semibold text-psu-text">
                    {dept.averageRating} / 5
                  </span>
                </div>
              </div>
              {dept.insights.map((insight, i) => (
                <p key={i} className="text-[13px] text-psu-muted leading-relaxed">{insight}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Faculty flags ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
            <HiOutlineExclamation className="h-4 w-4 text-amber-500" />
            <h2 className="text-[13px] font-semibold text-psu-text">Needs Attention</h2>
          </div>
          {analysis.facultyFlags.needsAttention.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] text-psu-muted">No faculty flagged for attention.</p>
            </div>
          ) : (
            <div className="divide-y divide-psu-border">
              {analysis.facultyFlags.needsAttention.map(f => (
                <div key={f.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-psu-text">{f.name}</p>
                    <p className="text-[11px] text-psu-muted mt-0.5">{f.department}</p>
                    <p className="text-[11px] text-red-500 mt-1">{f.reason}</p>
                  </div>
                  <Link
                    to={`/reports/${f.id}`}
                    className="flex items-center gap-1 text-[12px] text-psu-muted hover:text-psu-primary transition-colors flex-shrink-0"
                  >
                    View <HiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
            <HiOutlineCheckCircle className="h-4 w-4 text-green-500" />
            <h2 className="text-[13px] font-semibold text-psu-text">High Performers</h2>
          </div>
          {analysis.facultyFlags.highPerformers.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] text-psu-muted">No high performers identified yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-psu-border">
              {analysis.facultyFlags.highPerformers.map(f => (
                <div key={f.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-psu-text">{f.name}</p>
                    <p className="text-[11px] text-psu-muted mt-0.5">{f.department}</p>
                    <p className="text-[11px] text-green-600 mt-1">
                      {f.averageRating}/5 avg · {f.positiveRate}% positive
                    </p>
                  </div>
                  <Link
                    to={`/reports/${f.id}`}
                    className="flex items-center gap-1 text-[12px] text-psu-muted hover:text-psu-primary transition-colors flex-shrink-0"
                  >
                    View <HiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
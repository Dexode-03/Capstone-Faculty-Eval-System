import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiOutlineClipboardCheck,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiCheckCircle,
  HiOutlineTrash,
  HiOutlineExclamation,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import useAuth from '../hooks/useAuth';
import dashboardService from '../services/dashboardService';
import evaluationService from '../services/evaluationService';


// ── Student view ──────────────────────────────────────────────────
const StudentDashboard = ({ user }) => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await evaluationService.getEnrolledInstructors();
        setInstructors(res.data.instructors);
      } catch {
        setInstructors([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const sorted    = [...instructors].sort((a, b) => a.name.localeCompare(b.name));
  const pending   = sorted.filter(i => !i.evaluated);
  const completed = sorted.filter(i => i.evaluated);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">
          My Evaluations
        </p>
        <h1 className="text-3xl font-semibold text-psu-text tracking-tight">
          Welcome, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-[14px] text-psu-muted mt-1">
          You have{' '}
          <span className="font-semibold text-psu-primary">{pending.length}</span>
          {' '}pending evaluation{pending.length !== 1 ? 's' : ''} this semester.
        </p>
      </div>

      {/* Pending — entire row is a link */}
      {pending.length > 0 && (
        <div className="mb-8">
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-3">
            Pending
          </p>
          <div className="border border-psu-border divide-y divide-psu-border bg-white">
            {pending.map(instructor => (
              <Link
                key={instructor.id}
                to={`/evaluation?faculty=${instructor.id}`}
                className="flex items-center justify-between px-6 py-4 gap-3 hover:bg-psu-primary/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-psu-primary/10 border border-psu-border flex items-center justify-center flex-shrink-0">
                    <span className="text-[12px] font-semibold text-psu-primary">
                      {instructor.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-psu-text">{instructor.name}</p>
                    <p className="text-[12px] text-psu-muted mt-0.5">
                      {instructor.subject} · {instructor.department}
                    </p>
                  </div>
                </div>
                <HiArrowRight className="h-4 w-4 text-psu-primary flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-3">
            Completed
          </p>
          <div className="border border-psu-border divide-y divide-psu-border bg-white">
            {completed.map(instructor => (
              <div
                key={instructor.id}
                className="flex items-center justify-between px-6 py-4 opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-psu-text">{instructor.name}</p>
                    <p className="text-[12px] text-psu-muted mt-0.5">
                      {instructor.subject} · {instructor.department}
                    </p>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full">
                  Done
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All done */}
      {instructors.length > 0 && pending.length === 0 && (
        <div className="mt-6 border border-green-100 bg-green-50 rounded-xl px-6 py-5 text-center">
          <HiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-[14px] font-semibold text-green-800">All evaluations completed!</p>
          <p className="text-[13px] text-green-600 mt-1">
            Thank you for submitting your feedback this semester.
          </p>
        </div>
      )}

      {/* Empty */}
      {instructors.length === 0 && (
        <div className="border border-psu-border bg-white rounded-xl px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-psu-primary/10 flex items-center justify-center mx-auto mb-3">
            <HiOutlineClipboardCheck className="h-6 w-6 text-psu-primary" />
          </div>
          <p className="text-[14px] font-semibold text-psu-text">No instructors found</p>
          <p className="text-[13px] text-psu-muted mt-1">
            Your enrolled subjects haven't been assigned yet.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Faculty view ──────────────────────────────────────────────────
const FacultyDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardService.getFacultyDashboard();
        setData(res.data);
      } catch {
        setData({
          overallRating: 0,
          totalEvaluations: 0,
          subjects: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalBlocks   = data.subjects.reduce((acc, s) => acc + s.blocks.length, 0);
  const totalStudents = data.subjects.reduce((acc, s) => s.blocks.reduce((a, b) => a + b.students, acc), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">
          Faculty Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-psu-text tracking-tight">
          Welcome, {user?.name?.split(' ')[0]}
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Subjects', value: data.subjects.length },
          { label: 'Blocks',   value: totalBlocks          },
          { label: 'Students', value: totalStudents         },
        ].map(item => (
          <div key={item.label} className="bg-white border border-psu-border rounded-xl px-5 py-4 text-center">
            <p className="text-3xl font-bold text-psu-primary tabular-nums">{item.value}</p>
            <p className="text-[12px] text-psu-muted uppercase tracking-wider mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Evaluation score */}
      <div className="bg-white border border-psu-border rounded-xl px-6 py-5 mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Overall Evaluation Rating</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-psu-primary tabular-nums">{data.overallRating.toFixed(1)}</p>
            <p className="text-[13px] text-psu-muted mb-1">/ 5.0</p>
          </div>
          <p className="text-[12px] text-psu-muted mt-1">Based on {data.totalEvaluations} evaluation{data.totalEvaluations !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-psu-primary/10 border border-psu-border">
          <span className="text-2xl font-bold text-psu-primary tabular-nums">
            {data.overallRating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Subjects & blocks */}
      <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-3">Subjects & Blocks</p>
      <div className="space-y-4">
        {data.subjects.map(subject => (
          <div key={subject.id} className="bg-white border border-psu-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-psu-border flex items-center justify-between">
              <p className="text-[14px] font-semibold text-psu-text">{subject.name}</p>
              <span className="text-[11px] font-medium text-psu-muted bg-gray-50 border border-psu-border px-2.5 py-1 rounded-full">
                {subject.blocks.length} block{subject.blocks.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y divide-psu-border">
              {subject.blocks.map(block => (
                <div key={block.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-[13px] text-psu-text">{block.name}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-[12px] text-psu-muted">{block.students} students</p>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                      block.evaluated === block.students
                        ? 'bg-green-50 text-green-600 border-green-100'
                        : 'bg-psu-primary/5 text-psu-primary border-psu-border'
                    }`}>
                      {block.evaluated}/{block.students} evaluated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Admin view ────────────────────────────────────────────────────
const AdminDashboard = ({ user, stats, onStatsRefresh }) => {
  const total = stats.sentimentOverview.positive + stats.sentimentOverview.neutral + stats.sentimentOverview.negative;
  const pct   = v => total === 0 ? 0 : Math.round((v / total) * 100);

  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText]       = useState('');
  const [resetting, setResetting]           = useState(false);
  const [resetResult, setResetResult]       = useState(null); // { success, message }

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await evaluationService.clearAllEvaluations();
      setResetResult({ success: true, message: res.data.message });
      // Refresh parent stats
      if (onStatsRefresh) onStatsRefresh();
    } catch (err) {
      setResetResult({
        success: false,
        message: err.response?.data?.message || 'Failed to clear evaluation data.',
      });
    } finally {
      setResetting(false);
    }
  };

  const closeModal = () => {
    setShowResetModal(false);
    setConfirmText('');
    setResetResult(null);
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-psu-primary via-psu-primary to-psu-secondary p-8 md:p-10 mb-10 shadow-lg shadow-psu-primary/15">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-[12px] font-medium text-white/60 uppercase tracking-wider mb-1">
            Admin Overview
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-[14px] text-white/70 mt-2">
            Monitor evaluations and sentiment across the system.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {[
          { label: 'Students',    value: stats.totalStudents,    icon: HiOutlineAcademicCap,  accent: 'bg-psu-primary/10 text-psu-primary', corner: 'text-psu-primary/5'  },
          { label: 'Faculty',     value: stats.totalFaculty,     icon: HiOutlineUserGroup,    accent: 'bg-psu-gold/15 text-amber-600',      corner: 'text-amber-500/5'    },
          { label: 'Evaluations', value: stats.totalEvaluations, icon: HiOutlineDocumentText, accent: 'bg-emerald-50 text-emerald-600',     corner: 'text-emerald-500/5'  },
        ].map(item => (
          <div key={item.label} className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
            <item.icon className={`absolute -bottom-2 -right-2 h-20 w-20 ${item.corner}`} />
            <div className="relative z-10 flex items-start space-x-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.accent}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-4xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Sentiment Breakdown</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Positive', value: stats.sentimentOverview.positive, color: 'bg-psu-primary', badge: 'bg-psu-primary/10 text-psu-primary' },
              { label: 'Neutral',  value: stats.sentimentOverview.neutral,  color: 'bg-psu-gold',    badge: 'bg-psu-gold/15 text-amber-600'     },
              { label: 'Negative', value: stats.sentimentOverview.negative, color: 'bg-red-500',     badge: 'bg-red-50 text-red-600'            },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${item.badge}`}>
                    {item.label}
                  </span>
                  <span className="text-[13px] font-semibold text-slate-900 tabular-nums">
                    {item.value} <span className="font-normal text-slate-400">({pct(item.value)}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full">
                  <div className={`${item.color} h-full rounded-full transition-all duration-700`} style={{ width: `${pct(item.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Distribution</h2>
          </div>
          <div className="p-6">
            <div className="flex h-4 rounded-full overflow-hidden mb-8">
              <div className="bg-psu-primary transition-all duration-700" style={{ width: `${pct(stats.sentimentOverview.positive)}%` }} />
              <div className="bg-psu-gold transition-all duration-700"    style={{ width: `${pct(stats.sentimentOverview.neutral)}%`  }} />
              <div className="bg-red-500 transition-all duration-700"     style={{ width: `${pct(stats.sentimentOverview.negative)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Positive', dot: 'bg-psu-primary', val: pct(stats.sentimentOverview.positive) },
                { label: 'Neutral',  dot: 'bg-psu-gold',    val: pct(stats.sentimentOverview.neutral)  },
                { label: 'Negative', dot: 'bg-red-500',     val: pct(stats.sentimentOverview.negative) },
              ].map(item => (
                <div key={item.label} className="text-center bg-slate-50 rounded-xl py-4 px-3">
                  <div className="flex items-center justify-center space-x-1.5 mb-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{item.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{item.val}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      {stats.departments && stats.departments.length > 0 && (
        <div className="mb-10">
          <h2 className="text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-4">Department Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stats.departments.map(dept => {
              const deptTotal = dept.sentiment.positive + dept.sentiment.neutral + dept.sentiment.negative;
              const dPct = v => deptTotal === 0 ? 0 : Math.round((v / deptTotal) * 100);
              const ratingPct = Math.round((dept.avgRating / 5) * 100);
              const circumference = 2 * Math.PI * 28;
              const strokeOffset = circumference - (ratingPct / 100) * circumference;
              const ratingColor = dept.avgRating >= 4 ? '#16a34a' : dept.avgRating >= 3 ? '#d97706' : '#dc2626';

              return (
                <div key={dept.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-psu-primary/10 flex items-center justify-center flex-shrink-0">
                      <HiOutlineOfficeBuilding className="h-4.5 w-4.5 text-psu-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold text-slate-900 truncate">{dept.name}</h3>
                      <p className="text-[11px] text-slate-400">{dept.facultyCount} faculty · {dept.totalEvaluations} evaluation{dept.totalEvaluations !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-6">
                      {/* Rating Ring */}
                      <div className="relative flex-shrink-0">
                        <svg width="72" height="72" className="-rotate-90">
                          <circle cx="36" cy="36" r="28" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                          <circle
                            cx="36" cy="36" r="28" fill="none"
                            stroke={ratingColor}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeOffset}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-slate-900 tabular-nums">{dept.avgRating}</span>
                        </div>
                      </div>

                      {/* Sentiment mini bars */}
                      <div className="flex-1 space-y-2.5">
                        {[
                          { label: 'Positive', value: dept.sentiment.positive, pct: dPct(dept.sentiment.positive), color: 'bg-psu-primary', text: 'text-psu-primary' },
                          { label: 'Neutral',  value: dept.sentiment.neutral,  pct: dPct(dept.sentiment.neutral),  color: 'bg-psu-gold',    text: 'text-amber-600'  },
                          { label: 'Negative', value: dept.sentiment.negative, pct: dPct(dept.sentiment.negative), color: 'bg-red-500',     text: 'text-red-600'    },
                        ].map(s => (
                          <div key={s.label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</span>
                              <span className={`text-[11px] font-semibold tabular-nums ${s.text}`}>{s.value} <span className="font-normal text-slate-300">({s.pct}%)</span></span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full">
                              <div className={`${s.color} h-full rounded-full transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mb-10">
        <h2 className="text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Faculty', desc: 'View all members', to: '/faculty', icon: HiOutlineUserGroup, accent: 'bg-psu-primary/10 text-psu-primary group-hover:bg-psu-primary group-hover:text-white'  },
            { label: 'Reports', desc: 'View analytics',   to: '/reports', icon: HiOutlineChartBar,  accent: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'       },
          ].map(item => (
            <Link key={item.label} to={item.to} className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center space-x-4 hover:border-slate-300 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${item.accent}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-slate-900">{item.label}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <HiArrowRight className="h-4 w-4 text-slate-300 group-hover:text-psu-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h2 className="text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-4">Data Management</h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50 text-red-500">
                <HiOutlineTrash className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-900">Reset Evaluation Data</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Permanently delete all evaluations and responses. This cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              disabled={stats.totalEvaluations === 0}
              className="flex-shrink-0 bg-red-50 text-red-600 border border-red-200 rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* ── Reset confirmation modal ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!resetting ? closeModal : undefined} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Result state */}
            {resetResult ? (
              <div className="px-6 py-10 text-center">
                {resetResult.success ? (
                  <>
                    <HiCheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Data Cleared</h3>
                    <p className="text-[13px] text-slate-500 mb-6">{resetResult.message}</p>
                  </>
                ) : (
                  <>
                    <HiOutlineExclamation className="h-14 w-14 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Error</h3>
                    <p className="text-[13px] text-red-500 mb-6">{resetResult.message}</p>
                  </>
                )}
                <button
                  onClick={closeModal}
                  className="bg-psu-primary text-white rounded-lg px-6 py-2.5 text-[13px] font-semibold hover:bg-psu-secondary transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <HiOutlineExclamation className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Clear All Evaluation Data</h3>
                    <p className="text-[13px] text-slate-500 mt-1">
                      This will permanently delete <span className="font-semibold text-red-600">{stats.totalEvaluations}</span> evaluation{stats.totalEvaluations !== 1 ? 's' : ''} and all associated responses. This action cannot be undone.
                    </p>
                  </div>
                </div>

                {/* Confirm input */}
                <div className="px-6 py-4">
                  <label className="block text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Type <span className="font-bold text-red-600">RESET</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="RESET"
                    autoFocus
                    className="w-full py-2 border-0 border-b-2 border-slate-200 bg-transparent text-[14px] text-slate-900 placeholder-slate-300 focus:border-red-500 transition-colors outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={closeModal}
                    disabled={resetting}
                    className="text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={confirmText !== 'RESET' || resetting}
                    className="bg-red-600 text-white rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {resetting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      'Clear All Data'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Root Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await dashboardService.getStats();
      setStats(res.data);
    } catch {
      setStats({
        totalStudents:     0,
        totalFaculty:      0,
        totalEvaluations:  0,
        sentimentOverview: { positive: 0, neutral: 0, negative: 0 },
        departments:       [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'student') {
      setLoading(false);
      return;
    }
    fetchStats();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role === 'student') return <StudentDashboard user={user} />;
  if (user?.role === 'faculty') return <FacultyDashboard user={user} />;
  if (user?.role === 'admin')   return <AdminDashboard user={user} stats={stats} onStatsRefresh={fetchStats} />;
  return null;
};

export default Dashboard;
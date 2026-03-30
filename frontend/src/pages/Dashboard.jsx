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
        // Mock data — remove when backend is ready
        setInstructors([
          { id: 1, name: 'Dr. Maria Santos',    subject: 'Computer Programming 1', department: 'Computer Science',       evaluated: false },
          { id: 2, name: 'Prof. Juan Dela Cruz', subject: 'Data Structures',        department: 'Information Technology', evaluated: true  },
          { id: 3, name: 'Dr. Ana Reyes',        subject: 'Discrete Mathematics',   department: 'Mathematics',            evaluated: false },
          { id: 4, name: 'Prof. Carlo Mendoza',  subject: 'Physics for Engineers',  department: 'Engineering',            evaluated: false },
          { id: 5, name: 'Dr. Lisa Garcia',      subject: 'Technical Writing',      department: 'Computer Science',       evaluated: true  },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const sorted    = [...(instructors || [])].sort((a, b) => a.name.localeCompare(b.name));
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

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-3">
            Pending
          </p>
          <div className="border border-psu-border divide-y divide-psu-border bg-white">
            {pending.map(instructor => (
              <div
                key={instructor.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-3 hover:bg-gray-50 transition-colors"
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
                <Link
                  to={`/evaluation?faculty=${instructor.id}`}
                  className="flex items-center gap-1.5 bg-psu-primary text-white text-[12px] font-semibold px-4 py-2 rounded-lg hover:bg-psu-secondary transition-colors self-start sm:self-auto"
                >
                  Evaluate
                  <HiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
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
          overallRating: 4.2,
          totalEvaluations: 106,
          subjects: [
            {
              id: 1,
              name: 'Computer Programming 1',
              blocks: [
                { id: 1, name: 'BSCS 1-A', students: 35, evaluated: 28 },
                { id: 2, name: 'BSCS 1-B', students: 32, evaluated: 20 },
              ],
            },
            {
              id: 2,
              name: 'Data Structures and Algorithms',
              blocks: [
                { id: 3, name: 'BSCS 2-A', students: 30, evaluated: 15 },
              ],
            },
            {
              id: 3,
              name: 'Object Oriented Programming',
              blocks: [
                { id: 4, name: 'BSIT 2-A', students: 33, evaluated: 33 },
                { id: 5, name: 'BSIT 2-B', students: 31, evaluated: 10 },
              ],
            },
          ],
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

  const totalBlocks   = (data.subjects || []).reduce((acc, s) => acc + (s.blocks || []).length, 0);
  const totalStudents = (data.subjects || []).reduce((acc, s) => (s.blocks || []).reduce((a, b) => a + b.students, acc), 0);

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
          { label: 'Subjects',    value: data.subjects.length   },
          { label: 'Blocks',      value: totalBlocks             },
          { label: 'Students',    value: totalStudents           },
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
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <HiCheckCircle
              key={star}
              className={`h-6 w-6 ${star <= Math.round(data.overallRating) ? 'text-psu-primary' : 'text-gray-200'}`}
            />
          ))}
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

// ── Admin / Faculty view ──────────────────────────────────────────
const AdminDashboard = ({ user, stats }) => {
  const total = stats.sentimentOverview.positive + stats.sentimentOverview.neutral + stats.sentimentOverview.negative;
  const pct   = v => total === 0 ? 0 : Math.round((v / total) * 100);

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
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
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

      {/* Quick links */}
      <div>
        <h2 className="text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Faculty',  desc: 'View all members',  to: '/faculty',    icon: HiOutlineUserGroup,      accent: 'bg-psu-primary/10 text-psu-primary group-hover:bg-psu-primary group-hover:text-white'   },
            { label: 'Evaluate', desc: 'Submit feedback',   to: '/evaluation', icon: HiOutlineClipboardCheck, accent: 'bg-psu-gold/15 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'          },
            { label: 'Reports',  desc: 'View analytics',    to: '/reports',    icon: HiOutlineChartBar,       accent: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'        },
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
    </div>
  );
};

// ── Root Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student') {
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getStats();
        setStats(res.data);
      } catch {
        setStats({
          totalStudents:     150,
          totalFaculty:      25,
          totalEvaluations:  150,
          sentimentOverview: { positive: 180, neutral: 85, negative: 55 },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.role]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role === 'student') return <StudentDashboard user={user} />;
  if (user?.role === 'faculty') return <FacultyDashboard user={user} />;
  if (user?.role === 'admin') return <AdminDashboard user={user} stats={stats} />;
return null;
};

export default Dashboard;

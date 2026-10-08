import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import auditLogService from '../services/auditLogService';
import useAuth from '../hooks/useAuth';
import { HiOutlineShieldCheck, HiOutlineRefresh } from 'react-icons/hi';

export default function AuditLogs() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin' && !authLoading) {
      fetchLogs();
    }
  }, [user, authLoading, actionFilter, offset]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit, offset };
      if (actionFilter) params.action = actionFilter;
      const res = await auditLogService.getAll(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (authLoading || user?.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-psu-primary hover:underline text-sm mb-2 flex items-center gap-1 font-medium"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="w-7 h-7 text-psu-primary" />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Audit Log</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Immutable administrative activity ledger. Tracks period activations, survey questions, recommendation rules, accounts, and report views.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setOffset(0);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-psu-primary focus:border-transparent"
          >
            <option value="">All Actions</option>
            <option value="PERIOD_CREATE">PERIOD_CREATE</option>
            <option value="PERIOD_UPDATE">PERIOD_UPDATE</option>
            <option value="PERIOD_ACTIVATE">PERIOD_ACTIVATE</option>
            <option value="PERIOD_TOGGLE_EVALUATION">PERIOD_TOGGLE_EVALUATION</option>
            <option value="QUESTION_CREATE">QUESTION_CREATE</option>
            <option value="QUESTION_UPDATE">QUESTION_UPDATE</option>
            <option value="QUESTION_DEACTIVATE">QUESTION_DEACTIVATE</option>
            <option value="RULE_CREATE">RULE_CREATE</option>
            <option value="RULE_UPDATE">RULE_UPDATE</option>
            <option value="RULE_DELETE">RULE_DELETE</option>
            <option value="ACCOUNT_CREATE">ACCOUNT_CREATE</option>
            <option value="ACCOUNT_UPDATE">ACCOUNT_UPDATE</option>
            <option value="ACCOUNT_DELETE">ACCOUNT_DELETE</option>
            <option value="REPORT_ACCESS_FACULTY">REPORT_ACCESS_FACULTY</option>
            <option value="REPORT_ACCESS_SYSTEM">REPORT_ACCESS_SYSTEM</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No audit log entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actor</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Target</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{log.actor_role}</span>
                      <span className="text-slate-400 font-mono ml-1 text-[11px]">({log.actor_id})</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-semibold text-[11px] bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-mono whitespace-nowrap">
                      {log.target || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-sm">
                      {log.details ? (
                        <span className="font-mono text-[11px] bg-slate-50 p-1 rounded block truncate" title={log.details}>
                          {log.details}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Total: {total} events</span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

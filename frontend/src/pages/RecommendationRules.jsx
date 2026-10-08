import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import recommendationRuleService from '../services/recommendationRuleService';
import useAuth from '../hooks/useAuth';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSparkles } from 'react-icons/hi';

export default function RecommendationRules() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    theme: '',
    rule_type: 'weakness',
    keywords: '',
    metric: 'keyword',
    operator: 'contains',
    threshold: '',
    recommendation_text: '',
    severity: 'medium',
    is_active: 1,
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin' && !authLoading) {
      fetchRules();
    }
  }, [user, authLoading]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await recommendationRuleService.getAll();
      setRules(res.data.rules || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.theme.trim() || !formData.recommendation_text.trim()) {
      setError('Theme and recommendation text are required.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        threshold: formData.threshold !== '' ? parseFloat(formData.threshold) : null,
      };

      if (editingId) {
        await recommendationRuleService.update(editingId, payload);
        setSuccessMessage('Recommendation rule updated successfully!');
      } else {
        await recommendationRuleService.create(payload);
        setSuccessMessage('Recommendation rule created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchRules();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recommendation rule?')) return;
    try {
      setError('');
      await recommendationRuleService.delete(id);
      setSuccessMessage('Recommendation rule deleted.');
      fetchRules();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error deleting rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setFormData({
      theme: rule.theme,
      rule_type: rule.rule_type,
      keywords: rule.keywords || '',
      metric: rule.metric || 'keyword',
      operator: rule.operator || 'contains',
      threshold: rule.threshold !== null && rule.threshold !== undefined ? rule.threshold : '',
      recommendation_text: rule.recommendation_text,
      severity: rule.severity || 'medium',
      is_active: rule.is_active ? 1 : 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      theme: '',
      rule_type: 'weakness',
      keywords: '',
      metric: 'keyword',
      operator: 'contains',
      threshold: '',
      recommendation_text: '',
      severity: 'medium',
      is_active: 1,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
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
            <HiOutlineSparkles className="w-7 h-7 text-psu-gold" />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Prescriptive Recommendation Rules</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage dynamic AI recommendation rules. Changes here update generated faculty feedback without requiring redeployment.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-psu-primary text-white rounded-lg hover:bg-psu-primary/90 text-sm font-semibold shadow-sm transition"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Rule
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 max-w-3xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? `Edit Rule #${editingId}` : 'New Recommendation Rule'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Theme *
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                  placeholder="e.g. Clarity, Pacing, Supportiveness"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Rule Type *
                </label>
                <select
                  value={formData.rule_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, rule_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                >
                  <option value="weakness">Weakness (Keyword-triggered)</option>
                  <option value="strength">Strength (Keyword-triggered)</option>
                  <option value="rating">Rating (Threshold-triggered)</option>
                  <option value="sentiment">Sentiment (Percent-triggered)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Severity / Sentiment
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="positive">Positive Recognition</option>
                </select>
              </div>
            </div>

            {(formData.rule_type === 'weakness' || formData.rule_type === 'strength') && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Keywords (Comma-separated, English & Filipino)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="e.g. unclear, confusing, labo, malabo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                />
              </div>
            )}

            {(formData.rule_type === 'rating' || formData.rule_type === 'sentiment') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Metric
                  </label>
                  <select
                    value={formData.metric}
                    onChange={(e) => setFormData(prev => ({ ...prev, metric: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                  >
                    <option value="rating">Overall Average Rating</option>
                    <option value="sentiment_negative_pct">Negative Sentiment Percentage</option>
                    <option value="sentiment_positive_pct">Positive Sentiment Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Operator
                  </label>
                  <select
                    value={formData.operator}
                    onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                  >
                    <option value="<">&lt; Less than</option>
                    <option value="<=">&le; Less than or equal</option>
                    <option value=">">&gt; Greater than</option>
                    <option value=">=">&ge; Greater than or equal</option>
                    <option value="=">= Exactly equal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Threshold Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                    placeholder="e.g. 3.5 or 40"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Prescriptive Recommendation Text *
              </label>
              <textarea
                rows={3}
                value={formData.recommendation_text}
                onChange={(e) => setFormData(prev => ({ ...prev, recommendation_text: e.target.value }))}
                placeholder="Prescriptive guidance for the faculty member..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Use placeholders like {'{rating}'}, {'{negative_pct}'}, or {'{positive_pct}'} for dynamic metrics.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-psu-primary text-white rounded-lg hover:bg-psu-primary/90 disabled:opacity-50 text-sm font-semibold transition"
              >
                {loading ? 'Saving...' : editingId ? 'Update Rule' : 'Save Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && !showForm ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading recommendation rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No recommendation rules found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Theme / Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Condition / Keywords</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Recommendation</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Severity</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-xs">
                      <p className="font-semibold text-slate-900">{r.theme}</p>
                      <span className="inline-block mt-0.5 text-[11px] font-mono uppercase text-slate-500">{r.rule_type}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 max-w-xs">
                      {r.keywords ? (
                        <p className="truncate font-mono text-[11px] bg-slate-100 px-2 py-1 rounded">{r.keywords}</p>
                      ) : (
                        <span className="font-mono text-slate-700">{r.metric} {r.operator} {r.threshold}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-800 max-w-md font-medium">{r.recommendation_text}</td>
                    <td className="px-5 py-4 text-xs">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        r.severity === 'high' ? 'bg-red-50 text-red-700' :
                        r.severity === 'medium' ? 'bg-amber-50 text-amber-700' :
                        r.severity === 'positive' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition"
                        >
                          <HiOutlinePencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

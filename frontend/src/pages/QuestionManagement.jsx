import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import evaluationQuestionService from '../services/evaluationQuestionService';
import useAuth from '../hooks/useAuth';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineCheckCircle, HiOutlineBan } from 'react-icons/hi';

export default function QuestionManagement() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category: 'A. Management of Teaching and Learning',
    question_type: 'rating',
    category_description: '',
    question: '',
    sort_order: 0,
    is_active: 1,
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin' && !authLoading) {
      fetchQuestions();
    }
  }, [user, authLoading]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await evaluationQuestionService.getAllForAdmin();
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.question.trim()) {
      setError('Question text is required.');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await evaluationQuestionService.update(editingId, formData);
        setSuccessMessage('Question updated successfully!');
      } else {
        await evaluationQuestionService.create(formData);
        setSuccessMessage('Question created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        category: 'A. Management of Teaching and Learning',
        question_type: 'rating',
        category_description: '',
        question: '',
        sort_order: questions.length + 1,
        is_active: 1,
      });
      fetchQuestions();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this question? Historical responses will be preserved, but students will no longer see it.')) return;
    try {
      setError('');
      await evaluationQuestionService.deactivate(id);
      setSuccessMessage('Question deactivated.');
      fetchQuestions();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error deactivating question');
    }
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setFormData({
      category: q.category,
      question_type: q.question_type,
      category_description: q.category_description || '',
      question: q.question,
      sort_order: q.sort_order,
      is_active: q.is_active ? 1 : 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      category: 'A. Management of Teaching and Learning',
      question_type: 'rating',
      category_description: '',
      question: '',
      sort_order: questions.length + 1,
      is_active: 1,
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Question Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure evaluation survey criteria. Questions with existing responses cannot have their text altered to protect historical integrity.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData(prev => ({ ...prev, sort_order: questions.length + 1 }));
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-psu-primary text-white rounded-lg hover:bg-psu-primary/90 text-sm font-semibold shadow-sm transition"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Question
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
            {editingId ? `Edit Question #${editingId}` : 'New Evaluation Question'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                >
                  <option value="A. Management of Teaching and Learning">A. Management of Teaching and Learning</option>
                  <option value="B. Content Knowledge, Pedagogy and Technology">B. Content Knowledge, Pedagogy and Technology</option>
                  <option value="C. Commitment and Transparency">C. Commitment and Transparency</option>
                  <option value="Open-ended">Open-ended</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Question Type *
                </label>
                <select
                  value={formData.question_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, question_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                >
                  <option value="rating">Rating (1-5 Likert scale)</option>
                  <option value="text">Text (Open-ended comments)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Question Text *
              </label>
              <textarea
                rows={3}
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="e.g. Explains topics clearly and relates them to real-world applications."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: parseInt(e.target.value, 10) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-psu-primary focus:border-transparent"
                >
                  <option value={1}>Active (Visible to Students)</option>
                  <option value={0}>Inactive (Hidden)</option>
                </select>
              </div>
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
                {loading ? 'Saving...' : editingId ? 'Update Question' : 'Save Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && !showForm ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No evaluation questions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Order</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Question</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr key={q.id} className={`hover:bg-slate-50/70 transition-colors ${!q.is_active ? 'bg-slate-50/40 text-slate-400' : ''}`}>
                    <td className="px-5 py-4 text-xs font-mono font-semibold text-slate-500">{q.sort_order}</td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-700 max-w-[200px] truncate">{q.category}</td>
                    <td className="px-5 py-4 text-sm text-slate-900 font-medium max-w-md">{q.question}</td>
                    <td className="px-5 py-4 text-xs">
                      <span className={`inline-flex px-2 py-0.5 rounded font-mono uppercase text-[11px] font-semibold ${
                        q.question_type === 'rating' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {q.question_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {q.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <HiOutlineCheckCircle className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                          <HiOutlineBan className="w-4 h-4" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition"
                        >
                          <HiOutlinePencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        {q.is_active ? (
                          <button
                            onClick={() => handleDeactivate(q.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition"
                          >
                            <HiOutlineBan className="w-3.5 h-3.5" /> Deactivate
                          </button>
                        ) : null}
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

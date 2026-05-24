import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import academicPeriodService from '../services/academicPeriodService';
import useAuth from '../hooks/useAuth';

export default function AcademicPeriods() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    academic_year: '',
    semester: '1st',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin' && !authLoading) {
      fetchPeriods();
    }
  }, [user, authLoading]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const result = await academicPeriodService.getAll();
      setPeriods(result.data.periods || []);
    } catch (err) {
      setError(err.message || 'Error fetching academic periods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.academic_year.trim()) {
      setError('Academic year is required (e.g., 2025-2026)');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await academicPeriodService.update(editingId, formData);
        setSuccessMessage('Academic period updated successfully!');
      } else {
        await academicPeriodService.create(formData);
        setSuccessMessage('Academic period created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ academic_year: '', semester: '1st', start_date: '', end_date: '' });
      fetchPeriods();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Error saving academic period');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      setError('');
      await academicPeriodService.activate(id);
      setSuccessMessage('Academic period activated!');
      fetchPeriods();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Error activating period');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this academic period?')) return;
    try {
      setError('');
      await academicPeriodService.remove(id);
      setSuccessMessage('Academic period deleted.');
      fetchPeriods();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Error deleting period');
    }
  };

  const handleEdit = (period) => {
    setEditingId(period.id);
    setFormData({
      academic_year: period.academic_year,
      semester: period.semester,
      start_date: period.start_date ? period.start_date.split('T')[0] : '',
      end_date: period.end_date ? period.end_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ academic_year: '', semester: '1st', start_date: '', end_date: '' });
  };

  if (authLoading) return null;
  if (user?.role !== 'admin') return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-900 mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Academic Periods</h1>
        <p className="text-gray-600">Manage semesters and set the active evaluation period</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + Add Academic Period
        </button>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Academic Period' : 'New Academic Period'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                  placeholder="e.g., 2025-2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Periods List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && !showForm ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : periods.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No academic periods yet. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Academic Year</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Semester</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periods.map((period) => (
                  <tr key={period.id} className={`hover:bg-gray-50 ${period.is_active ? 'bg-green-50/50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{period.academic_year}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{period.semester} Semester</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {period.start_date && period.end_date
                        ? `${new Date(period.start_date).toLocaleDateString()} — ${new Date(period.end_date).toLocaleDateString()}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {period.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ● Active
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!period.is_active && (
                          <button
                            onClick={() => handleActivate(period.id)}
                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(period)}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Edit
                        </button>
                        {!period.is_active && (
                          <button
                            onClick={() => handleDelete(period.id)}
                            className="text-red-600 hover:text-red-900 font-medium text-sm"
                          >
                            Delete
                          </button>
                        )}
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

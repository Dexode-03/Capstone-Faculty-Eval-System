import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import useAuth from '../hooks/useAuth';

export default function AdminAccounts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [role, setRole] = useState(searchParams.get('role') || 'faculty');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filter state
  const [department, setDepartment] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [section, setSection] = useState('');
  const [search, setSearch] = useState('');

  // Available filter options (from DB)
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    yearLevels: [],
    sections: [],
  });

  // Check if user is admin (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Reset filters when role changes
  useEffect(() => {
    setDepartment('');
    setYearLevel('');
    setSection('');
    setSearch('');
  }, [role]);

  // Fetch accounts when role or filters change
  const fetchAccounts = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        navigate('/login');
        return;
      }

      const filters = {};
      if (department) filters.department = department;
      if (yearLevel) filters.year_level = yearLevel;
      if (section) filters.section = section;
      if (search) filters.search = search;

      const result = await authService.getAllAccounts(role, filters);
      setAccounts(result.data.data || []);
      if (result.data.filters) {
        setFilterOptions(result.data.filters);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err.message || 'Error fetching accounts');
    } finally {
      setLoading(false);
    }
  }, [role, department, yearLevel, section, search, user, navigate]);

  useEffect(() => {
    if (user?.role === 'admin' && !authLoading) {
      fetchAccounts();
    }
  }, [fetchAccounts, user, authLoading]);

  // Sync role to URL
  useEffect(() => {
    setSearchParams({ role });
  }, [role, setSearchParams]);

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError('');
      await authService.deleteAccount(id, role);
      setSuccessMessage(`${role.charAt(0).toUpperCase() + role.slice(1)} account deleted successfully!`);
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAccounts();
    } catch (err) {
      setError(err.message || 'Error deleting account');
      console.error('Error deleting account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/accounts/edit/${id}?role=${role}`);
  };

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Show nothing while auth is loading
  if (authLoading) {
    return null;
  }

  // Prevent non-admin from seeing this page
  if (user?.role !== 'admin') {
    return null;
  }

  const activeFilterCount = [department, yearLevel, section, search].filter(Boolean).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Management</h1>
        <p className="text-gray-600">View, create, edit, and delete accounts</p>
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

      {/* Filter Bar */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Role */}
          <div className="min-w-[140px]">
            <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="faculty">Faculty</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Department (faculty + student) */}
          {(role === 'faculty' || role === 'student') && (
            <div className="min-w-[180px]">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {filterOptions.departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Year Level (student only) */}
          {role === 'student' && (
            <div className="min-w-[140px]">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Year Level</label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Year Levels</option>
                {filterOptions.yearLevels.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Section (student only) */}
          {role === 'student' && (
            <div className="min-w-[120px]">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sections</option>
                {filterOptions.sections.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Create Account */}
          <button
            onClick={() => navigate('/admin/accounts/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
          >
            + Create Account
          </button>
        </div>

        {/* Active filter count + clear */}
        {activeFilterCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <span className="text-[12px] text-gray-500">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-[12px] text-gray-500">{accounts.length} result{accounts.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => { setDepartment(''); setYearLevel(''); setSection(''); setSearch(''); setSearchInput(''); }}
              className="text-[12px] text-blue-600 hover:text-blue-800 font-medium ml-auto"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {activeFilterCount > 0 ? 'No accounts match the current filters' : 'No accounts found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  {(role === 'faculty' || role === 'student') && (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subjects</th>
                    </>
                  )}
                  {role === 'student' && (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Year Level</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Section</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{account.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500">{account.email}</p>
                      </div>
                    </td>
                    {(role === 'faculty' || role === 'student') && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-600">{account.department || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{account.subject_names || '-'}</td>
                      </>
                    )}
                    {role === 'student' && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-600">{account.year_level || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{account.section || '-'}</td>
                      </>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(account.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Edit
                        </button>
                        {role !== 'admin' && (
                          <button
                            onClick={() => setDeleteConfirm(account.id)}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this account? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

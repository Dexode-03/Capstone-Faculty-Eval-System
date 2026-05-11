import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import useAuth from '../hooks/useAuth';

export default function AdminAccounts() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [role, setRole] = useState('faculty');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Check if user is admin (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Fetch accounts when role changes
  useEffect(() => {
    if (user?.role === 'admin' && !authLoading) {
      console.log('Fetching accounts, user:', user, 'token exists:', !!localStorage.getItem('token'));
      fetchAccounts();
    }
  }, [role, user, authLoading]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Ensure token exists
      const token = localStorage.getItem('token');
      console.log('📋 Fetching accounts...');
      console.log('   Token exists:', !!token);
      console.log('   Token length:', token ? token.length : 0);
      console.log('   User:', user);
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        navigate('/login');
        return;
      }
      
      const result = await authService.getAllAccounts(role);
      console.log('✅ Accounts fetched successfully:', result);
      setAccounts(result.data.data || []);
    } catch (err) {
      console.error('❌ Error fetching accounts:', err);
      setError(err.message || 'Error fetching accounts');
    } finally {
      setLoading(false);
    }
  };

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

  // Show nothing while auth is loading
  if (authLoading) {
    return null;
  }

  // Prevent non-admin from seeing this page
  if (user?.role !== 'admin') {
    return null;
  }

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

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="faculty">Faculty</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <button
          onClick={() => navigate('/admin/accounts/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create Account
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No accounts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  {role === 'faculty' && (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                    </>
                  )}
                  {role === 'student' && (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Year</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Section</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verified</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{account.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{account.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{account.email}</td>
                    {role === 'faculty' && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-600">{account.department || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{account.subject_code || '-'}</td>
                      </>
                    )}
                    {role === 'student' && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-600">{account.year_level || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{account.section || '-'}</td>
                      </>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          account.email_verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {account.email_verified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(account.created_at).toLocaleDateString()}
                    </td>
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

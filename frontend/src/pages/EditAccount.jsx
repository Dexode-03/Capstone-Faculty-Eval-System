import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import subjectService from '../services/subjectService';
import academicPeriodService from '../services/academicPeriodService';
import useAuth from '../hooks/useAuth';

export default function EditAccount() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'faculty';
  
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    subject_ids: [],
    year_level: '',
    section: '',
  });
  // Enriched faculty subject assignments: { [subject_id]: { section, year_level, semester } }
  const [subjectAssignments, setSubjectAssignments] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [allAssignments, setAllAssignments] = useState([]);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Fetch account data
  useEffect(() => {
    if (user?.role === 'admin' && !authLoading) {
      fetchAccount();
      fetchSubjects();
    }
  }, [user, authLoading, id, role]);

  const fetchSubjects = async () => {
    try {
      let activeSem = null;
      try {
        const activeRes = await academicPeriodService.getActive();
        const activePeriod = activeRes.data.active || activeRes.data.data || activeRes.data;
        if (activePeriod && activePeriod.semester) {
          activeSem = activePeriod.semester;
          setActiveSemester(activeSem);
        }
      } catch (err) {
        console.error('Error fetching active academic period:', err);
      }

      const res = await subjectService.getAll();
      const allSubjects = res.data.subjects || res.data || [];

      if (activeSem) {
        const filtered = allSubjects.filter(
          (s) => s.semester === 'both' || s.semester === activeSem
        );
        setSubjects(filtered);
      } else {
        setSubjects(allSubjects);
      }

      // Fetch all current faculty assignments
      try {
        const assignRes = await authService.getAllFacultyAssignments();
        const assignments = assignRes.data.assignments || [];
        setAllAssignments(assignments);
      } catch (err) {
        console.error('Error fetching all faculty assignments:', err);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchAccount = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await authService.getAccountById(id, role);
      const account = result.data.data || result.data.user || result.data;
      
      // Parse subject_ids from comma-separated string (from GROUP_CONCAT)
      const parsedSubjectIds = account.subject_ids
        ? account.subject_ids.split(',').map(Number)
        : [];

      setFormData({
        name: account.name || '',
        email: account.email || '',
        department: account.department || '',
        subject_ids: parsedSubjectIds,
        year_level: account.year_level || '',
        section: account.section || '',
      });

      // If faculty, fetch enriched subject assignments
      if (role === 'faculty') {
        try {
          const assignRes = await authService.getFacultyAssignments(id);
          const assignments = assignRes.data.assignments || [];
          const assignMap = {};
          assignments.forEach(a => {
            if (!assignMap[a.subject_id]) {
              assignMap[a.subject_id] = {
                sections: [],
                year_level: a.year_level || '',
                semester: a.semester || 'both',
              };
            }
            if (a.section) {
              assignMap[a.subject_id].sections.push(a.section);
            }
          });
          setSubjectAssignments(assignMap);
        } catch {
          // Fallback: initialize empty assignments for each subject
          const assignMap = {};
          parsedSubjectIds.forEach(sid => {
            assignMap[sid] = { sections: [], year_level: '', semester: 'both' };
          });
          setSubjectAssignments(assignMap);
        }
      }
    } catch (err) {
      setError(err.message || 'Error fetching account');
      console.error('Error fetching account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle faculty subject assignment detail changes
  const handleAssignmentChange = (subjectId, field, value) => {
    setSubjectAssignments(prev => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || { sections: [], year_level: '', semester: 'both' }),
        [field]: value,
      },
    }));
  };

  // Handle subject checkbox toggle for faculty
  const handleFacultySubjectToggle = (subjectId, checked) => {
    setFormData(prev => ({
      ...prev,
      subject_ids: checked
        ? [...prev.subject_ids, subjectId]
        : prev.subject_ids.filter(id => id !== subjectId),
    }));
    if (checked) {
      // Initialize assignment details
      setSubjectAssignments(prev => ({
        ...prev,
        [subjectId]: prev[subjectId] || { sections: [], year_level: '', semester: 'both' },
      }));
    } else {
      // Remove assignment details
      setSubjectAssignments(prev => {
        const copy = { ...prev };
        delete copy[subjectId];
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      setLoading(true);

      if (!formData.name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }

      // Prepare submission data (only allowed fields)
      const submitData = {};
      
      if (formData.name) submitData.name = formData.name.trim();
      if (formData.email) submitData.email = formData.email.trim();
      
      if (role === 'faculty') {
        // Enforce duplicate validation on submission, ignoring assignments of the current faculty
        const finalAssignments = [];
        for (const sid of formData.subject_ids) {
          const matchingSubject = subjects.find(sub => sub.id === sid);
          const sections = subjectAssignments[sid]?.sections || [];
          
          if (sections.length === 0) {
            // Default to "All Sections" (section: null)
            const conflict = allAssignments.find(
              (a) => a.subject_id === sid && !a.section && a.faculty_id !== parseInt(id)
            );
            if (conflict) {
              setError(`Subject "${matchingSubject?.code || ''}" (All Sections) is already assigned to ${conflict.faculty_name}.`);
              setLoading(false);
              return;
            }
            finalAssignments.push({
              subject_id: sid,
              section: null,
              year_level: matchingSubject?.year_level || null,
              semester: matchingSubject?.semester || 'both',
            });
          } else {
            for (const sec of sections) {
              const conflict = allAssignments.find(
                (a) => a.subject_id === sid && a.section?.toLowerCase() === sec.toLowerCase() && a.faculty_id !== parseInt(id)
              );
              if (conflict) {
                setError(`Section "${sec}" for subject "${matchingSubject?.code || ''}" is already assigned to ${conflict.faculty_name}.`);
                setLoading(false);
                return;
              }
              finalAssignments.push({
                subject_id: sid,
                section: sec,
                year_level: matchingSubject?.year_level || null,
                semester: matchingSubject?.semester || 'both',
              });
            }
          }
        }

        if (formData.department) submitData.department = formData.department.trim();
        submitData.subject_assignments = finalAssignments;
      }

      if (role === 'student') {
        if (formData.year_level) submitData.year_level = formData.year_level;
        if (formData.section) submitData.section = formData.section.trim();
        if (formData.department) submitData.department = formData.department.trim();
        submitData.subject_ids = formData.subject_ids;
      }

      // Update account
      await authService.updateAccount(id, role, submitData);
      setSuccessMessage('Account updated successfully!');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/admin/accounts?role=${role}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error updating account');
      console.error('Error updating account:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get faculty assigned to a specific section of a subject (excluding current faculty)
  const getAssignedFaculty = (subjectId, sec) => {
    if (!sec) return null;
    const match = allAssignments.find(
      (a) => a.subject_id === subjectId && a.section?.toLowerCase() === sec.toLowerCase() && a.faculty_id !== parseInt(id)
    );
    return match ? match.faculty_name : null;
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
        <button
          onClick={() => navigate(`/admin/accounts?role=${role}`)}
          className="text-blue-600 hover:text-blue-900 mb-4 flex items-center gap-1"
        >
          ← Back to Accounts
        </button>
        <h1 className="text-4xl font-bold text-gray-900">Edit Account</h1>
        <p className="text-gray-600 mt-2">Update account information</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
        {loading ? (
          <div className="text-center text-gray-500">Loading account details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Role-specific fields */}
            {role === 'faculty' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {role === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Year Level
                    </label>
                    <select
                      name="year_level"
                      value={formData.year_level}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Year Level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Section
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      placeholder="e.g., A"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* ── Subjects (Faculty: enriched with section/year_level/semester) ── */}
            {role === 'faculty' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Subject Assignments
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Check subjects and specify section, year level, and semester for each.
                  Leave section empty for "All Sections".
                </p>
                <div className="border border-gray-300 rounded-lg overflow-hidden divide-y divide-gray-200">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-gray-400 p-3">No subjects available</p>
                  ) : (
                    subjects.map((s) => {
                      const isChecked = formData.subject_ids.includes(s.id);
                      const assign = subjectAssignments[s.id] || { section: '', year_level: '', semester: 'both' };
                      return (
                        <div key={s.id} className="bg-white">
                          {/* Subject checkbox row */}
                          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleFacultySubjectToggle(s.id, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{s.code} — {s.name}</span>
                          </label>
                          {/* Expanded assignment details (only when checked) */}
                          {isChecked && (
                            <div className="px-4 pb-4 pt-1 ml-7 bg-blue-50/50 border-t border-gray-100">
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    Sections
                                  </label>
                                  <div className="grid grid-cols-2 gap-2 bg-white p-3 border border-gray-200 rounded-md">
                                    {['A', 'B', 'C', 'D'].map(sec => {
                                      const isSecChecked = (assign.sections || []).includes(sec);
                                      const assignedTo = getAssignedFaculty(s.id, sec);
                                      return (
                                        <label key={sec} className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-gray-50 ${assignedTo ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}`}>
                                          <input
                                            type="checkbox"
                                            checked={isSecChecked}
                                            disabled={!!assignedTo}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              setSubjectAssignments(prev => {
                                                const currentSections = prev[s.id]?.sections || [];
                                                const newSections = checked
                                                  ? [...currentSections, sec]
                                                  : currentSections.filter(x => x !== sec);
                                                return {
                                                  ...prev,
                                                  [s.id]: {
                                                    ...(prev[s.id] || { sections: [], year_level: '', semester: 'both' }),
                                                    sections: newSections
                                                  }
                                                };
                                              });
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <span className="font-medium">
                                            Section {sec} {assignedTo ? `(Taken by ${assignedTo})` : ''}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-1">If no sections are checked, this defaults to "All Sections".</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Subjects (Student: simple checkboxes) */}
            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Subjects
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-gray-400">No subjects available</p>
                  ) : (
                    subjects.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.subject_ids.includes(s.id)}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              subject_ids: e.target.checked
                                ? [...prev.subject_ids, s.id]
                                : prev.subject_ids.filter((id) => id !== s.id),
                            }));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{s.code} — {s.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select one or more subjects</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/admin/accounts?role=${role}`)}
                className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Updating...' : 'Update Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

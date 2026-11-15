import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineAcademicCap,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineIdentification,
  HiOutlineBookOpen,
} from 'react-icons/hi';
import authService from '../services/authService';
import subjectService from '../services/subjectService';
import academicPeriodService from '../services/academicPeriodService';
import useAuth from '../hooks/useAuth';

const SUFFIX_OPTIONS = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

export default function CreateAccount() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const departmentOptions = [
    'Computer Science',
    'Information Technology',
    'Engineering',
    'Education',
    'Business Administration',
  ];

  // Formalized Name Parts
  const [nameData, setNameData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
  });

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'faculty',
    department: '',
    subject_ids: [],
    year_level: '',
    section: '',
  });

  // Enriched faculty subject assignments: { [subject_id]: { sections: [], year_level, semester } }
  const [subjectAssignments, setSubjectAssignments] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [allAssignments, setAllAssignments] = useState([]);

  // Check if user is admin (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Fetch subjects list and active academic period
  useEffect(() => {
    const fetchSubjectsAndActivePeriod = async () => {
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
    if (user?.role === 'admin') fetchSubjectsAndActivePeriod();
  }, [user]);

  const subjectMatchesActiveSemester = (subject) =>
    !activeSemester || subject.semester === 'both' || subject.semester === activeSemester;

  const subjectMatchesStudentFilters = (subject, data = formData) => {
    const selectedDepartment = (data.department || '').trim().toLowerCase();
    const subjectDepartment = (subject?.department || '').trim().toLowerCase();

    return Boolean(
      subject &&
      selectedDepartment &&
      subjectDepartment === selectedDepartment &&
      subject.year_level === data.year_level &&
      subjectMatchesActiveSemester(subject)
    );
  };

  const subjectMatchesFacultyFilters = (subject, data = formData) => {
    const selectedDepartment = (data.department || '').trim().toLowerCase();
    const subjectDepartment = (subject?.department || '').trim().toLowerCase();

    return Boolean(
      subject &&
      selectedDepartment &&
      subjectDepartment === selectedDepartment &&
      subjectMatchesActiveSemester(subject)
    );
  };

  const availableFacultySubjects = formData.role === 'faculty'
    ? subjects.filter((subject) => subjectMatchesFacultyFilters(subject))
    : [];

  const availableStudentSubjects = formData.role === 'student'
    ? subjects.filter((subject) => subjectMatchesStudentFilters(subject))
    : [];

  // Computed Full Name for preview and submission
  const computeFullName = () => {
    const parts = [
      nameData.firstName.trim(),
      nameData.middleName.trim(),
      nameData.lastName.trim(),
    ].filter(Boolean);

    let fullName = parts.join(' ');
    if (nameData.suffix.trim()) {
      fullName = `${fullName} ${nameData.suffix.trim()}`;
    }
    return fullName.trim();
  };

  // Show nothing while auth is loading
  if (authLoading) {
    return null;
  }

  // Prevent non-admin from seeing this page
  if (user?.role !== 'admin') {
    return null;
  }

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    setNameData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextData = {
      ...formData,
      [name]: value,
    };

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      if ((name === 'year_level' || name === 'department' || name === 'role') && updated.role === 'student') {
        const filteredSids = prev.subject_ids.filter((sid) => {
          const s = subjects.find((sub) => sub.id === sid);
          return subjectMatchesStudentFilters(s, updated);
        });
        updated.subject_ids = filteredSids;
      }
      if ((name === 'department' || name === 'role') && updated.role === 'faculty') {
        updated.subject_ids = prev.subject_ids.filter((sid) => {
          const s = subjects.find((sub) => sub.id === sid);
          return subjectMatchesFacultyFilters(s, updated);
        });
      }
      return updated;
    });

    if (name === 'department' || name === 'role') {
      setSubjectAssignments((prev) => {
        if (nextData.role !== 'faculty') {
          return {};
        }

        const copy = {};
        Object.entries(prev).forEach(([subjectId, assignment]) => {
          const subject = subjects.find((sub) => String(sub.id) === String(subjectId));
          if (subjectMatchesFacultyFilters(subject, nextData)) {
            copy[subjectId] = assignment;
          }
        });

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

      // Name Validation
      if (!nameData.firstName.trim()) {
        setError('First name is required');
        setLoading(false);
        return;
      }

      if (!nameData.lastName.trim()) {
        setError('Last name is required');
        setLoading(false);
        return;
      }

      const formattedFullName = computeFullName();

      // Email Validation
      if (!formData.email.trim()) {
        setError('PSU institutional email is required');
        setLoading(false);
        return;
      }

      if (!formData.email.endsWith('@psu.edu.ph')) {
        setError('Only official PSU email addresses (@psu.edu.ph) are permitted');
        setLoading(false);
        return;
      }

      // Password Validation
      if (!formData.password) {
        setError('Password is required');
        setLoading(false);
        return;
      }

      if (
        formData.password.length < 8 ||
        !/[a-zA-Z]/.test(formData.password) ||
        !/[0-9]/.test(formData.password)
      ) {
        setError('Password must be at least 8 characters and contain both letters and numbers');
        setLoading(false);
        return;
      }

      // Confirm Password Check
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match. Please re-enter confirmation password.');
        setLoading(false);
        return;
      }

      // Role-specific validations
      if (formData.role === 'student') {
        if (!formData.department) {
          setError('Department is required for student accounts');
          setLoading(false);
          return;
        }
        if (!formData.year_level) {
          setError('Year level is required for student accounts');
          setLoading(false);
          return;
        }
        if (!formData.section) {
          setError('Section is required for student accounts');
          setLoading(false);
          return;
        }
      }

      // Prepare submission data
      const submitData = {
        name: formattedFullName,
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'faculty') {
        const finalAssignments = [];
        const validFacultySubjectIds = formData.subject_ids.filter((sid) => {
          const subject = subjects.find((sub) => sub.id === sid);
          return subjectMatchesFacultyFilters(subject);
        });

        for (const sid of validFacultySubjectIds) {
          const matchingSubject = subjects.find((sub) => sub.id === sid);
          const sections = subjectAssignments[sid]?.sections || [];

          if (sections.length === 0) {
            const conflict = allAssignments.find(
              (a) => a.subject_id === sid && !a.section
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
                (a) => a.subject_id === sid && a.section?.toLowerCase() === sec.toLowerCase()
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

      if (formData.role === 'student') {
        if (formData.year_level) submitData.year_level = formData.year_level;
        if (formData.section) submitData.section = formData.section.trim();
        if (formData.department) submitData.department = formData.department.trim();
        const validSubjectIds = formData.subject_ids.filter((sid) => {
          const subject = subjects.find((sub) => String(sub.id) === String(sid));
          return subjectMatchesStudentFilters(subject);
        });

        if (validSubjectIds.length > 0) {
          submitData.subject_ids = validSubjectIds;
        }
      }

      // Create account
      await authService.createAccount(submitData);
      setSuccessMessage(
        `${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} account for "${formattedFullName}" was created successfully!`
      );

      // Reset form
      setNameData({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
      });
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'faculty',
        department: '',
        subject_ids: [],
        year_level: '',
        section: '',
      });
      setSubjectAssignments({});

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/admin/accounts?role=${formData.role}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error creating account');
      console.error('Error creating account:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get faculty assigned to a specific section of a subject
  const getAssignedFaculty = (subjectId, sec) => {
    if (!sec) return null;
    const match = allAssignments.find(
      (a) => a.subject_id === subjectId && a.section?.toLowerCase() === sec.toLowerCase()
    );
    return match ? match.faculty_name : null;
  };

  const previewFullName = computeFullName();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-psu-border pb-5">
        <div>
          <button
            onClick={() => navigate('/admin/accounts')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-psu-primary hover:text-psu-secondary transition-colors mb-2 uppercase tracking-wider"
          >
            <HiOutlineArrowLeft className="w-3.5 h-3.5" />
            Back to Accounts Directory
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-psu-text tracking-tight flex items-center gap-2">
            <HiOutlineIdentification className="w-8 h-8 text-psu-primary" />
            Create Institutional Account
          </h1>
          <p className="text-xs sm:text-sm text-psu-muted mt-1">
            Register new faculty or student profiles with official institutional credentials and curriculum mapping.
          </p>
        </div>

        {/* Role Pill Display */}
        <div className="self-start sm:self-auto bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-psu-primary animate-pulse" />
          <div>
            <p className="text-[10px] uppercase font-semibold text-psu-muted">Target Account Type</p>
            <p className="text-xs font-bold text-psu-primary uppercase tracking-wide">
              {formData.role === 'faculty' ? 'Faculty Member' : 'Student'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm animate-fadeIn">
          <HiOutlineExclamationCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-red-800">
            <p className="font-semibold">Unable to register account</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 shadow-sm animate-fadeIn">
          <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-emerald-800">
            <p className="font-semibold">Registration Successful</p>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* CARD 1: Profile & Identity Information */}
        <div className="bg-white rounded-2xl border border-psu-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-psu-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100/70 rounded-lg text-psu-primary">
                <HiOutlineUser className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-psu-text tracking-wide uppercase">1. Personal Profile & Identity</h2>
                <p className="text-[11px] text-psu-muted">Formal full name details as recorded on official university documents</p>
              </div>
            </div>
            {previewFullName && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <HiOutlineCheckCircle className="w-4 h-4" />
                Preview: {previewFullName}
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Split Name Grid: First, Middle, Last, Suffix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
              {/* First Name */}
              <div className="lg:col-span-4">
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={nameData.firstName}
                  onChange={handleNameChange}
                  placeholder="e.g. Juan"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                  required
                />
              </div>

              {/* Middle Name */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  Middle Name <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={nameData.middleName}
                  onChange={handleNameChange}
                  placeholder="e.g. Santos"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                />
              </div>

              {/* Last Name */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={nameData.lastName}
                  onChange={handleNameChange}
                  placeholder="e.g. Dela Cruz"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                  required
                />
              </div>

              {/* Suffix */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  Suffix
                </label>
                <select
                  name="suffix"
                  value={nameData.suffix}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                >
                  <option value="">None</option>
                  {SUFFIX_OPTIONS.filter(Boolean).map((sfx) => (
                    <option key={sfx} value={sfx}>{sfx}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email & Account Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  Official PSU Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <HiOutlineMail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user.name@psu.edu.ph"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                    required
                  />
                </div>
                <p className="text-[11px] text-psu-muted mt-1.5">
                  Must be registered under the official institutional domain <span className="font-semibold text-psu-primary">@psu.edu.ph</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  System Role Assignment <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'role', value: 'faculty' } })}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      formData.role === 'faculty'
                        ? 'bg-psu-primary text-white border-psu-primary shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-slate-50'
                    }`}
                  >
                    <HiOutlineAcademicCap className="w-4 h-4" />
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'role', value: 'student' } })}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      formData.role === 'student'
                        ? 'bg-psu-primary text-white border-psu-primary shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-slate-50'
                    }`}
                  >
                    <HiOutlineUser className="w-4 h-4" />
                    Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Security & Credentials */}
        <div className="bg-white rounded-2xl border border-psu-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-psu-border flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/70 rounded-lg text-psu-primary">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-psu-text tracking-wide uppercase">2. Security & Credentials</h2>
              <p className="text-[11px] text-psu-muted">Configure initial password with verification safeguard</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Primary Password with Eye Toggle */}
              <div>
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <HiOutlineLockClosed className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter secure password"
                    className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-psu-primary transition-colors focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <HiOutlineEyeOff className="w-5 h-5" />
                    ) : (
                      <HiOutlineEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-psu-muted mt-1.5">
                  Must be at least 8 characters with both letters and numbers
                </p>
              </div>

              {/* Confirm Password with Eye Toggle */}
              <div>
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <HiOutlineLockClosed className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password to confirm"
                    className={`w-full pl-10 pr-11 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-psu-primary/20 bg-white transition-all shadow-sm ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-400 focus:border-red-500 ring-red-100'
                        : 'border-gray-300 focus:border-psu-primary'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-psu-primary transition-colors focus:outline-none"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <HiOutlineEyeOff className="w-5 h-5" />
                    ) : (
                      <HiOutlineEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <p className={`text-[11px] mt-1.5 font-medium flex items-center gap-1 ${
                    formData.password === formData.confirmPassword ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Passwords match
                      </>
                    ) : (
                      <>
                        <HiOutlineExclamationCircle className="w-3.5 h-3.5" /> Passwords do not match
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Academic Placement & Curriculum Assignments */}
        <div className="bg-white rounded-2xl border border-psu-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-psu-border flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/70 rounded-lg text-psu-primary">
              <HiOutlineBookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-psu-text tracking-wide uppercase">3. Academic Placement & Assignments</h2>
              <p className="text-[11px] text-psu-muted">
                {formData.role === 'faculty'
                  ? 'Assign academic department and subject teaching load per section'
                  : 'Specify student curriculum, year level, section, and enrolled courses'}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Faculty Department Placement */}
            {formData.role === 'faculty' && (
              <div>
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  Academic Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full md:w-1/2 px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Student Department, Year Level, & Section */}
            {formData.role === 'student' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                      required
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                      Year Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="year_level"
                      value={formData.year_level}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                      required
                    >
                      <option value="">Select Year Level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary bg-white transition-all shadow-sm"
                      required
                    >
                      <option value="">Select Section</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Faculty Subjects with Enriched Section Mapping */}
            {formData.role === 'faculty' && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider">
                    Subject Teaching Assignments
                  </label>
                  {formData.department && (
                    <span className="text-[11px] text-psu-muted">
                      Filtered by: <span className="font-semibold text-psu-primary">{formData.department}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-psu-muted mb-3">
                  Select curriculum courses taught by this faculty member and assign specific class sections. Leaving sections blank defaults to all sections.
                </p>

                <div className="border border-psu-border rounded-xl overflow-hidden divide-y divide-gray-200">
                  {!formData.department ? (
                    <div className="p-8 text-center bg-slate-50">
                      <HiOutlineBookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">Select an academic department above</p>
                      <p className="text-xs text-gray-400 mt-0.5">Subject curriculum listings will load automatically</p>
                    </div>
                  ) : availableFacultySubjects.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50">
                      <p className="text-sm font-medium text-gray-500">No subjects cataloged</p>
                      <p className="text-xs text-gray-400 mt-0.5">No subjects match this department and active academic semester</p>
                    </div>
                  ) : (
                    availableFacultySubjects.map((s) => {
                      const isChecked = formData.subject_ids.includes(s.id);
                      const assign = subjectAssignments[s.id] || { sections: [], year_level: '', semester: 'both' };
                      return (
                        <div key={s.id} className="bg-white">
                          <label className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-4 py-3.5 transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData((prev) => ({
                                  ...prev,
                                  subject_ids: checked
                                    ? [...prev.subject_ids, s.id]
                                    : prev.subject_ids.filter((id) => id !== s.id),
                                }));
                                if (checked) {
                                  setSubjectAssignments((prev) => ({
                                    ...prev,
                                    [s.id]: prev[s.id] || { sections: [], year_level: '', semester: 'both' },
                                  }));
                                } else {
                                  setSubjectAssignments((prev) => {
                                    const copy = { ...prev };
                                    delete copy[s.id];
                                    return copy;
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-psu-primary focus:ring-psu-primary/30 w-4 h-4"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-900">
                                <span className="text-psu-primary">{s.code}</span> — {s.name}
                              </span>
                              <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                                {s.year_level || 'General'}
                              </span>
                            </div>
                          </label>

                          {isChecked && (
                            <div className="px-5 pb-4 pt-2.5 ml-7 mr-4 mb-3 bg-blue-50/40 border border-blue-100 rounded-xl">
                              <label className="block text-[11px] font-bold text-psu-primary uppercase tracking-wider mb-2">
                                Class Sections Assignment
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 border border-gray-200 rounded-lg">
                                {['A', 'B', 'C', 'D'].map((sec) => {
                                  const isSecChecked = (assign.sections || []).includes(sec);
                                  const assignedTo = getAssignedFaculty(s.id, sec);
                                  return (
                                    <label
                                      key={sec}
                                      className={`flex items-center gap-2 text-xs p-1.5 rounded transition-colors ${
                                        assignedTo
                                          ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                          : 'text-gray-700 hover:bg-slate-50 cursor-pointer'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSecChecked}
                                        disabled={!!assignedTo}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setSubjectAssignments((prev) => {
                                            const currentSections = prev[s.id]?.sections || [];
                                            const newSections = checked
                                              ? [...currentSections, sec]
                                              : currentSections.filter((x) => x !== sec);
                                            return {
                                              ...prev,
                                              [s.id]: {
                                                ...(prev[s.id] || { sections: [], year_level: '', semester: 'both' }),
                                                sections: newSections,
                                              },
                                            };
                                          });
                                        }}
                                        className="rounded border-gray-300 text-psu-primary focus:ring-psu-primary/30 w-3.5 h-3.5"
                                      />
                                      <span className="font-semibold">
                                        Section {sec} {assignedTo ? `(${assignedTo})` : ''}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1.5">
                                If no individual sections are selected, this assignment applies to all sections.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Student Subject Enrollment */}
            {formData.role === 'student' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-psu-text uppercase tracking-wider mb-1.5">
                  Enrolled Subjects
                </label>
                <div className="border border-psu-border rounded-xl p-3 max-h-56 overflow-y-auto space-y-1.5 divide-y divide-gray-100">
                  {!formData.department || !formData.year_level ? (
                    <p className="text-sm text-gray-400 p-4 text-center">
                      Please select both Department and Year Level above to populate subjects
                    </p>
                  ) : availableStudentSubjects.length === 0 ? (
                    <p className="text-sm text-gray-400 p-4 text-center">
                      No subjects available for this department, year level, and active semester
                    </p>
                  ) : (
                    availableStudentSubjects.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2.5 rounded-lg transition-colors pt-2.5"
                      >
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
                          className="rounded border-gray-300 text-psu-primary focus:ring-psu-primary/30 w-4 h-4"
                        />
                        <div className="flex-1 flex items-center justify-between text-xs sm:text-sm">
                          <span className="font-medium text-gray-800">
                            <span className="font-bold text-psu-primary">{s.code}</span> — {s.name}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {s.semester === 'both' ? 'Both Semesters' : s.semester}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-[11px] text-psu-muted mt-1.5">
                  Check all subjects the student is actively enrolled in for the current academic period.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => navigate('/admin/accounts')}
            className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-slate-50 font-semibold text-gray-700 text-xs sm:text-sm transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-2.5 bg-psu-primary text-white rounded-xl hover:bg-psu-secondary disabled:bg-gray-400 font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registering Account...
              </>
            ) : (
              <>
                <HiOutlineCheckCircle className="w-4 h-4" />
                Register Account
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

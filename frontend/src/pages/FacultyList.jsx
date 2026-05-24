import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiArrowRight, HiOutlineChartBar, HiOutlineUserGroup } from 'react-icons/hi';
import facultyService from '../services/facultyService';

const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDept, setActiveDept] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await facultyService.getAll();
        setFaculty(response.data.faculty);
      } catch {
        setFaculty([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = [...new Set((faculty || []).map(f => f.department))].sort();
    return ['All', ...depts];
  }, [faculty]);

  // Filter by search + department
  const filteredFaculty = useMemo(() => {
    return (faculty || [])
      .filter(f => {
        const matchesSearch =
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (f.subject_names || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (f.subject_codes || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = activeDept === 'All' || f.department === activeDept;
        return matchesSearch && matchesDept;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [faculty, searchTerm, activeDept]);

  // Group filtered faculty by department
  const groupedFaculty = useMemo(() => {
    const groups = {};
    filteredFaculty.forEach(f => {
      if (!groups[f.department]) groups[f.department] = [];
      groups[f.department].push(f);
    });
    // Sort department keys
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFaculty]);

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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Directory</p>
          <h1 className="text-3xl font-semibold text-psu-text tracking-tight">Faculty</h1>
        </div>
        <div className="mt-4 sm:mt-0 relative">
          <HiOutlineSearch className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-psu-muted" />
          <input
            type="text"
            placeholder="Search by name, department, or subject"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-6 pr-4 py-2 border-0 border-b border-psu-border bg-transparent text-[14px] text-psu-text placeholder-gray-300 focus:border-psu-primary transition-colors w-full sm:w-72"
          />
        </div>
      </div>

      {/* Department tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
              activeDept === dept
                ? 'bg-psu-primary text-white shadow-sm'
                : 'bg-white text-psu-muted border border-psu-border hover:border-slate-300 hover:text-psu-text'
            }`}
          >
            {dept}
            {dept === 'All' && (
              <span className="ml-1.5 opacity-70">({(faculty || []).length})</span>
            )}
            {dept !== 'All' && (
              <span className="ml-1.5 opacity-70">
                ({(faculty || []).filter(f => f.department === dept).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grouped list */}
      <div className="space-y-8">
        {groupedFaculty.map(([department, members]) => (
          <div key={department}>
            {/* Department header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-psu-primary/10 text-psu-primary flex items-center justify-center flex-shrink-0">
                <HiOutlineUserGroup className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-psu-text">{department}</h2>
                <p className="text-[11px] text-psu-muted">
                  {members.length} faculty member{members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Faculty cards */}
            <div className="border border-psu-border rounded-xl divide-y divide-psu-border overflow-hidden">
              {members.map(member => (
                <div
                  key={member.id}
                  className="bg-white px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                >
                  {/* Faculty info */}
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-psu-primary/8 border border-psu-border rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[13px] font-semibold text-psu-primary">
                        {member.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-psu-text truncate">{member.name}</p>
                      <p className="text-[12px] text-psu-muted mt-0.5 truncate">
                        {member.subject_names
                          ? `${member.subject_codes} — ${member.subject_names}`
                          : 'No subject assigned'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Link
                      to={`/reports/${member.id}`}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-psu-muted hover:text-psu-primary transition-colors border border-psu-border hover:border-psu-primary rounded-lg px-3 py-1.5"
                    >
                      <HiOutlineChartBar className="h-3.5 w-3.5" />
                      Report
                    </Link>
                    <HiArrowRight className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[13px] text-psu-muted">No faculty members match your search.</p>
        </div>
      )}

      <p className="text-[12px] text-psu-muted mt-6">
        {filteredFaculty.length} member{filteredFaculty.length !== 1 ? 's' : ''}
        {activeDept !== 'All' && ` in ${activeDept}`}
      </p>
    </div>
  );
};

export default FacultyList;
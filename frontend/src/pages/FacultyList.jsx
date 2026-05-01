import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiArrowRight, HiOutlineChartBar } from 'react-icons/hi';
import facultyService from '../services/facultyService';

const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await facultyService.getAll();
        setFaculty(response.data.faculty);
      } catch {
        setFaculty([
          { id: 1, name: 'Dr. Maria Santos',    department: 'Computer Science',       created_at: '2024-01-15' },
          { id: 2, name: 'Prof. Juan Dela Cruz', department: 'Information Technology', created_at: '2024-01-15' },
          { id: 3, name: 'Dr. Ana Reyes',        department: 'Mathematics',            created_at: '2024-02-10' },
          { id: 4, name: 'Prof. Carlo Mendoza',  department: 'Engineering',            created_at: '2024-03-05' },
          { id: 5, name: 'Dr. Lisa Garcia',      department: 'Computer Science',       created_at: '2024-03-12' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  const filteredFaculty = (faculty || [])
    .filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.subject_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.subject_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10">
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

      <div className="border border-psu-border divide-y divide-psu-border">
        {filteredFaculty.map(member => (
          <div
            key={member.id}
            className="bg-white px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
          >
            {/* Faculty info */}
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="w-10 h-10 bg-psu-primary/8 border border-psu-border flex items-center justify-center flex-shrink-0">
                <span className="text-[13px] font-semibold text-psu-primary">
                  {member.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-psu-text truncate">{member.name}</p>
                <p className="text-[12px] text-psu-muted mt-0.5 truncate">
                  {member.subject_code ? `${member.subject_code} - ${member.subject_name}` : 'No subject assigned'} · {member.department}
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

      {filteredFaculty.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[13px] text-psu-muted">No faculty members match your search.</p>
        </div>
      )}

      <p className="text-[12px] text-psu-muted mt-4">
        {filteredFaculty.length} member{filteredFaculty.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default FacultyList;
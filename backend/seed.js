const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./config/db');
require('dotenv').config();

const seed = async () => {
  await testConnection();

  const hash = await bcrypt.hash('Psu@Pass1', 10);
  const adminHash = await bcrypt.hash('Psu@Admin1', 10);

  // ── 1. Admin ──────────────────────────────────────────────────────
  console.log('Seeding admin...');
  await pool.execute(
    `INSERT INTO admins (name, email, password, email_verified) VALUES
      ('Admin User', 'admin@psu.edu.ph', ?, TRUE)
    ON DUPLICATE KEY UPDATE name=name`,
    [adminHash]
  );

  // ── 2. Subjects (10 across 5 departments) ─────────────────────────
  console.log('Seeding subjects...');
  await pool.execute(
    `INSERT INTO subjects (code, name, department, semester, year_level) VALUES
      ('CS101', 'Computer Programming 1', 'Computer Science', '1st', '1st Year'),
      ('CS102', 'Data Structures', 'Computer Science', '2nd', '1st Year'),
      ('CS201', 'Operating Systems', 'Computer Science', '1st', '2nd Year'),
      ('IT101', 'Information Assurance and Security', 'Information Technology', '1st', '1st Year'),
      ('IT102', 'Network Administration', 'Information Technology', '2nd', '1st Year'),
      ('IT201', 'Web Development', 'Information Technology', '1st', '2nd Year'),
      ('ENG101', 'Engineering Mathematics', 'Engineering', '1st', '1st Year'),
      ('ENG201', 'Thermodynamics', 'Engineering', '2nd', '2nd Year'),
      ('EDU101', 'Principles of Teaching', 'Education', '1st', '1st Year'),
      ('BA101', 'Financial Management', 'Business Administration', '1st', '1st Year')
    ON DUPLICATE KEY UPDATE name=VALUES(name), semester=VALUES(semester), year_level=VALUES(year_level)`
  );

  // Get subject IDs by code for later use
  const [subjects] = await pool.execute('SELECT id, code FROM subjects');
  const subj = {};
  subjects.forEach(s => { subj[s.code] = s.id; });

  // ── 3. Faculty (20 across 5 departments) ──────────────────────────
  console.log('Seeding faculty...');

  const facultyData = [
    // Computer Science (4)
    { name: 'Dr. Maria Santos', email: 'faculty@psu.edu.ph', dept: 'Computer Science' },
    { name: 'Dr. Ana Reyes', email: 'faculty3@psu.edu.ph', dept: 'Computer Science' },
    { name: 'Prof. Ricardo Bautista', email: 'faculty9@psu.edu.ph', dept: 'Computer Science' },
    { name: 'Dr. Carmen Lim', email: 'faculty10@psu.edu.ph', dept: 'Computer Science' },

    // Information Technology (4)
    { name: 'Prof. Juan Dela Cruz', email: 'faculty2@psu.edu.ph', dept: 'Information Technology' },
    { name: 'Dr. Lisa Garcia', email: 'faculty5@psu.edu.ph', dept: 'Information Technology' },
    { name: 'Prof. Dennis Pascual', email: 'faculty11@psu.edu.ph', dept: 'Information Technology' },
    { name: 'Dr. Grace Soriano', email: 'faculty12@psu.edu.ph', dept: 'Information Technology' },

    // Engineering (4)
    { name: 'Prof. Carlo Mendoza', email: 'faculty4@psu.edu.ph', dept: 'Engineering' },
    { name: 'Prof. Roberto Aquino', email: 'faculty8@psu.edu.ph', dept: 'Engineering' },
    { name: 'Dr. Elena Magno', email: 'faculty13@psu.edu.ph', dept: 'Engineering' },
    { name: 'Prof. Renato Ibarra', email: 'faculty14@psu.edu.ph', dept: 'Engineering' },

    // Education (4)
    { name: 'Prof. Miguel Torres', email: 'faculty6@psu.edu.ph', dept: 'Education' },
    { name: 'Dr. Rosario Dimaculangan', email: 'faculty15@psu.edu.ph', dept: 'Education' },
    { name: 'Prof. Luisa Manalo', email: 'faculty16@psu.edu.ph', dept: 'Education' },
    { name: 'Dr. Antonio Evangelista', email: 'faculty17@psu.edu.ph', dept: 'Education' },

    // Business Administration (4)
    { name: 'Dr. Patricia Villanueva', email: 'faculty7@psu.edu.ph', dept: 'Business Administration' },
    { name: 'Prof. Fernando Valdez', email: 'faculty18@psu.edu.ph', dept: 'Business Administration' },
    { name: 'Dr. Beatriz Salcedo', email: 'faculty19@psu.edu.ph', dept: 'Business Administration' },
    { name: 'Prof. Marco Alejandro', email: 'faculty20@psu.edu.ph', dept: 'Business Administration' },
  ];

  for (const f of facultyData) {
    await pool.execute(
      `INSERT INTO faculty (name, email, password, department, email_verified)
       VALUES (?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE name=VALUES(name), department=VALUES(department)`,
      [f.name, f.email, hash, f.dept]
    );
  }

  // Map faculty emails to subject assignments
  const facultySubjects = {
    // CS
    'faculty@psu.edu.ph': ['CS101', 'CS102'],
    'faculty3@psu.edu.ph': ['CS201', 'CS102'],
    'faculty9@psu.edu.ph': ['CS101', 'CS201'],
    'faculty10@psu.edu.ph': ['CS102'],
    // IT
    'faculty2@psu.edu.ph': ['IT101', 'IT102'],
    'faculty5@psu.edu.ph': ['IT201', 'IT101'],
    'faculty11@psu.edu.ph': ['IT102', 'IT201'],
    'faculty12@psu.edu.ph': ['IT101'],
    // Engineering
    'faculty4@psu.edu.ph': ['ENG101', 'ENG201'],
    'faculty8@psu.edu.ph': ['ENG201', 'ENG101'],
    'faculty13@psu.edu.ph': ['ENG101'],
    'faculty14@psu.edu.ph': ['ENG201'],
    // Education
    'faculty6@psu.edu.ph': ['EDU101'],
    'faculty15@psu.edu.ph': ['EDU101'],
    'faculty16@psu.edu.ph': ['EDU101'],
    'faculty17@psu.edu.ph': ['EDU101'],
    // Business Administration
    'faculty7@psu.edu.ph': ['BA101'],
    'faculty18@psu.edu.ph': ['BA101'],
    'faculty19@psu.edu.ph': ['BA101'],
    'faculty20@psu.edu.ph': ['BA101'],
  };

  console.log('Assigning subjects to faculty...');
  const [allFaculty] = await pool.execute('SELECT id, email FROM faculty');
  const facMap = {};
  allFaculty.forEach(f => { facMap[f.email] = f.id; });

  for (const [email, codes] of Object.entries(facultySubjects)) {
    const fid = facMap[email];
    if (!fid) continue;
    for (const code of codes) {
      const sid = subj[code];
      if (!sid) continue;
      await pool.execute(
        `INSERT INTO faculty_subjects (faculty_id, subject_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE faculty_id=faculty_id`,
        [fid, sid]
      );
    }
  }

  // ── 4. Students (30 across departments / year levels / sections) ──
  console.log('Seeding students...');

  const studentData = [
    // Computer Science
    { name: 'Raymond Heras', email: 'student1@psu.edu.ph', yr: '4th Year', sec: 'A', dept: 'Computer Science', subs: ['CS101', 'CS201'] },
    { name: 'Angela Cruz', email: 'student6@psu.edu.ph', yr: '4th Year', sec: 'A', dept: 'Computer Science', subs: ['CS101', 'CS102'] },
    { name: 'Kevin Lim', email: 'student7@psu.edu.ph', yr: '3rd Year', sec: 'A', dept: 'Computer Science', subs: ['CS101', 'CS102'] },
    { name: 'Sarah Fernandez', email: 'student8@psu.edu.ph', yr: '3rd Year', sec: 'B', dept: 'Computer Science', subs: ['CS102', 'CS201'] },
    { name: 'Daniel Ramos', email: 'student9@psu.edu.ph', yr: '2nd Year', sec: 'A', dept: 'Computer Science', subs: ['CS101'] },
    { name: 'Maria Lopez', email: 'student10@psu.edu.ph', yr: '2nd Year', sec: 'B', dept: 'Computer Science', subs: ['CS101'] },
    { name: 'Paolo Santos', email: 'student11@psu.edu.ph', yr: '1st Year', sec: 'A', dept: 'Computer Science', subs: ['CS101'] },

    // Information Technology
    { name: 'Hero Reyes', email: 'student2@psu.edu.ph', yr: '4th Year', sec: 'B', dept: 'Information Technology', subs: ['IT101', 'IT201'] },
    { name: 'Mark Len', email: 'student3@psu.edu.ph', yr: '4th Year', sec: 'B', dept: 'Information Technology', subs: ['IT101', 'IT102'] },
    { name: 'Jordan Dave Caparas', email: 'student4@psu.edu.ph', yr: '4th Year', sec: 'B', dept: 'Information Technology', subs: ['IT101', 'IT201'] },
    { name: 'Junard Chua', email: 'student5@psu.edu.ph', yr: '4th Year', sec: 'A', dept: 'Information Technology', subs: ['IT101', 'IT102'] },
    { name: 'Christine Diaz', email: 'student12@psu.edu.ph', yr: '3rd Year', sec: 'A', dept: 'Information Technology', subs: ['IT102', 'IT201'] },
    { name: 'Patrick Bautista', email: 'student13@psu.edu.ph', yr: '3rd Year', sec: 'B', dept: 'Information Technology', subs: ['IT101'] },
    { name: 'Alyssa Mendoza', email: 'student14@psu.edu.ph', yr: '2nd Year', sec: 'A', dept: 'Information Technology', subs: ['IT101'] },
    { name: 'John Michael Rivera', email: 'student15@psu.edu.ph', yr: '2nd Year', sec: 'B', dept: 'Information Technology', subs: ['IT102'] },
    { name: 'Bianca Torres', email: 'student16@psu.edu.ph', yr: '1st Year', sec: 'A', dept: 'Information Technology', subs: ['IT101'] },

    // Engineering
    { name: 'Carlos Villareal', email: 'student17@psu.edu.ph', yr: '4th Year', sec: 'A', dept: 'Engineering', subs: ['ENG101', 'ENG201'] },
    { name: 'Diana Pascual', email: 'student18@psu.edu.ph', yr: '4th Year', sec: 'B', dept: 'Engineering', subs: ['ENG201'] },
    { name: 'Elijah Navarro', email: 'student19@psu.edu.ph', yr: '3rd Year', sec: 'A', dept: 'Engineering', subs: ['ENG101'] },
    { name: 'Francine Gutierrez', email: 'student20@psu.edu.ph', yr: '3rd Year', sec: 'B', dept: 'Engineering', subs: ['ENG101', 'ENG201'] },
    { name: 'Gabriel Castro', email: 'student21@psu.edu.ph', yr: '2nd Year', sec: 'A', dept: 'Engineering', subs: ['ENG101'] },
    { name: 'Hannah Salazar', email: 'student22@psu.edu.ph', yr: '1st Year', sec: 'A', dept: 'Engineering', subs: ['ENG101'] },

    // Education
    { name: 'Isabella Morales', email: 'student23@psu.edu.ph', yr: '4th Year', sec: 'A', dept: 'Education', subs: ['EDU101'] },
    { name: 'Jose Aguilar', email: 'student24@psu.edu.ph', yr: '4th Year', sec: 'B', dept: 'Education', subs: ['EDU101'] },
    { name: 'Karen Flores', email: 'student25@psu.edu.ph', yr: '3rd Year', sec: 'A', dept: 'Education', subs: ['EDU101'] },
    { name: 'Leo Santiago', email: 'student26@psu.edu.ph', yr: '2nd Year', sec: 'A', dept: 'Education', subs: ['EDU101'] },

    // Business Administration
    { name: 'Monica Tan', email: 'student27@psu.edu.ph', yr: '4th Year', sec: 'A', dept: 'Business Administration', subs: ['BA101'] },
    { name: 'Nathan Cruz', email: 'student28@psu.edu.ph', yr: '4th Year', sec: 'B', dept: 'Business Administration', subs: ['BA101'] },
    { name: 'Olivia Reyes', email: 'student29@psu.edu.ph', yr: '3rd Year', sec: 'A', dept: 'Business Administration', subs: ['BA101'] },
    { name: 'Peter Gonzales', email: 'student30@psu.edu.ph', yr: '2nd Year', sec: 'A', dept: 'Business Administration', subs: ['BA101'] },
  ];

  for (const s of studentData) {
    await pool.execute(
      `INSERT INTO students (name, email, password, year_level, section, department, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE name=VALUES(name), year_level=VALUES(year_level), section=VALUES(section), department=VALUES(department)`,
      [s.name, s.email, hash, s.yr, s.sec, s.dept]
    );
  }

  // Assign subjects to students
  console.log('Assigning subjects to students...');
  const [allStudents] = await pool.execute('SELECT id, email FROM students');
  const stuMap = {};
  allStudents.forEach(s => { stuMap[s.email] = s.id; });

  for (const s of studentData) {
    const sid = stuMap[s.email];
    if (!sid) continue;
    for (const code of s.subs) {
      const subjId = subj[code];
      if (!subjId) continue;
      await pool.execute(
        `INSERT INTO student_subjects (student_id, subject_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE student_id=student_id`,
        [sid, subjId]
      );
    }
  }

  // ── 5. Academic Period ────────────────────────────────────────────
  console.log('Seeding academic period...');
  await pool.execute(
    `INSERT INTO academic_periods (academic_year, semester, is_active, start_date, end_date)
     VALUES ('2025-2026', '2nd', 1, '2026-01-01', '2026-06-30')
     ON DUPLICATE KEY UPDATE academic_year=academic_year`
  );

  // ── Done ──────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('══════════════════════════════════════════════');
  console.log('  ACCOUNTS (All passwords: Psu@Pass1)');
  console.log('══════════════════════════════════════════════');
  console.log('  Admin:   admin@psu.edu.ph / Psu@Admin1');
  console.log('──────────────────────────────────────────────');
  console.log(`  FACULTY (${facultyData.length}):`);
  facultyData.forEach(f => console.log(`    ${f.email.padEnd(26)} │ ${f.dept}`));
  console.log('──────────────────────────────────────────────');
  console.log(`  STUDENTS (${studentData.length}):`);
  console.log('    Computer Science ........... 7');
  console.log('    Information Technology ..... 9');
  console.log('    Engineering ................ 6');
  console.log('    Education .................. 4');
  console.log('    Business Administration .... 4');
  console.log('──────────────────────────────────────────────');
  console.log('  SUBJECTS (10):');
  console.log('    CS101, CS102, CS201, IT101, IT102, IT201');
  console.log('    ENG101, ENG201, EDU101, BA101');
  console.log('══════════════════════════════════════════════\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

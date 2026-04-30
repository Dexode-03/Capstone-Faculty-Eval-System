const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./config/db');
require('dotenv').config();

const seed = async () => {
  await testConnection();

  // Hash passwords matching the frontend mock accounts
  const adminHash   = await bcrypt.hash('Psu@Admin1',   10);
  const facultyHash = await bcrypt.hash('Psu@Faculty1', 10);
  const studentHash = await bcrypt.hash('Psu@Student1', 10);

  console.log('Seeding users...');

  await pool.execute(
    `INSERT INTO users (name, email, password, role, email_verified) VALUES
      ('Admin User',          'admin@psu.edu.ph',    ?, 'admin',   TRUE),
      ('Dr. Maria Santos',    'faculty@psu.edu.ph',  ?, 'faculty', TRUE),
      ('Prof. Juan Dela Cruz','juan@psu.edu.ph',     ?, 'faculty', TRUE),
      ('Dr. Ana Reyes',       'ana@psu.edu.ph',      ?, 'faculty', TRUE),
      ('Prof. Carlo Mendoza', 'carlo@psu.edu.ph',    ?, 'faculty', TRUE),
      ('Dr. Lisa Garcia',     'lisa@psu.edu.ph',     ?, 'faculty', TRUE),
      ('Test Student',        'student@psu.edu.ph',  ?, 'student', TRUE),
      ('Juan Dela Cruz',      'student2@psu.edu.ph', ?, 'student', TRUE)
    ON DUPLICATE KEY UPDATE name=name`,
    [
      adminHash,
      facultyHash, facultyHash, facultyHash, facultyHash, facultyHash,
      studentHash, studentHash,
    ]
  );

  console.log('Seeding faculty...');

  await pool.execute(
    `INSERT INTO faculty (user_id, name, department) VALUES
      (2, 'Dr. Maria Santos',    'Computer Science'),
      (3, 'Prof. Juan Dela Cruz','Information Technology'),
      (4, 'Dr. Ana Reyes',       'Mathematics'),
      (5, 'Prof. Carlo Mendoza', 'Engineering'),
      (6, 'Dr. Lisa Garcia',     'Computer Science')
    ON DUPLICATE KEY UPDATE name=name`
  );

  console.log('Seeding evaluation questions...');

  await pool.execute(
    `INSERT INTO evaluation_questions (category, question, sort_order) VALUES
      ('Teaching Quality',  'The instructor explains concepts clearly and effectively.',        1),
      ('Teaching Quality',  'The instructor is well-prepared for each class session.',          2),
      ('Teaching Quality',  'The instructor uses relevant examples to illustrate key points.',  3),
      ('Communication',     'The instructor encourages student participation and questions.',    4),
      ('Communication',     'The instructor is approachable and available for consultation.',    5),
      ('Communication',     'The instructor provides clear and constructive feedback.',          6),
      ('Course Management', 'The course materials and resources are adequate and helpful.',     7),
      ('Course Management', 'The instructor manages class time effectively.',                   8),
      ('Course Management', 'The grading criteria and policies are fair and transparent.',      9),
      ('Professionalism',   'The instructor demonstrates respect for students.',               10)
    ON DUPLICATE KEY UPDATE question=question`
  );

  console.log('Seeding evaluations...');

  await pool.execute(
    `INSERT INTO evaluations (student_id, faculty_id, rating, comment, sentiment, sentiment_score) VALUES
      (7, 1, 5, 'The professor explains concepts clearly and is very approachable.',     'positive',  3),
      (7, 2, 4, 'Good lectures but sometimes the pace is too fast.',                    'neutral',   1),
      (7, 3, 5, 'Very helpful and supportive teacher. Best professor I have had.',       'positive',  5),
      (7, 4, 3, 'The lectures are boring and hard to understand sometimes.',             'negative', -3),
      (7, 5, 4, 'Great teaching style, uses real world examples.',                      'positive',  2),
      (8, 1, 5, 'Outstanding professor, always prepared and very engaging.',             'positive',  4),
      (8, 2, 3, 'Decent but could improve on pacing and clarity of explanations.',      'neutral',   0),
      (8, 3, 4, 'Good at math but rushed through several topics.',                      'neutral',   1),
      (8, 4, 2, 'Classes feel unengaging and feedback on assignments is too slow.',      'negative', -2),
      (8, 5, 5, 'Excellent communicator. Makes difficult subjects easy to understand.', 'positive',  5)
    ON DUPLICATE KEY UPDATE comment=comment`
  );

  console.log('\nSeed complete! Accounts:\n');
  console.log('  Admin:    admin@psu.edu.ph    / Psu@Admin1');
  console.log('  Faculty:  faculty@psu.edu.ph  / Psu@Faculty1');
  console.log('  Faculty:  juan@psu.edu.ph     / Psu@Faculty1');
  console.log('  Faculty:  ana@psu.edu.ph      / Psu@Faculty1');
  console.log('  Faculty:  carlo@psu.edu.ph    / Psu@Faculty1');
  console.log('  Faculty:  lisa@psu.edu.ph     / Psu@Faculty1');
  console.log('  Student:  student@psu.edu.ph  / Psu@Student1');
  console.log('  Student:  student2@psu.edu.ph / Psu@Student1');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
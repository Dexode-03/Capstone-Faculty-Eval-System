const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./config/db');
require('dotenv').config();

const seed = async () => {
  await testConnection();

  const adminHash   = await bcrypt.hash('Psu@Admin1',   10);
  const facultyHash = await bcrypt.hash('Psu@Faculty1', 10);
  const studentHash = await bcrypt.hash('Psu@Student1', 10);

  console.log('Seeding users...');

  await pool.execute(
    `INSERT INTO users (name, email, password, role, email_verified) VALUES
      ('Admin User',           'admin@psu.edu.ph',  ?, 'admin',   TRUE),
      ('Dr. Maria Santos',     'maria@fefas.com',   ?, 'faculty', TRUE),
      ('Prof. Juan Dela Cruz', 'juan@fefas.com',    ?, 'faculty', TRUE)
    ON DUPLICATE KEY UPDATE name=name`,
    [adminHash, facultyHash, facultyHash]
  );

  console.log('Seeding faculty...');

  await pool.execute(
    `INSERT INTO faculty (user_id, name, department)
     SELECT id, name, CASE
       WHEN email = 'maria@fefas.com' THEN 'Computer Science'
       WHEN email = 'juan@fefas.com'  THEN 'Information Technology'
     END
     FROM users WHERE role = 'faculty'
     ON DUPLICATE KEY UPDATE name=VALUES(name)`
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

  console.log('\nSeed complete! Accounts:\n');
  console.log('  Admin:    admin@psu.edu.ph  / Psu@Admin1');
  console.log('  Faculty:  maria@fefas.com   / Psu@Faculty1');
  console.log('  Faculty:  juan@fefas.com    / Psu@Faculty1');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
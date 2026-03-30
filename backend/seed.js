const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./config/db');
require('dotenv').config();

const seed = async () => {
  await testConnection();

  const hashedPassword = await bcrypt.hash('password123', 10);

  console.log('Seeding users...');

  // Insert test users (email_verified = true so they can login immediately)
  await pool.execute(
    `INSERT INTO users (name, email, password, role, email_verified) VALUES
      ('Admin User', 'admin@fefas.com', ?, 'admin', TRUE),
      ('Dr. Maria Santos', 'maria@fefas.com', ?, 'faculty', TRUE),
      ('Prof. Juan Dela Cruz', 'juan@fefas.com', ?, 'faculty', TRUE),
      ('Student One', 'student1@fefas.com', ?, 'student', TRUE),
      ('Student Two', 'student2@fefas.com', ?, 'student', TRUE)
    ON DUPLICATE KEY UPDATE name=name`,
    [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]
  );

  console.log('Seeding faculty...');

  await pool.execute(
    `INSERT INTO faculty (user_id, name, department) VALUES
      (2, 'Dr. Maria Santos', 'Computer Science'),
      (3, 'Prof. Juan Dela Cruz', 'Information Technology')
    ON DUPLICATE KEY UPDATE name=name`
  );

  console.log('Seeding evaluation questions...');

  await pool.execute(
    `INSERT INTO evaluation_questions (category, question, sort_order) VALUES
      ('Teaching Quality', 'The instructor explains concepts clearly and effectively.', 1),
      ('Teaching Quality', 'The instructor is well-prepared for each class session.', 2),
      ('Teaching Quality', 'The instructor uses relevant examples to illustrate key points.', 3),
      ('Communication', 'The instructor encourages student participation and questions.', 4),
      ('Communication', 'The instructor is approachable and available for consultation.', 5),
      ('Communication', 'The instructor provides clear and constructive feedback.', 6),
      ('Course Management', 'The course materials and resources are adequate and helpful.', 7),
      ('Course Management', 'The instructor manages class time effectively.', 8),
      ('Course Management', 'The grading criteria and policies are fair and transparent.', 9),
      ('Professionalism', 'The instructor demonstrates respect for students.', 10)
    ON DUPLICATE KEY UPDATE question=question`
  );

  console.log('Seeding evaluations...');

  await pool.execute(
    `INSERT INTO evaluations (student_id, faculty_id, rating, comment, sentiment, sentiment_score) VALUES
      (4, 1, 5, 'The professor explains concepts clearly and is very approachable.', 'positive', 3),
      (4, 2, 4, 'Good lectures but sometimes the pace is too fast.', 'neutral', 1),
      (5, 1, 5, 'Very helpful and supportive teacher. Best professor I have had.', 'positive', 5),
      (5, 2, 3, 'The lectures are boring and hard to understand sometimes.', 'negative', -3),
      (4, 1, 4, 'Great teaching style, uses real world examples.', 'positive', 2),
      (5, 1, 3, 'Decent but could improve on pacing and clarity.', 'neutral', 0)`
  );

  console.log('\nSeed complete! Test accounts:\n');
  console.log('  Admin:    admin@fefas.com    / password123');
  console.log('  Faculty:  maria@fefas.com    / password123');
  console.log('  Faculty:  juan@fefas.com     / password123');
  console.log('  Student:  student1@fefas.com / password123');
  console.log('  Student:  student2@fefas.com / password123');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

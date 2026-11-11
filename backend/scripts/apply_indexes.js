const { pool } = require('../config/db');

async function applyIndexes() {
  console.log('Applying performance indexes...');
  const queries = [
    // evaluations (academic_period_id, faculty_id)
    `ALTER TABLE evaluations ADD INDEX idx_eval_period_faculty (academic_period_id, faculty_id)`,
    // evaluation_submissions (student_id, academic_period_id)
    `ALTER TABLE evaluation_submissions ADD INDEX idx_sub_student_period (student_id, academic_period_id)`,
    // evaluation_responses (evaluation_id, question_id)
    `ALTER TABLE evaluation_responses ADD INDEX idx_resp_eval_question (evaluation_id, question_id)`
  ];

  for (const q of queries) {
    try {
      await pool.execute(q);
      console.log('Executed:', q);
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('Index already exists, skipping:', q);
      } else {
        console.warn('Index notice:', err.message);
      }
    }
  }
  console.log('Database index optimization complete.');
  process.exit(0);
}

applyIndexes().catch(err => {
  console.error(err);
  process.exit(1);
});


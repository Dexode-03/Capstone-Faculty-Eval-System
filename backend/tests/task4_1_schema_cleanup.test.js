const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('Task 4.1: Schema Cleanup and Referential Integrity', () => {
  const upMigrationPath = path.resolve(__dirname, '../../database/migration_task4_1_schema_cleanup.sql');
  const downMigrationPath = path.resolve(__dirname, '../../database/migration_task4_1_schema_cleanup_down.sql');

  test('1. Migration UP and DOWN files exist', () => {
    assert.ok(fs.existsSync(upMigrationPath), 'UP migration file must exist');
    assert.ok(fs.existsSync(downMigrationPath), 'DOWN migration file must exist');
  });

  test('2. UP migration drops student_id_new and faculty_id_new from evaluations', () => {
    const upContent = fs.readFileSync(upMigrationPath, 'utf8');
    assert.match(upContent, /DROP\s+COLUMN(\s+IF\s+EXISTS)?\s+`?student_id_new`?/i, 'Must drop student_id_new');
    assert.match(upContent, /DROP\s+COLUMN(\s+IF\s+EXISTS)?\s+`?faculty_id_new`?/i, 'Must drop faculty_id_new');
  });

  test('3. UP migration adds composite index and foreign key between student_subjects and faculty_subjects', () => {
    const upContent = fs.readFileSync(upMigrationPath, 'utf8');
    assert.match(upContent, /faculty_subjects[\s\S]*?`idx_facsubj_subject_faculty`\s*\(`subject_id`,\s*`faculty_id`\)/i, 'Must index faculty_subjects(subject_id, faculty_id)');
    assert.match(upContent, /FOREIGN\s+KEY\s*\(`subject_id`,\s*`faculty_id`\)\s*REFERENCES\s*`faculty_subjects`\s*\(`subject_id`,\s*`faculty_id`\)/i, 'Must define composite foreign key');
  });

  test('4. UP migration includes orphan row sanitization prior to foreign key creation', () => {
    const upContent = fs.readFileSync(upMigrationPath, 'utf8');
    assert.match(upContent, /UPDATE\s+`?student_subjects`?[\s\S]*?LEFT\s+JOIN\s+`?faculty_subjects`?[\s\S]*?SET[\s\S]*?NULL/i, 'Must sanitize orphan rows before creating FK');
  });

  test('5. DOWN migration safely rolls back foreign key, index, and restores legacy columns', () => {
    const downContent = fs.readFileSync(downMigrationPath, 'utf8');
    assert.match(downContent, /DROP\s+FOREIGN\s+KEY(\s+IF\s+EXISTS)?\s+`?fk_student_subjects_faculty_subject`?/i, 'Must drop composite foreign key');
    assert.match(downContent, /DROP\s+INDEX(\s+IF\s+EXISTS)?\s+`?idx_facsubj_subject_faculty`?/i, 'Must drop index on faculty_subjects');
    assert.match(downContent, /ADD\s+COLUMN(\s+IF\s+NOT\s+EXISTS)?\s+`?student_id_new`?/i, 'Must restore student_id_new');
    assert.match(downContent, /ADD\s+COLUMN(\s+IF\s+NOT\s+EXISTS)?\s+`?faculty_id_new`?/i, 'Must restore faculty_id_new');
  });
});

const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const { pool } = require('../config/db');

describe('Phase 5: Campus ID Format (YY-AS-NNNN & ASIN-NNNNNN)', () => {
  after(async () => {
    await pool.end();
  });

  it('generates student ID matching YY-AS-NNNN based on year level', async () => {
    const currentYear = new Date().getFullYear();

    // 1st Year: entry year = currentYear
    const res1 = await User.createStudent({
      name: 'Test Student 1st Year',
      email: `test_std_1st_${Date.now()}@psu.edu.ph`,
      password: 'hashed_password',
      year_level: '1st Year',
      section: 'A',
      department: 'Computer Science',
      verification_token: 'tok_1',
    });

    const expectedYY1 = String(currentYear).slice(-2);
    assert.match(res1.insertId, new RegExp(`^${expectedYY1}-AS-\\d{4}$`));

    // 4th Year: entry year = currentYear - 3
    const res4 = await User.createStudent({
      name: 'Test Student 4th Year',
      email: `test_std_4th_${Date.now()}@psu.edu.ph`,
      password: 'hashed_password',
      year_level: '4th Year',
      section: 'B',
      department: 'Computer Science',
      verification_token: 'tok_4',
    });

    const expectedYY4 = String(currentYear - 3).slice(-2);
    assert.match(res4.insertId, new RegExp(`^${expectedYY4}-AS-\\d{4}$`));

    // Clean up test rows
    await pool.execute('DELETE FROM students WHERE id IN (?, ?)', [res1.insertId, res4.insertId]);
  });

  it('generates faculty ID matching ASIN-NNNNNN', async () => {
    const res = await User.createFaculty({
      name: 'Test Faculty Member',
      email: `test_fac_${Date.now()}@psu.edu.ph`,
      password: 'hashed_password',
      department: 'Computer Science',
      verification_token: 'tok_fac',
    });

    assert.match(res.insertId, /^ASIN-\d{6}$/);

    // Clean up test row
    await pool.execute('DELETE FROM faculty WHERE id = ?', [res.insertId]);
  });

  it('respects explicitly provided custom ID when passed', async () => {
    const customStudentId = `99-AS-9999`;
    const res = await User.createStudent({
      id: customStudentId,
      name: 'Custom ID Student',
      email: `test_custom_${Date.now()}@psu.edu.ph`,
      password: 'hashed_password',
      year_level: '1st Year',
      section: 'A',
      department: 'Computer Science',
      verification_token: 'tok_cust',
    });

    assert.equal(res.insertId, customStudentId);

    // Clean up test row
    await pool.execute('DELETE FROM students WHERE id = ?', [customStudentId]);
  });
});

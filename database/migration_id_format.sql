-- ============================================================
-- Run this in phpMyAdmin → SQL tab
-- Converts all Faculty & Student IDs to campus format
-- Faculty:  ASIN-NNNNNN
-- Student:  YY-AS-NNNN
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ══════════════════════════════════════════════════════════════
-- FACULTY: old_id → ASIN-NNNNNN
-- ══════════════════════════════════════════════════════════════

-- 1. Dr. Maria Santos (id = '0')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000001' WHERE faculty_id = '0';
UPDATE evaluations SET faculty_id = 'ASIN-000001' WHERE faculty_id = '0';
UPDATE evaluations SET faculty_id_new = 'ASIN-000001' WHERE faculty_id_new = '0';
UPDATE faculty SET id = 'ASIN-000001' WHERE name = 'Dr. Maria Santos';

-- 2. Prof. Juan Dela Cruz (id = '3')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000002' WHERE faculty_id = '3';
UPDATE evaluations SET faculty_id = 'ASIN-000002' WHERE faculty_id = '3';
UPDATE evaluations SET faculty_id_new = 'ASIN-000002' WHERE faculty_id_new = '3';
UPDATE faculty SET id = 'ASIN-000002' WHERE name = 'Prof. Juan Dela Cruz';

-- 3. Dr. Ana Reyes (id = '6')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000003' WHERE faculty_id = '6';
UPDATE evaluations SET faculty_id = 'ASIN-000003' WHERE faculty_id = '6';
UPDATE evaluations SET faculty_id_new = 'ASIN-000003' WHERE faculty_id_new = '6';
UPDATE faculty SET id = 'ASIN-000003' WHERE name = 'Dr. Ana Reyes';

-- 4. Prof. Carlo Mendoza (id = '7')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000004' WHERE faculty_id = '7';
UPDATE evaluations SET faculty_id = 'ASIN-000004' WHERE faculty_id = '7';
UPDATE evaluations SET faculty_id_new = 'ASIN-000004' WHERE faculty_id_new = '7';
UPDATE faculty SET id = 'ASIN-000004' WHERE name = 'Prof. Carlo Mendoza';

-- 5. Dr. Lisa Garcia (id = '8')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000005' WHERE faculty_id = '8';
UPDATE evaluations SET faculty_id = 'ASIN-000005' WHERE faculty_id = '8';
UPDATE evaluations SET faculty_id_new = 'ASIN-000005' WHERE faculty_id_new = '8';
UPDATE faculty SET id = 'ASIN-000005' WHERE name = 'Dr. Lisa Garcia';

-- 6. Prof. Miguel Torres (id = '9')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000006' WHERE faculty_id = '9';
UPDATE evaluations SET faculty_id = 'ASIN-000006' WHERE faculty_id = '9';
UPDATE evaluations SET faculty_id_new = 'ASIN-000006' WHERE faculty_id_new = '9';
UPDATE faculty SET id = 'ASIN-000006' WHERE name = 'Prof. Miguel Torres';

-- 7. Dr. Patricia Villanueva (id = '10')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000007' WHERE faculty_id = '10';
UPDATE evaluations SET faculty_id = 'ASIN-000007' WHERE faculty_id = '10';
UPDATE evaluations SET faculty_id_new = 'ASIN-000007' WHERE faculty_id_new = '10';
UPDATE faculty SET id = 'ASIN-000007' WHERE name = 'Dr. Patricia Villanueva';

-- 8. Prof. Roberto Aquino (id = '11')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000008' WHERE faculty_id = '11';
UPDATE evaluations SET faculty_id = 'ASIN-000008' WHERE faculty_id = '11';
UPDATE evaluations SET faculty_id_new = 'ASIN-000008' WHERE faculty_id_new = '11';
UPDATE faculty SET id = 'ASIN-000008' WHERE name = 'Prof. Roberto Aquino';

-- 9. Prof. Ricardo Bautista (id = '14')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000009' WHERE faculty_id = '14';
UPDATE evaluations SET faculty_id = 'ASIN-000009' WHERE faculty_id = '14';
UPDATE evaluations SET faculty_id_new = 'ASIN-000009' WHERE faculty_id_new = '14';
UPDATE faculty SET id = 'ASIN-000009' WHERE name = 'Prof. Ricardo Bautista';

-- 10. Dr. Carmen Lim (id = '15')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000010' WHERE faculty_id = '15';
UPDATE evaluations SET faculty_id = 'ASIN-000010' WHERE faculty_id = '15';
UPDATE evaluations SET faculty_id_new = 'ASIN-000010' WHERE faculty_id_new = '15';
UPDATE faculty SET id = 'ASIN-000010' WHERE name = 'Dr. Carmen Lim';

-- 11. Prof. Dennis Pascual (id = '18')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000011' WHERE faculty_id = '18';
UPDATE evaluations SET faculty_id = 'ASIN-000011' WHERE faculty_id = '18';
UPDATE evaluations SET faculty_id_new = 'ASIN-000011' WHERE faculty_id_new = '18';
UPDATE faculty SET id = 'ASIN-000011' WHERE name = 'Prof. Dennis Pascual';

-- 12. Dr. Grace Soriano (id = '19')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000012' WHERE faculty_id = '19';
UPDATE evaluations SET faculty_id = 'ASIN-000012' WHERE faculty_id = '19';
UPDATE evaluations SET faculty_id_new = 'ASIN-000012' WHERE faculty_id_new = '19';
UPDATE faculty SET id = 'ASIN-000012' WHERE name = 'Dr. Grace Soriano';

-- 13. Dr. Elena Magno (id = '22')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000013' WHERE faculty_id = '22';
UPDATE evaluations SET faculty_id = 'ASIN-000013' WHERE faculty_id = '22';
UPDATE evaluations SET faculty_id_new = 'ASIN-000013' WHERE faculty_id_new = '22';
UPDATE faculty SET id = 'ASIN-000013' WHERE name = 'Dr. Elena Magno';

-- 14. Prof. Renato Ibarra (id = '23')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000014' WHERE faculty_id = '23';
UPDATE evaluations SET faculty_id = 'ASIN-000014' WHERE faculty_id = '23';
UPDATE evaluations SET faculty_id_new = 'ASIN-000014' WHERE faculty_id_new = '23';
UPDATE faculty SET id = 'ASIN-000014' WHERE name = 'Prof. Renato Ibarra';

-- 15. Dr. Rosario Dimaculangan (id = '25')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000015' WHERE faculty_id = '25';
UPDATE evaluations SET faculty_id = 'ASIN-000015' WHERE faculty_id = '25';
UPDATE evaluations SET faculty_id_new = 'ASIN-000015' WHERE faculty_id_new = '25';
UPDATE faculty SET id = 'ASIN-000015' WHERE name = 'Dr. Rosario Dimaculangan';

-- 16. Prof. Luisa Manalo (id = '26')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000016' WHERE faculty_id = '26';
UPDATE evaluations SET faculty_id = 'ASIN-000016' WHERE faculty_id = '26';
UPDATE evaluations SET faculty_id_new = 'ASIN-000016' WHERE faculty_id_new = '26';
UPDATE faculty SET id = 'ASIN-000016' WHERE name = 'Prof. Luisa Manalo';

-- 17. Dr. Antonio Evangelista (id = '27')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000017' WHERE faculty_id = '27';
UPDATE evaluations SET faculty_id = 'ASIN-000017' WHERE faculty_id = '27';
UPDATE evaluations SET faculty_id_new = 'ASIN-000017' WHERE faculty_id_new = '27';
UPDATE faculty SET id = 'ASIN-000017' WHERE name = 'Dr. Antonio Evangelista';

-- 18. Prof. Fernando Valdez (id = '29')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000018' WHERE faculty_id = '29';
UPDATE evaluations SET faculty_id = 'ASIN-000018' WHERE faculty_id = '29';
UPDATE evaluations SET faculty_id_new = 'ASIN-000018' WHERE faculty_id_new = '29';
UPDATE faculty SET id = 'ASIN-000018' WHERE name = 'Prof. Fernando Valdez';

-- 19. Dr. Beatriz Salcedo (id = '30')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000019' WHERE faculty_id = '30';
UPDATE evaluations SET faculty_id = 'ASIN-000019' WHERE faculty_id = '30';
UPDATE evaluations SET faculty_id_new = 'ASIN-000019' WHERE faculty_id_new = '30';
UPDATE faculty SET id = 'ASIN-000019' WHERE name = 'Dr. Beatriz Salcedo';

-- 20. Prof. Marco Alejandro (id = '31')
UPDATE faculty_subjects SET faculty_id = 'ASIN-000020' WHERE faculty_id = '31';
UPDATE evaluations SET faculty_id = 'ASIN-000020' WHERE faculty_id = '31';
UPDATE evaluations SET faculty_id_new = 'ASIN-000020' WHERE faculty_id_new = '31';
UPDATE faculty SET id = 'ASIN-000020' WHERE name = 'Prof. Marco Alejandro';


-- ══════════════════════════════════════════════════════════════
-- STUDENTS: old_id → YY-AS-NNNN
-- 4th Year → 23, 3rd Year → 24, 2nd Year → 25, 1st Year → 26
-- ══════════════════════════════════════════════════════════════

-- 4th Year students (23-AS-NNNN)
UPDATE student_subjects SET student_id = '23-AS-0001' WHERE student_id = '4';
UPDATE evaluations SET student_id = '23-AS-0001' WHERE student_id = '4';
UPDATE evaluations SET student_id_new = '23-AS-0001' WHERE student_id_new = '4';
UPDATE students SET id = '23-AS-0001' WHERE name = 'Raymond Heras';

UPDATE student_subjects SET student_id = '23-AS-0002' WHERE student_id = '5';
UPDATE evaluations SET student_id = '23-AS-0002' WHERE student_id = '5';
UPDATE evaluations SET student_id_new = '23-AS-0002' WHERE student_id_new = '5';
UPDATE students SET id = '23-AS-0002' WHERE name = 'Hero Reyes';

UPDATE student_subjects SET student_id = '23-AS-0003' WHERE student_id = '11';
UPDATE evaluations SET student_id = '23-AS-0003' WHERE student_id = '11';
UPDATE evaluations SET student_id_new = '23-AS-0003' WHERE student_id_new = '11';
UPDATE students SET id = '23-AS-0003' WHERE name = 'Mark Len';

UPDATE student_subjects SET student_id = '23-AS-0004' WHERE student_id = '13';
UPDATE evaluations SET student_id = '23-AS-0004' WHERE student_id = '13';
UPDATE evaluations SET student_id_new = '23-AS-0004' WHERE student_id_new = '13';
UPDATE students SET id = '23-AS-0004' WHERE name = 'Jordan Dave Caparas';

UPDATE student_subjects SET student_id = '23-AS-0005' WHERE student_id = '14';
UPDATE evaluations SET student_id = '23-AS-0005' WHERE student_id = '14';
UPDATE evaluations SET student_id_new = '23-AS-0005' WHERE student_id_new = '14';
UPDATE students SET id = '23-AS-0005' WHERE name = 'Junard Chua';

UPDATE student_subjects SET student_id = '23-AS-0006' WHERE student_id = '23';
UPDATE evaluations SET student_id = '23-AS-0006' WHERE student_id = '23';
UPDATE evaluations SET student_id_new = '23-AS-0006' WHERE student_id_new = '23';
UPDATE students SET id = '23-AS-0006' WHERE name = 'Nathan Cruz';

-- 3rd Year students (24-AS-NNNN)
UPDATE student_subjects SET student_id = '24-AS-0001' WHERE student_id = '24';
UPDATE evaluations SET student_id = '24-AS-0001' WHERE student_id = '24';
UPDATE evaluations SET student_id_new = '24-AS-0001' WHERE student_id_new = '24';
UPDATE students SET id = '24-AS-0001' WHERE name = 'Olivia Reyes';

-- 2nd Year students (25-AS-NNNN)
UPDATE student_subjects SET student_id = '25-AS-0001' WHERE student_id = '20';
UPDATE evaluations SET student_id = '25-AS-0001' WHERE student_id = '20';
UPDATE evaluations SET student_id_new = '25-AS-0001' WHERE student_id_new = '20';
UPDATE students SET id = '25-AS-0001' WHERE name = 'Daniel Ramos';

UPDATE student_subjects SET student_id = '25-AS-0002' WHERE student_id = '21';
UPDATE evaluations SET student_id = '25-AS-0002' WHERE student_id = '21';
UPDATE evaluations SET student_id_new = '25-AS-0002' WHERE student_id_new = '21';
UPDATE students SET id = '25-AS-0002' WHERE name = 'Maria Lopez';

UPDATE student_subjects SET student_id = '25-AS-0003' WHERE student_id = '29';
UPDATE evaluations SET student_id = '25-AS-0003' WHERE student_id = '29';
UPDATE evaluations SET student_id_new = '25-AS-0003' WHERE student_id_new = '29';
UPDATE students SET id = '25-AS-0003' WHERE name = 'Alyssa Mendoza';

UPDATE student_subjects SET student_id = '25-AS-0004' WHERE student_id = '30';
UPDATE evaluations SET student_id = '25-AS-0004' WHERE student_id = '30';
UPDATE evaluations SET student_id_new = '25-AS-0004' WHERE student_id_new = '30';
UPDATE students SET id = '25-AS-0004' WHERE name = 'John Michael Rivera';

UPDATE student_subjects SET student_id = '25-AS-0005' WHERE student_id = '36';
UPDATE evaluations SET student_id = '25-AS-0005' WHERE student_id = '36';
UPDATE evaluations SET student_id_new = '25-AS-0005' WHERE student_id_new = '36';
UPDATE students SET id = '25-AS-0005' WHERE name = 'Gabriel Castro';

UPDATE student_subjects SET student_id = '25-AS-0006' WHERE student_id = '41';
UPDATE evaluations SET student_id = '25-AS-0006' WHERE student_id = '41';
UPDATE evaluations SET student_id_new = '25-AS-0006' WHERE student_id_new = '41';
UPDATE students SET id = '25-AS-0006' WHERE name = 'Leo Santiago';

UPDATE student_subjects SET student_id = '25-AS-0007' WHERE student_id = '45';
UPDATE evaluations SET student_id = '25-AS-0007' WHERE student_id = '45';
UPDATE evaluations SET student_id_new = '25-AS-0007' WHERE student_id_new = '45';
UPDATE students SET id = '25-AS-0007' WHERE name = 'Peter Gonzales';

-- 1st Year students (26-AS-NNNN)
UPDATE student_subjects SET student_id = '26-AS-0001' WHERE student_id = '22';
UPDATE evaluations SET student_id = '26-AS-0001' WHERE student_id = '22';
UPDATE evaluations SET student_id_new = '26-AS-0001' WHERE student_id_new = '22';
UPDATE students SET id = '26-AS-0001' WHERE name = 'Paolo Santos';

UPDATE student_subjects SET student_id = '26-AS-0002' WHERE student_id = '31';
UPDATE evaluations SET student_id = '26-AS-0002' WHERE student_id = '31';
UPDATE evaluations SET student_id_new = '26-AS-0002' WHERE student_id_new = '31';
UPDATE students SET id = '26-AS-0002' WHERE name = 'Bianca Torres';

UPDATE student_subjects SET student_id = '26-AS-0003' WHERE student_id = '37';
UPDATE evaluations SET student_id = '26-AS-0003' WHERE student_id = '37';
UPDATE evaluations SET student_id_new = '26-AS-0003' WHERE student_id_new = '37';
UPDATE students SET id = '26-AS-0003' WHERE name = 'Hannah Salazar';

UPDATE student_subjects SET student_id = '26-AS-0004' WHERE student_id = '106';
UPDATE evaluations SET student_id = '26-AS-0004' WHERE student_id = '106';
UPDATE evaluations SET student_id_new = '26-AS-0004' WHERE student_id_new = '106';
UPDATE students SET id = '26-AS-0004' WHERE name = 'Arjay Kasam';

SET FOREIGN_KEY_CHECKS = 1;

-- Verify
SELECT id, name, department FROM faculty ORDER BY id;
SELECT id, name, year_level, department FROM students ORDER BY id;

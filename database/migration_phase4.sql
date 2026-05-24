-- =============================================================
-- Phase 4 Migration: Direct Student-Faculty Linkages in Assignments
-- Run this on your EXISTING faculty_evaluation_db database
-- =============================================================

DELIMITER $$

CREATE PROCEDURE RunPhase4Migration()
BEGIN
    -- 1. Add student_id to faculty_subjects if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
          AND table_name = 'faculty_subjects' 
          AND column_name = 'student_id'
    ) THEN
        ALTER TABLE `faculty_subjects`
          ADD COLUMN `student_id` int(11) DEFAULT NULL AFTER `subject_id`,
          ADD CONSTRAINT `fk_faculty_subjects_student`
            FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE;
    END IF;

    -- 2. Add faculty_id to student_subjects if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
          AND table_name = 'student_subjects' 
          AND column_name = 'faculty_id'
    ) THEN
        ALTER TABLE `student_subjects`
          ADD COLUMN `faculty_id` int(11) DEFAULT NULL AFTER `subject_id`,
          ADD CONSTRAINT `fk_student_subjects_faculty`
            FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`id`) ON DELETE CASCADE;
    END IF;

    -- 3. Drop the old unique constraint on faculty_subjects if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
          AND table_name = 'faculty_subjects' 
          AND index_name = 'unique_faculty_subject'
    ) THEN
        ALTER TABLE `faculty_subjects` DROP INDEX `unique_faculty_subject`;
    END IF;

    -- 4. Add updated unique key if it does not exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
          AND table_name = 'faculty_subjects' 
          AND index_name = 'unique_faculty_subject_student'
    ) THEN
        ALTER TABLE `faculty_subjects` ADD UNIQUE KEY `unique_faculty_subject_student` (`faculty_id`, `subject_id`, `student_id`);
    END IF;
END$$

DELIMITER ;

-- Execute the stored procedure
CALL RunPhase4Migration();
-- Clean up the temporary procedure
DROP PROCEDURE RunPhase4Migration;

-- 5. Populate faculty_id in student_subjects by joining on subject_id
UPDATE `student_subjects` ss
INNER JOIN `faculty_subjects` fs ON ss.subject_id = fs.subject_id
SET ss.faculty_id = fs.faculty_id;

-- 6. Populate student_id in existing general faculty_subjects entries
UPDATE `faculty_subjects` fs
INNER JOIN `student_subjects` ss ON fs.subject_id = ss.subject_id
SET fs.student_id = ss.student_id
WHERE fs.student_id IS NULL;

-- 7. Insert new linkage rows in faculty_subjects for any other students taking the same subjects
INSERT INTO `faculty_subjects` (`faculty_id`, `subject_id`, `student_id`, `section`, `year_level`, `semester`)
SELECT fs.faculty_id, fs.subject_id, ss.student_id, fs.section, fs.year_level, fs.semester
FROM `faculty_subjects` fs
INNER JOIN `student_subjects` ss ON fs.subject_id = ss.subject_id
ON DUPLICATE KEY UPDATE `faculty_subjects`.`faculty_id` = `faculty_subjects`.`faculty_id`;

-- Verify the changes
SELECT 'Phase 4 migration complete with data population.' AS status;
DESCRIBE `faculty_subjects`;
DESCRIBE `student_subjects`;

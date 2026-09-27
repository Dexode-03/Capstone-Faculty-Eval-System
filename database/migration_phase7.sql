-- =============================================================
-- Phase 7 Migration: Convert student/faculty IDs to VARCHAR
-- Run this on your EXISTING faculty_evaluation_db database after phase 6.
-- Existing numeric IDs are preserved as string values.
-- =============================================================

DELIMITER $$

CREATE PROCEDURE DropForeignKeysForColumn(
  IN in_table_name VARCHAR(64),
  IN in_column_name VARCHAR(64)
)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE fk_name VARCHAR(64);

  DECLARE fk_cursor CURSOR FOR
    SELECT constraint_name
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE table_schema = DATABASE()
      AND table_name = in_table_name
      AND column_name = in_column_name
      AND referenced_table_name IS NOT NULL;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN fk_cursor;

  read_loop: LOOP
    FETCH fk_cursor INTO fk_name;
    IF done THEN
      LEAVE read_loop;
    END IF;

    SET @drop_fk_sql = CONCAT('ALTER TABLE `', in_table_name, '` DROP FOREIGN KEY `', fk_name, '`');
    PREPARE drop_fk_stmt FROM @drop_fk_sql;
    EXECUTE drop_fk_stmt;
    DEALLOCATE PREPARE drop_fk_stmt;
  END LOOP;

  CLOSE fk_cursor;
END$$

CREATE PROCEDURE ModifyColumnIfExists(
  IN in_table_name VARCHAR(64),
  IN in_column_name VARCHAR(64),
  IN in_column_definition VARCHAR(255)
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = in_table_name
      AND column_name = in_column_name
  ) THEN
    SET @modify_sql = CONCAT('ALTER TABLE `', in_table_name, '` MODIFY `', in_column_name, '` ', in_column_definition);
    PREPARE modify_stmt FROM @modify_sql;
    EXECUTE modify_stmt;
    DEALLOCATE PREPARE modify_stmt;
  END IF;
END$$

CREATE PROCEDURE AddForeignKeyIfMissing(
  IN in_table_name VARCHAR(64),
  IN in_constraint_name VARCHAR(64),
  IN in_column_name VARCHAR(64),
  IN in_referenced_table VARCHAR(64),
  IN in_referenced_column VARCHAR(64),
  IN in_delete_rule VARCHAR(32)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE table_schema = DATABASE()
      AND table_name = in_table_name
      AND constraint_name = in_constraint_name
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    SET @add_fk_sql = CONCAT(
      'ALTER TABLE `', in_table_name, '` ADD CONSTRAINT `', in_constraint_name,
      '` FOREIGN KEY (`', in_column_name, '`) REFERENCES `', in_referenced_table,
      '`(`', in_referenced_column, '`) ON DELETE ', in_delete_rule
    );
    PREPARE add_fk_stmt FROM @add_fk_sql;
    EXECUTE add_fk_stmt;
    DEALLOCATE PREPARE add_fk_stmt;
  END IF;
END$$

DELIMITER ;

CALL DropForeignKeysForColumn('evaluations', 'student_id');
CALL DropForeignKeysForColumn('evaluations', 'faculty_id');
CALL DropForeignKeysForColumn('faculty_subjects', 'faculty_id');
CALL DropForeignKeysForColumn('faculty_subjects', 'student_id');
CALL DropForeignKeysForColumn('student_subjects', 'student_id');
CALL DropForeignKeysForColumn('student_subjects', 'faculty_id');

CALL ModifyColumnIfExists('students', 'id', 'varchar(36) NOT NULL');
CALL ModifyColumnIfExists('faculty', 'id', 'varchar(36) NOT NULL');

CALL ModifyColumnIfExists('evaluations', 'student_id', 'varchar(36) NOT NULL');
CALL ModifyColumnIfExists('evaluations', 'faculty_id', 'varchar(36) NOT NULL');
CALL ModifyColumnIfExists('evaluations', 'student_id_new', 'varchar(36) DEFAULT NULL');
CALL ModifyColumnIfExists('evaluations', 'faculty_id_new', 'varchar(36) DEFAULT NULL');

CALL ModifyColumnIfExists('faculty_subjects', 'faculty_id', 'varchar(36) NOT NULL');
CALL ModifyColumnIfExists('faculty_subjects', 'student_id', 'varchar(36) DEFAULT NULL');

CALL ModifyColumnIfExists('student_subjects', 'student_id', 'varchar(36) NOT NULL');
CALL ModifyColumnIfExists('student_subjects', 'faculty_id', 'varchar(36) DEFAULT NULL');

CALL AddForeignKeyIfMissing('evaluations', 'fk_evaluations_student_varchar', 'student_id', 'students', 'id', 'CASCADE');
CALL AddForeignKeyIfMissing('evaluations', 'fk_evaluations_faculty_varchar', 'faculty_id', 'faculty', 'id', 'CASCADE');
CALL AddForeignKeyIfMissing('faculty_subjects', 'fk_faculty_subjects_faculty_varchar', 'faculty_id', 'faculty', 'id', 'CASCADE');
CALL AddForeignKeyIfMissing('student_subjects', 'fk_student_subjects_student_varchar', 'student_id', 'students', 'id', 'CASCADE');
CALL AddForeignKeyIfMissing('student_subjects', 'fk_student_subjects_faculty_varchar', 'faculty_id', 'faculty', 'id', 'SET NULL');

DROP PROCEDURE AddForeignKeyIfMissing;
DROP PROCEDURE ModifyColumnIfExists;
DROP PROCEDURE DropForeignKeysForColumn;

SELECT 'Phase 7 migration complete: student and faculty IDs are now VARCHAR(36).' AS status;

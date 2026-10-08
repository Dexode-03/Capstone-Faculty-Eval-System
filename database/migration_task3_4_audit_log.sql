-- ============================================================================
-- Migration: Task 3.4 - Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_role` VARCHAR(20) NOT NULL,
  `actor_id` VARCHAR(100) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `target` VARCHAR(255) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_actor` (`actor_role`, `actor_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

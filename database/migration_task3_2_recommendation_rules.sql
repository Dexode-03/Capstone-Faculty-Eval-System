-- ============================================================================
-- Migration: Task 3.2 - recommendation_rules Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS `recommendation_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `theme` VARCHAR(100) NOT NULL,
  `rule_type` ENUM('strength', 'weakness', 'rating', 'sentiment') NOT NULL DEFAULT 'weakness',
  `keywords` TEXT DEFAULT NULL COMMENT 'Comma-separated keywords (English + Filipino)',
  `metric` VARCHAR(50) DEFAULT 'keyword' COMMENT 'keyword, rating, sentiment_negative_pct, sentiment_positive_pct',
  `operator` ENUM('<', '<=', '=', '>=', '>', 'contains') NOT NULL DEFAULT 'contains',
  `threshold` DECIMAL(5, 2) DEFAULT NULL,
  `recommendation_text` TEXT NOT NULL,
  `severity` ENUM('low', 'medium', 'high', 'positive') NOT NULL DEFAULT 'medium',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rec_rules_active` (`is_active`),
  INDEX `idx_rec_rules_type` (`rule_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Seed Initial Recommendation Rules matching hardcoded sentimentAnalyzer.js
-- ============================================================================

-- 1. Rating-based rules
INSERT INTO `recommendation_rules`
  (`theme`, `rule_type`, `keywords`, `metric`, `operator`, `threshold`, `recommendation_text`, `severity`, `is_active`)
VALUES
  ('Rating', 'rating', NULL, 'rating', '<', 2.50,
   'Overall rating is critically low ({rating}/5). Immediate faculty development intervention is recommended, including a review of teaching methodology and classroom engagement.',
   'high', 1),
  ('Rating', 'rating', NULL, 'rating', '<', 3.50,
   'Rating of {rating}/5 is below satisfactory. Focus on specific areas flagged in student feedback and consider peer mentoring from higher-rated colleagues.',
   'medium', 1),
  ('Rating', 'rating', NULL, 'rating', '<', 4.50,
   'Rating of {rating}/5 is good. Minor refinements based on student feedback can push performance to excellent.',
   'low', 1),
  ('Rating', 'rating', NULL, 'rating', '>=', 4.50,
   'Excellent overall rating ({rating}/5). This faculty member is a strong candidate for mentoring roles and teaching excellence recognition.',
   'positive', 1);

-- 2. Sentiment-based rules
INSERT INTO `recommendation_rules`
  (`theme`, `rule_type`, `keywords`, `metric`, `operator`, `threshold`, `recommendation_text`, `severity`, `is_active`)
VALUES
  ('Sentiment Negative', 'sentiment', NULL, 'sentiment_negative_pct', '>', 40.00,
   'High high-probability negative sentiment detected ({negative_pct}%). A structured faculty development plan and follow-up evaluation within the semester is strongly recommended.',
   'high', 1),
  ('Sentiment Negative', 'sentiment', NULL, 'sentiment_negative_pct', '>', 20.00,
   'Moderate high-probability negative sentiment present ({negative_pct}%). Review recurring complaints in student feedback and address specific concerns raised.',
   'medium', 1),
  ('Sentiment Positive', 'sentiment', NULL, 'sentiment_positive_pct', '>', 70.00,
   'Strong high-probability positive sentiment trend ({positive_pct}%). Consider nominating this faculty for teaching awards or a leadership role in curriculum development.',
   'positive', 1);

-- 3. Weakness keyword-based rules
INSERT INTO `recommendation_rules`
  (`theme`, `rule_type`, `keywords`, `metric`, `operator`, `threshold`, `recommendation_text`, `severity`, `is_active`)
VALUES
  ('Clarity', 'weakness', 'unclear, confusing, labo, malabo', 'keyword', 'contains', NULL,
   'Clarity concerns detected. Suggest using more concrete examples, visual aids, and step-by-step explanations during lectures.',
   'medium', 1),
  ('Pacing', 'weakness', 'fast, rushed, bilis, pacing', 'keyword', 'contains', NULL,
   'Pacing issues identified. Recommend incorporating structured pauses, comprehension checks, and allowing more time for student questions.',
   'medium', 1),
  ('Engagement', 'weakness', 'boring, monotone, unengaging, nakakaantok', 'keyword', 'contains', NULL,
   'Student engagement is low. Recommend incorporating interactive activities, group discussions, and varied instructional methods.',
   'medium', 1),
  ('Punctuality', 'weakness', 'late, absent, laging', 'keyword', 'contains', NULL,
   'Attendance and punctuality concerns noted. Faculty should ensure consistent class schedules and timely communication of any cancellations.',
   'high', 1),
  ('Grading', 'weakness', 'grading, grades, feedback, tagal', 'keyword', 'contains', NULL,
   'Grading and feedback timeliness was mentioned. Ensure evaluations are returned promptly with constructive comments to support student improvement.',
   'medium', 1),
  ('Fairness', 'weakness', 'unfair, bias, favoritism', 'keyword', 'contains', NULL,
   'Fairness concerns raised by students. Review grading criteria transparency and ensure equal treatment of all students.',
   'high', 1),
  ('Respect', 'weakness', 'rude, bastos, masungit, disrespectful', 'keyword', 'contains', NULL,
   'Professionalism concerns raised. Faculty should foster a respectful and inclusive learning environment at all times.',
   'high', 1);

-- 4. Strength keyword-based rules
INSERT INTO `recommendation_rules`
  (`theme`, `rule_type`, `keywords`, `metric`, `operator`, `threshold`, `recommendation_text`, `severity`, `is_active`)
VALUES
  ('Supportiveness', 'strength', 'helpful, approachable, supportive, mabait, maalaga', 'keyword', 'contains', NULL,
   'Students consistently appreciate the supportive and approachable teaching style. Maintain this student-centered approach.',
   'positive', 1),
  ('Expertise', 'strength', 'knowledgeable, expert, magaling, galing, husay', 'keyword', 'contains', NULL,
   'Strong subject matter expertise recognized. Consider sharing best practices through department-level knowledge sharing sessions.',
   'positive', 1),
  ('Organization', 'strength', 'organized, prepared, structured', 'keyword', 'contains', NULL,
   'Students noted strong organization and preparedness. This is a key strength that positively impacts learning outcomes.',
   'positive', 1),
  ('Engagement', 'strength', 'engaging, interactive, fun, masaya, saya, enjoy', 'keyword', 'contains', NULL,
   'High student engagement observed. The use of interactive and varied teaching methods is contributing to positive learning experiences.',
   'positive', 1),
  ('Clarity', 'strength', 'clear, linaw', 'keyword', 'contains', NULL,
   'Clear and effective communication is a notable strength. Continue using examples and structured explanations.',
   'positive', 1);

# Data Privacy Compliance Documentation

> Faculty Evaluation System (FEFAS) — Pangasinan State University  
> Last Updated: October 2026

## 1. Legal Framework

This system operates in compliance with **Republic Act No. 10173** (Data Privacy Act of 2012) and its Implementing Rules and Regulations (IRR). The National Privacy Commission (NPC) serves as the regulatory authority for data privacy matters in the Philippines.

---

## 2. Data Classification

### 2.1 Personal Information Collected

| Data Category | Fields | Sensitivity |
|---|---|---|
| **Account Data** | Name, student/employee ID, email, department, role | Personal |
| **Authentication Data** | Password hash (bcrypt), JWT session tokens | Sensitive |
| **Evaluation Responses** | Numerical ratings (1–5 scale), written comments | Personal |
| **Consent Records** | User ID, role, consent version, IP address, timestamp | Personal |
| **Audit Logs** | Action type, user ID, timestamp, description | Operational |

### 2.2 Data NOT Collected

- Biometric data
- Financial information
- Social media profiles
- Device fingerprints or tracking cookies

---

## 3. Anonymity Safeguards

The system enforces strict anonymity protections to ensure evaluation integrity:

### 3.1 Student Identity Protection

- **Reports & Exports**: Student identifiers (`student_id`, name, email) are **completely excluded** from all generated reports, PDF exports, and Excel exports.
- **Minimum Response Threshold**: Written comments and qualitative recommendations are only included in reports when at least **5 evaluations** have been submitted for a given faculty-subject combination. This prevents identification through small sample sizes.
- **Faculty Access**: Faculty members can only view aggregated scores and anonymized comments. They **cannot** see which students submitted which evaluations.

### 3.2 Implementation Details

```
// Export safeguards (backend/controllers/evaluationController.js)
const MIN_EVALUATION_THRESHOLD = 5;

// Fields excluded from ALL exports:
// - student_id
// - student_name  
// - student_email
```

---

## 4. Data Retention Policy

| Data Type | Retention Period | Deletion Method |
|---|---|---|
| Evaluation Responses | Academic period + 5 years | Admin bulk clear or manual deletion |
| Account Information | Enrollment/employment duration + 1 year | Account deactivation |
| Consent Records | Evaluation data retention + 1 year | Cascaded with account |
| Audit Logs | 3 years from creation | Automated purge |
| Authentication Data | Until account deactivation | Immediate on deactivation |
| JWT Sessions | 8 hours (configurable via `JWT_EXPIRES_IN`) | Automatic expiry |

### 4.1 Bulk Data Clearing

Administrators can perform bulk clearing of evaluation data through the system's administrative interface. This action:
- Permanently deletes all evaluation responses for a selected academic period
- Is logged in the audit trail
- Cannot be reversed

---

## 5. Access Controls

### 5.1 Role-Based Access

| Role | Data Access |
|---|---|
| **Student** | Own submissions only; evaluation form; consent status |
| **Faculty** | Own evaluation reports (anonymized); no access to student identities |
| **Admin** | All evaluation data; account management; system configuration; audit logs |

### 5.2 Authentication Security

- Passwords: minimum 8 characters, must contain both letters and numbers
- Password hashing: bcrypt with salt rounds
- Session tokens: JWT with configurable expiration (default: 8 hours)
- Automatic session invalidation on 401 responses
- No plaintext password storage or transmission

---

## 6. Consent Management

### 6.1 Consent Flow

1. Student logs in and navigates to submit an evaluation
2. System checks `privacy_consents` table for existing consent record
3. If no record exists, a **Privacy Consent Modal** is displayed
4. Student reads the data privacy notice and must explicitly check the agreement checkbox
5. Consent is recorded with: user ID, role, consent version, IP address, and timestamp
6. Subsequent evaluations do not re-prompt (one-time consent per user)

### 6.2 Consent Independence

Consent records are stored in a **separate table** (`privacy_consents`) and are **not tied to evaluation content**. This ensures:
- Consent can be verified independently of evaluation data
- Evaluation responses cannot be linked to consent records by external parties
- Consent withdrawal does not automatically delete evaluation data (handled separately)

### 6.3 Database Schema

```sql
CREATE TABLE privacy_consents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_role VARCHAR(20) NOT NULL DEFAULT 'student',
  consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
  ip_address VARCHAR(45) NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_consent (user_id, user_role)
);
```

---

## 7. Data Subject Rights Procedures

### 7.1 Right to Access

**How to exercise:** Submit a written request to the DPO via email.  
**Response time:** Within 15 business days.  
**Output:** Summary of personal data held, including account information and evaluation activity count (not content, to preserve anonymity of other respondents).

### 7.2 Right to Rectification

**How to exercise:** Submit a written request specifying the data to be corrected.  
**Scope:** Account information (name, email, department). Evaluation responses cannot be modified after submission to maintain evaluation integrity.  
**Response time:** Within 10 business days.

### 7.3 Right to Erasure

**How to exercise:** Submit a written request to the DPO.  
**Scope:** 
- Account data: Fully deleted upon request
- Evaluation data: Deleted if not yet aggregated; if already anonymized in reports, only identifiable links are severed  
- Consent records: Retained for compliance audit trail (anonymized)  
**Response time:** Within 15 business days.

### 7.4 Right to Object / Withdraw Consent

**How to exercise:** Submit a written request to the DPO.  
**Effect:** Student will no longer be prompted to evaluate. Existing evaluations are retained unless erasure is also requested.  
**Response time:** Within 5 business days.

### 7.5 Right to Data Portability

**How to exercise:** Submit a written request specifying the desired format.  
**Available formats:** JSON, CSV  
**Scope:** Account information and evaluation submission dates (not content, to protect evaluation anonymity).  
**Response time:** Within 15 business days.

---

## 8. Security Incident Response

In the event of a data breach:

1. **Detection & Containment** — Identify scope, isolate affected systems
2. **Assessment** — Determine sensitivity of exposed data and number of affected individuals
3. **Notification** — Notify the National Privacy Commission (NPC) within 72 hours if sensitive personal information is involved
4. **Communication** — Inform affected data subjects within a reasonable period
5. **Remediation** — Implement corrective measures and update security controls
6. **Documentation** — Record the incident in the audit log and maintain incident report

---

## 9. Contact Information

**Data Protection Officer**  
Pangasinan State University  
Email: dpo@psu.edu.ph  
Phone: (075) 123-4567  
Address: Lingayen, Pangasinan

**National Privacy Commission**  
Website: https://www.privacy.gov.ph  
Email: info@privacy.gov.ph

---

## 10. API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/auth/consent/status` | Check if user has accepted privacy policy | Yes |
| `POST` | `/api/auth/consent/accept` | Record privacy consent acceptance | Yes |

### Request/Response Examples

**Check consent status:**
```
GET /api/auth/consent/status
Authorization: Bearer <jwt_token>

Response:
{
  "hasConsented": true,
  "consentDate": "2026-10-16T15:30:00.000Z",
  "consentVersion": "1.0"
}
```

**Accept consent:**
```
POST /api/auth/consent/accept
Authorization: Bearer <jwt_token>
Content-Type: application/json

{ "consentVersion": "1.0" }

Response:
{
  "message": "Privacy consent recorded successfully.",
  "hasConsented": true,
  "consentVersion": "1.0"
}
```

---

## 11. File Reference

| File | Purpose |
|---|---|
| `backend/models/PrivacyConsent.js` | Database model for consent records |
| `backend/controllers/privacyConsentController.js` | API controller for consent endpoints |
| `backend/routes/authRoutes.js` | Route registration for consent endpoints |
| `frontend/src/components/PrivacyConsentModal.jsx` | Consent modal UI component |
| `frontend/src/pages/Privacy.jsx` | Public privacy policy page |
| `frontend/src/pages/EvaluationForm.jsx` | Consent check integration point |

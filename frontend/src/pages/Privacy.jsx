import { HiShieldCheck, HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi';

const Privacy = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-psu-primary/10 flex items-center justify-center">
          <HiShieldCheck className="h-5 w-5 text-psu-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-psu-text tracking-tight">Privacy Policy</h1>
          <p className="text-[12px] text-psu-muted">Faculty Evaluation System — Data Privacy Compliance</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1 */}
        <section className="bg-white border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">1. Legal Basis</h2>
          <p className="text-[13px] text-psu-text leading-relaxed">
            The Pangasinan State University Faculty Evaluation System (FEFAS) processes personal data in
            compliance with <strong>Republic Act No. 10173</strong>, also known as the <em>Data Privacy Act of 2012</em>,
            and its Implementing Rules and Regulations (IRR). Data collection is performed under the
            legitimate interest of the educational institution to improve academic instruction quality.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-white border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">2. Data Collected</h2>
          <div className="text-[13px] text-psu-text leading-relaxed space-y-2">
            <p>The system collects and processes the following personal data:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Account Information:</strong> Name, student/employee ID, email address, department, and role.</li>
              <li><strong>Evaluation Responses:</strong> Numerical ratings and written comments (strengths/weaknesses).</li>
              <li><strong>Consent Records:</strong> Timestamp and IP address of privacy consent acceptance.</li>
              <li><strong>Authentication Data:</strong> Hashed passwords (bcrypt) and session tokens (JWT).</li>
              <li><strong>Audit Logs:</strong> Record of system activities for security monitoring.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-white border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">3. Purpose of Processing</h2>
          <div className="text-[13px] text-psu-text leading-relaxed space-y-2">
            <p>Personal data is processed exclusively for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Facilitating faculty performance evaluation by enrolled students.</li>
              <li>Generating aggregated, anonymized analytics and reports for academic improvement.</li>
              <li>Producing recommendations for faculty professional development.</li>
              <li>Maintaining system security and access control integrity.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="bg-white border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">4. Anonymity and Confidentiality</h2>
          <div className="text-[13px] text-psu-text leading-relaxed space-y-2">
            <p>Strong anonymity safeguards are implemented:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Student identities are <strong>never disclosed</strong> to evaluated faculty members.</li>
              <li>Reports and exports completely <strong>exclude student identifiers</strong> (IDs, names, emails).</li>
              <li>Written comments are only included in reports when the <strong>minimum response threshold</strong> of 5 evaluations is met, preventing identification through small sample sizes.</li>
              <li>Sentiment analysis results are aggregated and cannot be traced to individual respondents.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="bg-white border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">5. Data Retention</h2>
          <div className="text-[13px] text-psu-text leading-relaxed space-y-2">
            <p>Evaluation data is retained according to the following schedule:</p>
            <div className="overflow-x-auto">
              <table className="w-full border border-psu-border rounded-lg overflow-hidden text-[12px] mt-2">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-psu-muted border-b border-psu-border">Data Type</th>
                  <th className="text-left px-4 py-2 font-medium text-psu-muted border-b border-psu-border">Retention Period</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-psu-border">
                  <td className="px-4 py-2">Evaluation Responses</td>
                  <td className="px-4 py-2">Duration of academic period + 5 years</td>
                </tr>
                <tr className="border-b border-psu-border">
                  <td className="px-4 py-2">Account Information</td>
                  <td className="px-4 py-2">Duration of enrollment/employment + 1 year</td>
                </tr>
                <tr className="border-b border-psu-border">
                  <td className="px-4 py-2">Consent Records</td>
                  <td className="px-4 py-2">Duration of evaluation data retention + 1 year</td>
                </tr>
                <tr className="border-b border-psu-border">
                  <td className="px-4 py-2">Audit Logs</td>
                  <td className="px-4 py-2">3 years from creation</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Authentication Data</td>
                  <td className="px-4 py-2">Deleted upon account deactivation</td>
                </tr>
              </tbody>
            </table>
          </div>
            <p className="text-[12px] text-psu-muted mt-2">
              Administrators may perform bulk data clearing at the end of an academic cycle through the system&apos;s
              administrative controls. Cleared data is permanently deleted and cannot be recovered.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="bg-white border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">6. Data Subject Rights</h2>
          <div className="text-[13px] text-psu-text leading-relaxed space-y-2">
            <p>Under RA 10173, you have the following rights:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Right to Be Informed:</strong> You have the right to know how your data is collected, processed, and stored.</li>
              <li><strong>Right to Access:</strong> You may request a copy of your personal data held in the system.</li>
              <li><strong>Right to Object:</strong> You may refuse or withdraw consent at any time.</li>
              <li><strong>Right to Erasure:</strong> You may request deletion of your personal data, subject to legitimate retention requirements.</li>
              <li><strong>Right to Rectification:</strong> You may request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Data Portability:</strong> You may request your data in a commonly used electronic format.</li>
              <li><strong>Right to File a Complaint:</strong> You may file a complaint with the National Privacy Commission (NPC).</li>
            </ul>
          </div>
        </section>

        {/* Section 7 */}
        <section className="bg-white border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">7. Data Deletion Procedure</h2>
          <div className="text-[13px] text-psu-text leading-relaxed space-y-2">
            <p>To request deletion of your personal data:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Submit a written request to the Data Protection Officer (DPO) via email.</li>
              <li>Include your full name, student/employee ID, and specify the data you wish to be deleted.</li>
              <li>The DPO will verify your identity and process the request within 15 business days.</li>
              <li>You will receive written confirmation once the deletion has been completed.</li>
            </ol>
            <p className="text-[12px] text-psu-muted mt-2">
              Note: Deletion of evaluation data may be limited if it has already been anonymized and aggregated
              into reports. In such cases, only your identifiable personal data will be removed.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="bg-white border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">8. Security Measures</h2>
          <div className="text-[13px] text-psu-text leading-relaxed space-y-2">
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>All data transmitted between client and server is encrypted using HTTPS/TLS.</li>
              <li>Passwords are hashed using bcrypt with salted rounds before storage.</li>
              <li>Authentication uses JSON Web Tokens (JWT) with configurable expiration (default 8 hours).</li>
              <li>Role-based access control ensures users can only access authorized resources.</li>
              <li>All administrative actions are logged in the audit trail.</li>
              <li>Database access is restricted to application-level service accounts.</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-br from-psu-primary/5 to-psu-secondary/5 border border-psu-border rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-psu-text mb-3">9. Contact Information</h2>
          <p className="text-[13px] text-psu-text leading-relaxed mb-4">
            For questions, concerns, or requests related to your data privacy rights, please contact:
          </p>
          <div className="space-y-2 text-[13px]">
            <div className="flex items-center gap-2 text-psu-text">
              <HiMail className="h-4 w-4 text-psu-primary flex-shrink-0" />
              <span>Data Protection Officer — <strong>dpo@psu.edu.ph</strong></span>
            </div>
            <div className="flex items-center gap-2 text-psu-text">
              <HiPhone className="h-4 w-4 text-psu-primary flex-shrink-0" />
              <span>(075) 123-4567</span>
            </div>
            <div className="flex items-center gap-2 text-psu-text">
              <HiLocationMarker className="h-4 w-4 text-psu-primary flex-shrink-0" />
              <span>Pangasinan State University, Lingayen, Pangasinan</span>
            </div>
          </div>
        </section>

        {/* Footer note */}
        <p className="text-[11px] text-psu-muted text-center py-4">
          This privacy policy was last updated on October 2026. The university reserves the right to
          update this policy as needed to comply with evolving legal and regulatory requirements.
        </p>
      </div>
    </div>
  );
};

export default Privacy;

import { useState } from 'react';
import { HiShieldCheck, HiExternalLink } from 'react-icons/hi';

/**
 * PrivacyConsentModal
 * Shown once per student before their first evaluation.
 * Records acceptance independently of evaluation content.
 *
 * Props:
 *   onAccept  – callback after consent is successfully recorded
 *   onDecline – callback if student declines (navigates away)
 */
const PrivacyConsentModal = ({ onAccept, onDecline }) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await onAccept();
    } catch {
      // Parent handles errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop — no click-to-dismiss so students must explicitly choose */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl border border-psu-border shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-psu-primary to-psu-secondary px-6 py-5 flex items-center gap-3">
          <HiShieldCheck className="h-7 w-7 text-white/90 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Data Privacy Notice</h2>
            <p className="text-[12px] text-white/70">Republic Act No. 10173 — Data Privacy Act of 2012</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
          <p className="text-[13px] text-psu-text leading-relaxed mb-4">
            In accordance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, the Pangasinan State University
            Faculty Evaluation System collects and processes your evaluation responses for the sole purpose of
            <strong> improving the quality of academic instruction</strong>.
          </p>

          <div className="bg-gray-50 border border-psu-border rounded-lg p-4 mb-4 space-y-3">
            <h3 className="text-[12px] font-semibold text-psu-muted uppercase tracking-wider">What We Collect</h3>
            <ul className="text-[12px] text-psu-text space-y-1.5 list-disc list-inside">
              <li>Your numerical ratings for each evaluation question</li>
              <li>Your written comments on strengths and areas for improvement</li>
              <li>A record that you consented to this notice (date and IP address)</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-psu-border rounded-lg p-4 mb-4 space-y-3">
            <h3 className="text-[12px] font-semibold text-psu-muted uppercase tracking-wider">How Your Data Is Protected</h3>
            <ul className="text-[12px] text-psu-text space-y-1.5 list-disc list-inside">
              <li><strong>Anonymity:</strong> Your identity is never revealed to faculty or in reports.</li>
              <li><strong>Minimum threshold:</strong> Comments are only visible in reports when at least 5 evaluations exist.</li>
              <li><strong>Access controls:</strong> Only authorized administrators can view raw evaluation data.</li>
              <li><strong>Secure storage:</strong> All data is encrypted in transit and stored securely.</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-psu-border rounded-lg p-4 mb-4 space-y-3">
            <h3 className="text-[12px] font-semibold text-psu-muted uppercase tracking-wider">Your Rights</h3>
            <ul className="text-[12px] text-psu-text space-y-1.5 list-disc list-inside">
              <li>Right to be informed about how your data is processed</li>
              <li>Right to access your personal data held by the system</li>
              <li>Right to object or withdraw consent</li>
              <li>Right to erasure or correction of inaccurate data</li>
            </ul>
          </div>

          <p className="text-[12px] text-psu-muted leading-relaxed">
            For more details, please review our{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-psu-primary hover:underline inline-flex items-center gap-0.5"
            >
              full Privacy Policy <HiExternalLink className="h-3 w-3" />
            </a>
            . You may contact the Data Protection Officer for questions or to exercise your data rights.
          </p>
        </div>

        {/* Agreement checkbox + actions */}
        <div className="px-6 py-4 border-t border-psu-border bg-gray-50/60">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-psu-primary focus:ring-psu-primary"
            />
            <span className="text-[12px] text-psu-text leading-relaxed">
              I have read and understood the Data Privacy Notice. I consent to the collection and processing
              of my evaluation data as described above.
            </span>
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onDecline}
              disabled={loading}
              className="border border-psu-border text-psu-muted rounded-lg px-4 py-2 text-[13px] font-medium hover:text-psu-text hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!agreed || loading}
              className="bg-psu-primary text-white rounded-lg px-5 py-2 text-[13px] font-semibold hover:bg-psu-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Recording...' : 'I Agree & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;

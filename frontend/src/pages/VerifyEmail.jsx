import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import authService from '../services/authService';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-psu-background px-4">
      <div className="w-full max-w-sm text-center">
        {status === 'verifying' && (
          <>
            <div className="w-6 h-6 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-xl font-semibold text-psu-text tracking-tight">Verifying email</h1>
            <p className="text-[13px] text-psu-muted mt-2">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-10 h-10 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-psu-text tracking-tight">Email verified</h1>
            <p className="text-[13px] text-psu-muted mt-2">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-8 bg-psu-primary text-white px-6 py-2.5 text-[13px] font-medium tracking-wide hover:bg-psu-secondary transition-colors"
            >
              Continue to sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-10 h-10 border-2 border-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-psu-text tracking-tight">Verification failed</h1>
            <p className="text-[13px] text-psu-muted mt-2">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-8 bg-psu-primary text-white px-6 py-2.5 text-[13px] font-medium tracking-wide hover:bg-psu-secondary transition-colors"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

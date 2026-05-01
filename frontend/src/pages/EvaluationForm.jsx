import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiArrowRight, HiX } from 'react-icons/hi';
import useAuth from '../hooks/useAuth';
import facultyService from '../services/facultyService';
import evaluationService from '../services/evaluationService';

// ── Rating scale definition (matches PSU form) ────────────────────
const RATING_SCALE = [
  { value: 5, label: 'Always manifested',       short: '5' },
  { value: 4, label: 'Often manifested',         short: '4' },
  { value: 3, label: 'Sometimes manifested',     short: '3' },
  { value: 2, label: 'Seldom manifested',        short: '2' },
  { value: 1, label: 'Never/Rarely Manifested',  short: '1' },
];

// ── Rating scale header table ─────────────────────────────────────
const RatingScaleTable = () => (
  <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-6">
    <div className="px-6 py-3 bg-gray-50 border-b border-psu-border">
      <h3 className="text-[12px] font-semibold text-psu-muted uppercase tracking-wider">Rating Scale</h3>
    </div>
    <div className="divide-y divide-psu-border">
      {RATING_SCALE.map(r => (
        <div key={r.value} className="px-6 py-2.5 flex items-center gap-4">
          <span className="w-6 h-6 rounded-full bg-psu-primary/10 text-psu-primary text-[12px] font-bold flex items-center justify-center flex-shrink-0">
            {r.value}
          </span>
          <span className="text-[13px] font-medium text-psu-text w-44 flex-shrink-0">{r.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Radio button row for a single rated question ──────────────────
const QuestionRow = ({ number, question, value, onChange }) => (
  <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-psu-border last:border-b-0">
    <p className="text-[13px] text-psu-text leading-relaxed flex-1">
      <span className="font-medium text-psu-muted mr-1.5">{number}.</span>
      {question}
    </p>
    <div className="flex items-center gap-3 flex-shrink-0">
      {RATING_SCALE.map(r => (
        <label key={r.value} className="flex flex-col items-center gap-1 cursor-pointer group">
          <span className="text-[10px] text-psu-muted group-hover:text-psu-primary transition-colors">{r.value}</span>
          <input
            type="radio"
            name={`question-${question}`}
            value={r.value}
            checked={value === r.value}
            onChange={() => onChange(r.value)}
            className="w-4 h-4 accent-psu-primary cursor-pointer"
          />
        </label>
      ))}
    </div>
  </div>
);

// ── Confirmation modal ────────────────────────────────────────────
const ConfirmationModal = ({ faculty, onNextFaculty, onClose, sentimentResult, overallRating }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className="relative bg-white rounded-2xl border border-psu-border shadow-xl w-full max-w-md p-8 text-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-psu-text transition-colors">
        <HiX className="h-5 w-5" />
      </button>
      <HiCheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-psu-text tracking-tight mb-1">Evaluation Submitted</h2>
      <p className="text-[13px] text-psu-muted mb-5">
        Your feedback for <span className="font-medium text-psu-text">{faculty?.name}</span> has been recorded.
      </p>
      {overallRating > 0 && (
        <div className="inline-flex items-center gap-2 border border-psu-border rounded-lg px-4 py-2 mb-3 text-[12px]">
          <span className="text-psu-muted uppercase tracking-wider font-medium">Overall Rating</span>
          <span className="font-bold text-psu-primary tabular-nums">{overallRating} / 5</span>
        </div>
      )}
      {sentimentResult && (
        <div className="inline-flex items-center gap-2 border border-psu-border rounded-lg px-4 py-2 mb-6 ml-2 text-[12px]">
          <span className="text-psu-muted uppercase tracking-wider font-medium">Sentiment</span>
          <span className={`font-semibold capitalize ${
            sentimentResult.label === 'positive' ? 'text-psu-primary' :
            sentimentResult.label === 'negative' ? 'text-red-500' : 'text-psu-muted'
          }`}>
            {sentimentResult.label}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <button
          onClick={onNextFaculty}
          className="w-full flex items-center justify-center gap-2 bg-psu-primary text-white rounded-lg px-6 py-3 text-[13px] font-semibold hover:bg-psu-secondary transition-colors"
        >
          Evaluate Next Faculty
          <HiArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          className="w-full border border-psu-border text-psu-muted rounded-lg px-6 py-3 text-[13px] font-medium hover:text-psu-text hover:border-gray-300 transition-colors"
        >
          Done for now
        </button>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────
const EvaluationForm = () => {
  const { user }         = useAuth();
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();
  const facultyFromUrl   = searchParams.get('faculty');

  // Redirect non-students away — admins and faculty cannot submit evaluations
  useEffect(() => {
    if (user && user.role !== 'student') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Redirect to dashboard if accessed without a faculty param
  useEffect(() => {
    if (!facultyFromUrl) {
      navigate('/dashboard', { replace: true });
    }
  }, [facultyFromUrl, navigate]);

  // Steps are now 1 = Rate Questions, 2 = Review & Submit
  const [step,            setStep]            = useState(1);
  const [facultyInfo,     setFacultyInfo]     = useState(null);
  const [grouped,         setGrouped]         = useState({});
  const [ratedQuestions,  setRatedQuestions]  = useState([]);
  const [responses,       setResponses]       = useState({});
  const [strengths,       setStrengths]       = useState('');
  const [weaknesses,      setWeaknesses]      = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [dataLoading,     setDataLoading]     = useState(true);
  const [sentimentResult, setSentimentResult] = useState(null);
  const [computedRating,  setComputedRating]  = useState(0);
  const [showModal,       setShowModal]       = useState(false);

  // ── Fetch faculty info + questions ──────────────────────────────
  useEffect(() => {
    if (!facultyFromUrl) return;

    const fetchData = async () => {
      try {
        const [facultyRes, questionsRes] = await Promise.all([
          facultyService.getById(facultyFromUrl),
          evaluationService.getQuestions(),
        ]);

        setFacultyInfo(facultyRes.data.faculty);

        const groupedData = questionsRes.data.grouped || {};
        setGrouped(groupedData);

        // Collect only rating-type questions for progress tracking
        const rated = [];
        Object.values(groupedData).forEach(cat => {
          const qs = Array.isArray(cat) ? cat : (cat.questions || []);
          qs.forEach(q => {
            if (q.question_type === 'rating' || !q.question_type) rated.push(q);
          });
        });
        setRatedQuestions(rated);
      } catch {
        // Fallback mock
        setFacultyInfo({ id: facultyFromUrl, name: 'Faculty Member', department: '—' });
        setGrouped({});
        setRatedQuestions([]);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [facultyFromUrl, user?.department]);

  // ── Progress ───────────────────────────────────────────────────
  const totalRated    = ratedQuestions.length;
  const answeredCount = Object.keys(responses).length;
  const progressPct   = totalRated > 0 ? Math.round((answeredCount / totalRated) * 100) : 0;

  // ── Computed overall rating ────────────────────────────────────
  const computeOverallRating = (resp) => {
    const vals = Object.values(resp);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  };

  const handleResponseChange = (questionId, rating) => {
    setResponses(prev => {
      const updated = { ...prev, [questionId]: rating };
      setComputedRating(computeOverallRating(updated));
      return updated;
    });
  };

  const canProceedToStep2 = answeredCount === totalRated && totalRated > 0;
  const canSubmit         = canProceedToStep2;

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSentimentResult(null);

    const responseArray = Object.entries(responses).map(([question_id, rating]) => ({
      question_id: parseInt(question_id),
      rating,
    }));

    try {
      const res = await evaluationService.submit({
        faculty_id: facultyFromUrl,
        responses:  responseArray,
        strengths:  strengths.trim(),
        weaknesses: weaknesses.trim(),
      });
      setSentimentResult(res.data.sentimentAnalysis);
      setComputedRating(res.data.overallRating || computeOverallRating(responses));
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setResponses({});
    setStrengths('');
    setWeaknesses('');
    setError('');
    setSentimentResult(null);
    setComputedRating(0);
    setShowModal(false);
  };

  const handleNextFaculty = () => { setShowModal(false); navigate('/dashboard'); };
  const handleCloseModal  = () => { resetForm(); navigate('/dashboard'); };

  // ── Helpers ────────────────────────────────────────────────────
  const getCategoryQuestions = (cat) => Array.isArray(cat) ? cat : (cat.questions || []);
  const getCategoryDesc      = (cat) => Array.isArray(cat) ? null : (cat.description || null);

  const ratingCategories = Object.entries(grouped).filter(([, cat]) => {
    const qs = getCategoryQuestions(cat);
    return qs.some(q => q.question_type === 'rating' || !q.question_type);
  });

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <ConfirmationModal
          faculty={facultyInfo}
          sentimentResult={sentimentResult}
          overallRating={computedRating}
          onNextFaculty={handleNextFaculty}
          onClose={handleCloseModal}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-0">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Feedback</p>
          <h1 className="text-3xl font-semibold text-psu-text tracking-tight">Evaluate Faculty</h1>
          {facultyInfo && (
            <p className="text-[14px] text-psu-muted mt-1">
              Evaluating:{' '}
              <span className="font-medium text-psu-text">{facultyInfo.name}</span>
              {' '}— {facultyInfo.department}
            </p>
          )}
        </div>

        {/* Step indicators — now 2 steps */}
        <div className="flex items-center mb-10">
          {['Rate Questions', 'Review & Submit'].map((label, i) => {
            const stepNum     = i + 1;
            const isActive    = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                    isCompleted || isActive ? 'bg-psu-primary text-white' : 'bg-gray-100 text-psu-muted'
                  }`}>
                    {isCompleted ? '✓' : stepNum}
                  </div>
                  <span className={`text-[12px] font-medium tracking-wide hidden sm:block ${
                    isActive ? 'text-psu-text' : 'text-psu-muted'
                  }`}>{label}</span>
                </div>
                {i < 1 && (
                  <div className={`flex-1 h-px mx-3 ${step > stepNum ? 'bg-psu-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-[13px]">
            {error}
          </div>
        )}

        {/* ── Step 1: Rate Questions ── */}
        {step === 1 && (
          <div className="space-y-6">

            {/* Progress bar */}
            <div className="border border-psu-border bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-psu-muted uppercase tracking-wider">Progress</span>
                <span className="text-[12px] text-psu-muted tabular-nums">{answeredCount} of {totalRated} answered</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full">
                <div
                  className="bg-psu-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Rating scale reference */}
            <RatingScaleTable />

            {/* Radio header row */}
            <div className="hidden sm:flex justify-end pr-6 gap-3 mb-[-16px]">
              {RATING_SCALE.map(r => (
                <div key={r.value} className="w-8 text-center text-[10px] font-semibold text-psu-muted uppercase">
                  {r.value}
                </div>
              ))}
            </div>

            {/* Category sections */}
            {ratingCategories.map(([category, catData]) => {
              const qs   = getCategoryQuestions(catData).filter(q => q.question_type === 'rating' || !q.question_type);
              const desc = getCategoryDesc(catData);
              return (
                <div key={category} className="border border-psu-border bg-white rounded-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-psu-border">
                    <h3 className="text-[13px] font-semibold text-psu-text">{category}</h3>
                    {desc && (
                      <p className="text-[12px] text-psu-muted leading-relaxed mt-1.5">{desc}</p>
                    )}
                  </div>
                  {qs.map((q, idx) => (
                    <QuestionRow
                      key={q.id}
                      number={q.sort_order || idx + 1}
                      question={q.question}
                      value={responses[q.id] || null}
                      onChange={rating => handleResponseChange(q.id, rating)}
                    />
                  ))}
                </div>
              );
            })}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!canProceedToStep2}
                onClick={() => setStep(2)}
                className="bg-psu-primary text-white rounded-lg px-6 py-3 text-[13px] font-semibold tracking-wide hover:bg-psu-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Open-ended + Review + Submit ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Computed overall rating preview */}
            {computedRating > 0 && (
              <div className="border border-psu-border bg-white rounded-lg p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-1">Computed Overall Rating</p>
                  <p className="text-[12px] text-psu-muted">Average of your {totalRated} rated responses</p>
                </div>
                <span className="text-3xl font-bold text-psu-primary tabular-nums">
                  {computedRating}<span className="text-[16px] text-psu-muted font-normal"> / 5</span>
                </span>
              </div>
            )}

            {/* Ratings summary */}
            <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-psu-border">
                <h3 className="text-[12px] font-medium text-psu-muted uppercase tracking-wider">Ratings Summary</h3>
              </div>
              <div className="divide-y divide-psu-border">
                {ratingCategories.map(([category, catData]) => {
                  const qs = getCategoryQuestions(catData).filter(q => q.question_type === 'rating' || !q.question_type);
                  return (
                    <div key={category} className="px-6 py-3">
                      <p className="text-[11px] font-semibold text-psu-muted uppercase tracking-wider mb-2">{category}</p>
                      {qs.map(q => (
                        <div key={q.id} className="flex items-center justify-between py-1.5 gap-2">
                          <p className="text-[13px] text-psu-text flex-1 pr-4">{q.question}</p>
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-psu-primary/10 text-psu-primary text-[12px] font-bold tabular-nums flex-shrink-0">
                            {responses[q.id] || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Open-ended questions */}
            <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-psu-border">
                <h3 className="text-[13px] font-semibold text-psu-text">Open-ended Questions</h3>
                <p className="text-[12px] text-psu-muted mt-1">
                  Sagutan ang mga sumusunod na tanong. Maging makatuwiran sa pagbibigay ng mga puna.
                </p>
              </div>
              <div className="divide-y divide-psu-border">
                <div className="px-6 py-5">
                  <label className="block text-[13px] font-medium text-psu-text mb-2">
                    1. Strengths of your Instructors / Professors teaching performance:
                  </label>
                  <textarea
                    value={strengths}
                    onChange={e => setStrengths(e.target.value.replace(/<[^>]*>/g, '').slice(0, 1000))}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-[14px] text-psu-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary transition-all resize-none leading-relaxed"
                    placeholder="What did this instructor do well?"
                  />
                  <p className={`text-[11px] mt-1 text-right ${strengths.length > 900 ? 'text-red-500' : 'text-psu-muted'}`}>{strengths.length}/1000</p>
                </div>
                <div className="px-6 py-5">
                  <label className="block text-[13px] font-medium text-psu-text mb-2">
                    2. Weaknesses of your Instructors / Professors teaching performance:
                  </label>
                  <textarea
                    value={weaknesses}
                    onChange={e => setWeaknesses(e.target.value.replace(/<[^>]*>/g, '').slice(0, 1000))}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-[14px] text-psu-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary transition-all resize-none leading-relaxed"
                    placeholder="What could this instructor improve on?"
                  />
                  <p className={`text-[11px] mt-1 text-right ${weaknesses.length > 900 ? 'text-red-500' : 'text-psu-muted'}`}>{weaknesses.length}/1000</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[13px] font-medium text-psu-muted hover:text-psu-text transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="bg-psu-primary text-white rounded-lg px-8 py-3 text-[13px] font-semibold tracking-wide hover:bg-psu-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default EvaluationForm;
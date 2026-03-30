import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineStar, HiStar, HiCheckCircle } from 'react-icons/hi';
import useAuth from '../hooks/useAuth';
import facultyService from '../services/facultyService';
import evaluationService from '../services/evaluationService';

const StarRating = ({ value, onChange, hoverValue, onHover, onLeave, size = 'h-6 w-6' }) => (
  <div className="flex items-center space-x-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        onMouseEnter={() => onHover(star)}
        onMouseLeave={onLeave}
        className="p-0.5 transition-colors"
      >
        {star <= (hoverValue || value) ? (
          <HiStar className={`${size} text-psu-gold`} />
        ) : (
          <HiOutlineStar className={`${size} text-gray-200 hover:text-gray-300`} />
        )}
      </button>
    ))}
    {value > 0 && (
      <span className="ml-2 text-[12px] text-psu-muted tabular-nums">{value}/5</span>
    )}
  </div>
);

const EvaluationForm = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const facultyFromUrl = searchParams.get('faculty');

  const [step, setStep] = useState(1);
  const [faculty, setFaculty] = useState([]);
  const [questions, setQuestions] = useState({});
  const [questionList, setQuestionList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [responses, setResponses] = useState({});
  const [hoverStates, setHoverStates] = useState({});
  const [overallRating, setOverallRating] = useState(0);
  const [overallHover, setOverallHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentimentResult, setSentimentResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentDept = user?.department || null;
        const [facultyRes, questionsRes] = await Promise.all([
          facultyService.getAll(studentDept),
          evaluationService.getQuestions(),
        ]);
        setFaculty([...(facultyRes.data.faculty || [])].sort((a, b) => a.name.localeCompare(b.name)));
        setQuestions(questionsRes.data.grouped);
        setQuestionList(questionsRes.data.questions);
      } catch {
        const mockFaculty = [
          { id: 1, name: 'Dr. Maria Santos',    department: 'Computer Science'       },
          { id: 2, name: 'Prof. Juan Dela Cruz', department: 'Information Technology' },
          { id: 3, name: 'Dr. Ana Reyes',        department: 'Mathematics'            },
          { id: 4, name: 'Prof. Carlo Mendoza',  department: 'Engineering'            },
          { id: 5, name: 'Dr. Lisa Garcia',      department: 'Computer Science'       },
        ];
        setFaculty([...mockFaculty].sort((a, b) => a.name.localeCompare(b.name)));

        const fallback = {
          'Teaching Quality': [
            { id: 1, question: 'The instructor explains concepts clearly and effectively.' },
            { id: 2, question: 'The instructor is well-prepared for each class session.' },
            { id: 3, question: 'The instructor uses relevant examples to illustrate key points.' },
          ],
          'Communication': [
            { id: 4, question: 'The instructor encourages student participation and questions.' },
            { id: 5, question: 'The instructor is approachable and available for consultation.' },
            { id: 6, question: 'The instructor provides clear and constructive feedback.' },
          ],
          'Course Management': [
            { id: 7, question: 'The course materials and resources are adequate and helpful.' },
            { id: 8, question: 'The instructor manages class time effectively.' },
            { id: 9, question: 'The grading criteria and policies are fair and transparent.' },
          ],
          'Professionalism': [
            { id: 10, question: 'The instructor demonstrates respect for students.' },
          ],
        };
        setQuestions(fallback);
        setQuestionList(Object.values(fallback).flat());
      }
    };
    fetchData();
  }, [user?.department]);

  // Once faculty list loads, if ?faculty= is in the URL,
  // auto-select that instructor and jump straight to step 2
  useEffect(() => {
    if (facultyFromUrl && faculty.length > 0) {
      setSelectedFaculty(String(facultyFromUrl));
      setStep(2);
    }
  }, [facultyFromUrl, faculty]);

  const totalQuestions    = questionList.length;
  const answeredQuestions = Object.keys(responses).length;
  const progressPercent   = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const handleResponseChange = (questionId, rating) => {
    setResponses(prev => ({ ...prev, [questionId]: rating }));
  };

  const handleHover = (questionId, star) => {
    setHoverStates(prev => ({ ...prev, [questionId]: star }));
  };

  const handleLeave = (questionId) => {
    setHoverStates(prev => ({ ...prev, [questionId]: 0 }));
  };

  const canProceedToStep2 = selectedFaculty !== '';
  const canProceedToStep3 = answeredQuestions === totalQuestions;
  const canSubmit         = overallRating > 0 && comment.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setSentimentResult(null);

    const responseArray = Object.entries(responses).map(([question_id, rating]) => ({
      question_id: parseInt(question_id),
      rating,
    }));

    try {
      const res = await evaluationService.submit({
        faculty_id: selectedFaculty,
        rating:     overallRating,
        comment,
        responses:  responseArray,
      });
      setSuccess(res.data.message);
      setSentimentResult(res.data.sentimentAnalysis);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedFaculty('');
    setResponses({});
    setHoverStates({});
    setOverallRating(0);
    setOverallHover(0);
    setComment('');
    setError('');
    setSuccess('');
    setSentimentResult(null);
  };

  const selectedFacultyInfo = faculty.find(f => String(f.id) === String(selectedFaculty));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="mb-10">
        <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Feedback</p>
        <h1 className="text-3xl font-semibold text-psu-text tracking-tight">Evaluate Faculty</h1>
      </div>

      {/* Progress Steps */}
      {step < 4 && (
        <div className="flex items-center mb-10">
          {['Select Faculty', 'Rate Questions', 'Review & Submit'].map((label, i) => {
            const stepNum     = i + 1;
            const isActive    = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                    isCompleted ? 'bg-psu-primary text-white' :
                    isActive    ? 'bg-psu-primary text-white' :
                    'bg-gray-100 text-psu-muted'
                  }`}>
                    {isCompleted ? '✓' : stepNum}
                  </div>
                  <span className={`text-[12px] font-medium tracking-wide hidden sm:block ${
                    isActive ? 'text-psu-text' : 'text-psu-muted'
                  }`}>{label}</span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-px mx-3 ${step > stepNum ? 'bg-psu-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-[13px]">
          {error}
        </div>
      )}

      {/* Step 1: Select Faculty — skipped when coming from dashboard */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="border border-psu-border bg-white rounded-lg p-6">
            <label className="block text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-3">
              Select Faculty Member
            </label>
            <div className="space-y-2">
              {faculty.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFaculty(String(f.id))}
                  className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all ${
                    String(selectedFaculty) === String(f.id)
                      ? 'border-psu-primary bg-psu-primary/5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-[14px] font-medium ${
                    String(selectedFaculty) === String(f.id) ? 'text-psu-primary' : 'text-psu-text'
                  }`}>{f.name}</p>
                  <p className="text-[12px] text-psu-muted mt-0.5">{f.department}</p>
                </button>
              ))}
            </div>
          </div>
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

      {/* Step 2: Rate Questions */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="border border-psu-border bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium text-psu-muted uppercase tracking-wider">Progress</span>
              <span className="text-[12px] text-psu-muted tabular-nums">{answeredQuestions} of {totalQuestions} answered</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full">
              <div
                className="bg-psu-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {selectedFacultyInfo && (
            <div className="flex items-center space-x-2 text-[13px] text-psu-muted">
              <span>Evaluating:</span>
              <span className="font-medium text-psu-text">{selectedFacultyInfo.name}</span>
              <span>— {selectedFacultyInfo.department}</span>
            </div>
          )}

          {Object.entries(questions).map(([category, categoryQuestions]) => (
            <div key={category} className="border border-psu-border bg-white rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-psu-border">
                <h3 className="text-[13px] font-semibold text-psu-text uppercase tracking-wider">{category}</h3>
              </div>
              <div className="divide-y divide-psu-border">
                {categoryQuestions.map(q => (
                  <div key={q.id} className="px-6 py-5">
                    <p className="text-[14px] text-psu-text leading-relaxed mb-3">{q.question}</p>
                    <StarRating
                      value={responses[q.id] || 0}
                      onChange={rating => handleResponseChange(q.id, rating)}
                      hoverValue={hoverStates[q.id] || 0}
                      onHover={star => handleHover(q.id, star)}
                      onLeave={() => handleLeave(q.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] font-medium text-psu-muted hover:text-psu-text transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canProceedToStep3}
              onClick={() => setStep(3)}
              className="bg-psu-primary text-white rounded-lg px-6 py-3 text-[13px] font-semibold tracking-wide hover:bg-psu-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {selectedFacultyInfo && (
            <div className="flex items-center space-x-2 text-[13px] text-psu-muted">
              <span>Evaluating:</span>
              <span className="font-medium text-psu-text">{selectedFacultyInfo.name}</span>
            </div>
          )}

          <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-psu-border">
              <h3 className="text-[12px] font-medium text-psu-muted uppercase tracking-wider">Question Ratings Summary</h3>
            </div>
            <div className="divide-y divide-psu-border">
              {Object.entries(questions).map(([category, categoryQuestions]) => (
                <div key={category} className="px-6 py-3">
                  <p className="text-[12px] font-semibold text-psu-muted uppercase tracking-wider mb-1">{category}</p>
                  {categoryQuestions.map(q => (
                    <div key={q.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 gap-1.5">
                      <p className="text-[13px] text-psu-text sm:pr-4 flex-1">{q.question}</p>
                      <div className="flex items-center space-x-0.5 flex-shrink-0">
                        {[1, 2, 3, 4, 5].map(star => (
                          <HiStar
                            key={star}
                            className={`h-4 w-4 ${star <= (responses[q.id] || 0) ? 'text-psu-gold' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-psu-border bg-white rounded-lg p-6">
            <label className="block text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-3">
              Overall Rating
            </label>
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              hoverValue={overallHover}
              onHover={setOverallHover}
              onLeave={() => setOverallHover(0)}
              size="h-8 w-8"
            />
          </div>

          <div className="border border-psu-border bg-white rounded-lg p-6">
            <label className="block text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-3">
              Additional Comments & Feedback
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-[14px] text-psu-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary transition-all resize-none leading-relaxed"
              placeholder="Share your overall experience with this faculty member. What did they do well? What could be improved?"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
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

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="border border-psu-border bg-white rounded-lg p-5 sm:p-8 text-center">
          <HiCheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-psu-text tracking-tight mb-2">Evaluation Submitted</h2>
          <p className="text-[13px] text-psu-muted mb-6">
            {success || 'Your feedback has been recorded successfully.'}
          </p>

          {sentimentResult && (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 border border-psu-border rounded-lg px-5 py-3 mb-6">
              <span className="text-[12px] font-medium text-psu-muted uppercase tracking-wider">Sentiment</span>
              <span className={`text-[14px] font-semibold capitalize ${
                sentimentResult.label === 'positive' ? 'text-psu-primary' :
                sentimentResult.label === 'negative' ? 'text-red-500' : 'text-psu-muted'
              }`}>
                {sentimentResult.label}
              </span>
              <span className="text-[12px] text-psu-muted tabular-nums">({sentimentResult.score})</span>
            </div>
          )}

          <button
            type="button"
            onClick={resetForm}
            className="bg-psu-primary text-white rounded-lg px-6 py-3 text-[13px] font-semibold tracking-wide hover:bg-psu-secondary transition-colors"
          >
            Submit Another Evaluation
          </button>
        </div>
      )}
    </div>
  );
};

export default EvaluationForm;

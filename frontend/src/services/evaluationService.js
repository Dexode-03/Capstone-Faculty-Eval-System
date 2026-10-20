import api from './api';

const evaluationService = {
  getQuestions:           ()          => api.get('/evaluation/questions'),
  submit:                 (data)      => api.post('/evaluation/submit', data),
  getFacultyEvaluations:  (facultyId) => api.get(`/evaluation/faculty/${facultyId}`),
  getMyEvaluations:       ()          => api.get('/evaluation/my-evaluations'),
  getEnrolledInstructors: ()          => api.get('/evaluation/enrolled-instructors'),
  getSystemAnalysis:      (params = {}) => api.get('/evaluation/analysis', { params }),
  getMyFacultyReport:     ()          => api.get('/evaluation/my-report'),
  clearAllEvaluations:    (payload)   => api.delete('/evaluation/clear-all', { data: payload }),
  getSubjectSectionReport:(facultyId, subjectId, section) => api.get(`/evaluation/faculty/${facultyId}/subject-section-report`, { params: { subject_id: subjectId, section } }),

  // Privacy consent
  getConsentStatus:       ()          => api.get('/auth/consent/status'),
  acceptConsent:          (version)   => api.post('/auth/consent/accept', { consentVersion: version || '1.0' }),
};

export default evaluationService;
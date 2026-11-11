import api from './api';

const evaluationService = {
  getQuestions:           ()          => api.get('/evaluation/questions'),
  submit:                 (data)      => api.post('/evaluation/submit', data),
  getFacultyEvaluations:  (facultyId, params = {}) => api.get(`/evaluation/faculty/${facultyId}`, { params }),
  getMyEvaluations:       ()          => api.get('/evaluation/my-evaluations'),
  getEnrolledInstructors: ()          => api.get('/evaluation/enrolled-instructors'),
  getSystemAnalysis:      (params = {}) => api.get('/evaluation/analysis', { params }),
  getMyFacultyReport:     (params = {}) => api.get('/evaluation/my-report', { params }),
  clearAllEvaluations:    (payload)   => api.delete('/evaluation/clear-all', { data: payload }),
  getSubjectSectionReport:(facultyId, subjectId, section) => api.get(`/evaluation/faculty/${facultyId}/subject-section-report`, { params: { subject_id: subjectId, section } }),

  // Privacy consent
  getConsentStatus:       ()          => api.get('/auth/consent/status'),
  acceptConsent:          (version)   => api.post('/auth/consent/accept', { consentVersion: version || '1.0' }),
};

export default evaluationService;
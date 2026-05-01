import api from './api';

const evaluationService = {
  getQuestions:           ()          => api.get('/evaluation/questions'),
  submit:                 (data)      => api.post('/evaluation/submit', data),
  getFacultyEvaluations:  (facultyId) => api.get(`/evaluation/faculty/${facultyId}`),
  getMyEvaluations:       ()          => api.get('/evaluation/my-evaluations'),
  getEnrolledInstructors: ()          => api.get('/evaluation/enrolled-instructors'),
  getSystemAnalysis:      ()          => api.get('/evaluation/analysis'),
  getMyFacultyReport:     ()          => api.get('/evaluation/my-report'),
  clearAllEvaluations:    ()          => api.delete('/evaluation/clear-all'),
};

export default evaluationService;
import api from './api';

const subjectService = {
  getAll: (department) => api.get('/subjects', { params: department ? { department } : {} }),
  getById: (id) => api.get(`/subjects/${id}`),
};

export default subjectService;

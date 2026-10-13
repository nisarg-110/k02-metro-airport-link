import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getDashboard = () => api.get('/dashboard').then(r => r.data);
export const getDepartments = () => api.get('/departments').then(r => r.data);
export const getDepartment = (id: string) => api.get(`/departments/${id}`).then(r => r.data);
export const getBudget = () => api.get('/budget').then(r => r.data);
export const getExpenditures = () => api.get('/budget/expenditures').then(r => r.data);
export const getTasks = () => api.get('/tasks').then(r => r.data);
export const getTask = (id: string) => api.get(`/tasks/${id}`).then(r => r.data);
export const getComponents = () => api.get('/components').then(r => r.data);
export const getPeople = () => api.get('/people').then(r => r.data);
export const getAnomalies = () => api.get('/anomalies').then(r => r.data);

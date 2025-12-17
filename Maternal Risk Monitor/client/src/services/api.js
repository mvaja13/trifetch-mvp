import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export const api = {
    uploadCsv: async (formData) => {
        return axios.post(`${API_BASE}/upload-csv`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    getPatients: async (filter = '', sort = '') => {
        return axios.get(`${API_BASE}/patients`, {
            params: { filter, sort },
        });
    },

    getPatientDetails: async (id) => {
        return axios.get(`${API_BASE}/patients/${id}`);
    },

    addNote: async (id, note, createdBy) => {
        return axios.post(`${API_BASE}/patients/${id}/notes`, { note, created_by: createdBy });
    }
};

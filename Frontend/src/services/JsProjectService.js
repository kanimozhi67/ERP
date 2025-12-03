// services/JsProjectService.js
import apiService from './JsApiService';

const projectService = {
  // Get all projects
  getProjects: async () => {
    try {
      const response = await apiService.get('/projects');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get project by ID
  getProjectById: async (projectId) => {
    try {
      const response = await apiService.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create project
  createProject: async (projectData) => {
    try {
      const response = await apiService.post('/projects', projectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default projectService;
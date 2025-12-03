// src/services/projectService.js
import { apiService } from './apiService';

export const projectService = {
  // Get projects by company ID
  getProjectsByCompany: async (companyId) => {
    try {
      const response = await apiService.getProjectsByCompany(companyId);

      if (Array.isArray(response)) {
        return response;
      } else if (Array.isArray(response?.data)) {
        return response.data;
      } else if (Array.isArray(response?.projects)) {
        return response.projects;
      } else {
        console.error('Unexpected API response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error in projectService.getProjectsByCompany:', error);
      return [];
    }
  },

  // Get all projects
  getProjects: async () => {
    try {
      const response = await apiService.getProjects();

      if (Array.isArray(response)) {
        return response;
      } else if (Array.isArray(response?.data)) {
        return response.data;
      } else if (Array.isArray(response?.projects)) {
        return response.projects;
      } else {
        console.error('Unexpected API response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error in projectService.getProjects:', error);
      return [];
    }
  },

  // Get single project by ID
  getProjectById: async (projectId) => {
    try {
      const response = await apiService.get(`/projects/${projectId}`);
      return response?.data || null;
    } catch (error) {
      console.error('Error fetching project by ID:', error);
      return null;
    }
  },
};

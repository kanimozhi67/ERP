// services/JsCompanyService.js
import apiService from './JsApiService';

const companyService = {
  // Get all companies
  getCompanies: async () => {
    try {
      const response = await apiService.get('/companies');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get company by ID
  getCompanyById: async (companyId) => {
    try {
      const response = await apiService.get(`/companies/${companyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create company
  createCompany: async (companyData) => {
    try {
      const response = await apiService.post('/companies', companyData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default companyService;
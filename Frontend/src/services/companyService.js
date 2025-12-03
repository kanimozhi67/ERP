import axios from 'axios';

const API_URL = '/api/companies';

export const companyService = {
  // GET - Fetch all companies
  getAllCompanies: () => axios.get(API_URL),
  
  // GET - Fetch single company by ID
  getCompanyById: (id) => axios.get(`${API_URL}/${id}`),
  
  // POST - Create new company
  // @param {Object} companyData - Company data containing name and tenantCode
  // @returns {Promise} Axios response
  createCompany: (companyData) => axios.post(API_URL, companyData),
  
  // PUT - Update existing company
  // @param {string} id - Company ID to update
  // @param {Object} companyData - Updated company data
  // @returns {Promise} Axios response
  updateCompany: (id, companyData) => axios.put(`${API_URL}/${id}`, companyData),
  
  // DELETE - Remove company
  // @param {string} id - Company ID to delete
  // @returns {Promise} Axios response
  deleteCompany: (id) => axios.delete(`${API_URL}/${id}`)
};
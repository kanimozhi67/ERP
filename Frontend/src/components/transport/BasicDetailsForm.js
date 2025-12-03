import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, TimePicker, Row, Col, Spin, Alert } from 'antd';
import dayjs from 'dayjs';
import apiService from '../../services/apiService';

const { Option } = Select;

const BasicDetailsForm = ({ onCompanyChange, onProjectChange, form, isEditing, editTaskData }) => {
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [projectError, setProjectError] = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany?.id && hasInitialized) {
      fetchProjectsForCompany(selectedCompany.id);
    }
  }, [selectedCompany, hasInitialized]);

  // Handle edit data initialization
  useEffect(() => {
    if (isEditing && editTaskData && companies.length > 0 && !hasInitialized) {
      initializeEditData();
    }
  }, [isEditing, editTaskData, companies, hasInitialized]);

  const initializeEditData = async () => {
    console.log('🎯 INITIALIZING EDIT DATA IN BASIC DETAILS FORM');
    
    try {
      // Find company by ID or name
      const company = companies.find(c => 
        c.id === editTaskData.companyId || 
        c.name === editTaskData.companyName
      );

      if (company) {
        console.log('🏢 Found company for edit:', company);
        
        // Set company state
        setSelectedCompany(company);
        setSelectedCompanyName(company.name);
        
        // Notify parent about company change
        if (onCompanyChange) {
          onCompanyChange(company._id, company.id, company.name);
        }

        // Set form values for dates and locations from edit data
        const taskDate = editTaskData.taskDate ? dayjs(editTaskData.taskDate) : null;
        const pickupTime = editTaskData.plannedPickupTime ? dayjs(editTaskData.plannedPickupTime) : null;
        const dropTime = editTaskData.plannedDropTime ? dayjs(editTaskData.plannedDropTime) : null;

        setTimeout(() => {
          form.setFieldsValue({
            company: company._id,
            taskDate: taskDate,
            pickupTime: pickupTime,
            dropTime: dropTime,
            pickupLocation: editTaskData.pickupLocation || '',
            dropLocation: editTaskData.dropLocation || '',
            pickupAddress: editTaskData.pickupAddress || '',
            dropAddress: editTaskData.dropAddress || '',
            notes: editTaskData.notes || ''
          });
        }, 100);

        // Wait for projects to load and set project
        await fetchProjectsForCompany(company.id);
        
        const projectsResponse = await apiService.getProjects();
        const allProjects = Array.isArray(projectsResponse.data) ? projectsResponse.data : [];
        
        const project = allProjects.find(p => 
          p.id === editTaskData.projectId || 
          p.name === editTaskData.projectName
        );

        if (project) {
          console.log('📋 Found project for edit:', project);
          
          // Set project in form after a delay to ensure projects are loaded
          setTimeout(() => {
            form.setFieldsValue({
              project: project._id
            });
            
            // Notify parent about project change
            if (onProjectChange) {
              onProjectChange(project._id, project.name, project.id);
            }
            
            setSelectedProjectName(project.name);
          }, 1500);
        }
        
        setHasInitialized(true);
        console.log('✅ Edit data initialization completed');
      }
    } catch (error) {
      console.error('❌ Error initializing edit data:', error);
    }
  };

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await apiService.getCompanies();
      const companiesData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.companies)
        ? response.companies
        : [];
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchProjectsForCompany = async (companyId) => {
    if (!companyId) return;
    
    setLoadingProjects(true);
    setProjectError(null);
    
    // Clear projects when starting to fetch
    setProjects([]);
    setSelectedProjectName('');

    try {
      const response = await apiService.getProjects();
      const allProjects = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.projects)
        ? response.projects
        : [];

      const filtered = allProjects.filter(
        (project) => Number(project.companyId) === Number(companyId)
      );

      setProjects(filtered);

      if (filtered.length === 0) {
        setProjectError('No projects found for this company');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
      setProjectError('Error loading projects. Please try again.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCompanyChange = (companyMongoId) => {
    const companyObj = companies.find((c) => c._id === companyMongoId);
    
    console.log('🏢 Company selected:', {
      mongoId: companyMongoId,
      numericId: companyObj?.id,
      name: companyObj?.name,
      companyObj: companyObj
    });
    
    // Reset ALL dependent fields immediately when company changes
    if (form) {
      form.setFieldsValue({ 
        project: undefined,
        vehicleId: undefined,
        driverId: undefined
      });
    }
    
    // Clear projects and error immediately
    setProjects([]);
    setProjectError(null);
    setSelectedProjectName('');
    
    // Set the new company (this will trigger fetchProjectsForCompany)
    setSelectedCompany(companyObj);
    setSelectedCompanyName(companyObj?.name || '');
    setHasInitialized(true);
    
    // Notify parent about company change - PASS COMPANY NAME AS THIRD PARAMETER
    if (onCompanyChange) {
      onCompanyChange(
        companyMongoId, 
        companyObj?.id, 
        companyObj?.name // Add company name here
      );
    }
    
    // Reset project callback
    if (onProjectChange) {
      onProjectChange(null, '', null);
    }
  };

  const handleProjectChange = (projectMongoId) => {
    const projectObj = projects.find((p) => p._id === projectMongoId);
    console.log('📋 Project selected:', {
      mongoId: projectMongoId,
      numericId: projectObj?.id,
      name: projectObj?.name,
      projectObj: projectObj
    });

    setSelectedProjectName(projectObj?.name || '');
    
    if (onProjectChange && projectObj) {
      onProjectChange(projectMongoId, projectObj.name, projectObj.id);
    }
  };

  // Get placeholder text for company dropdown
  const getCompanyPlaceholder = () => {
    if (loadingCompanies) {
      return 'Loading companies...';
    }
    if (selectedCompanyName) {
      return selectedCompanyName;
    }
    return 'Select Company';
  };

  // Get placeholder text for project dropdown
  const getProjectPlaceholder = () => {
    if (!selectedCompany) {
      return 'Select company first';
    }
    if (loadingProjects) {
      return 'Loading projects...';
    }
    if (selectedProjectName) {
      return selectedProjectName;
    }
    if (projectError) {
      return 'No projects available';
    }
    return 'Select Project';
  };

  return (
    <div className="mb-8">
      <div className="text-lg font-semibold text-gray-800 mb-4">BASIC DETAILS</div>
      <div className="border-l-4 border-blue-500 pl-4">
        <Spin spinning={loadingCompanies || loadingProjects}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Company"
                name="company"
                rules={[{ required: true, message: 'Please select a company' }]}
              >
                <Select
                  placeholder={getCompanyPlaceholder()}
                  size="large"
                  loading={loadingCompanies}
                  onChange={handleCompanyChange}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                  onClear={() => {
                    setSelectedCompanyName('');
                    setSelectedCompany(null);
                    setProjects([]);
                    setSelectedProjectName('');
                    setHasInitialized(true);
                    if (onCompanyChange) {
                      onCompanyChange(null, null, '');
                    }
                  }}
                >
                  {companies.map((company) => (
                    <Option key={company._id} value={company._id}>
                      {company.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Project"
                name="project"
                rules={[{ required: true, message: 'Please select a project' }]}
              >
                <Select
                  placeholder={getProjectPlaceholder()}
                  size="large"
                  disabled={!selectedCompany || loadingProjects}
                  loading={loadingProjects}
                  onChange={handleProjectChange}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                  onClear={() => {
                    setSelectedProjectName('');
                    if (onProjectChange) {
                      onProjectChange(null, '', null);
                    }
                  }}
                >
                  {projects.map((project) => (
                    <Option key={project._id} value={project._id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedCompany && projectError && !loadingProjects && (
                <Alert message={projectError} type="warning" showIcon size="small" />
              )}
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Task Date"
                name="taskDate"
                rules={[{ required: true, message: 'Please select task date' }]}
              >
                <DatePicker
                  placeholder="Select Date"
                  size="large"
                  className="w-full"
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Pickup Time"
                name="pickupTime"
                rules={[{ required: true, message: 'Please select pickup time' }]}
              >
                <TimePicker
                  placeholder="Select Pickup Time"
                  size="large"
                  className="w-full"
                  format="hh:mm A"
                  use12Hours
                  minuteStep={5}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Drop Time"
                name="dropTime"
                rules={[{ required: true, message: 'Please select drop time' }]}
              >
                <TimePicker
                  placeholder="Select Drop Time"
                  size="large"
                  className="w-full"
                  format="hh:mm A"
                  use12Hours
                  minuteStep={5}
                />
              </Form.Item>
            </Col>
          </Row>
        </Spin>
      </div>
    </div>
  );
};

export default BasicDetailsForm;
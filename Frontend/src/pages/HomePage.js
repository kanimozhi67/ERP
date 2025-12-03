import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import BasicDetailsForm from '../components/transport/BasicDetailsForm';
import VehicleDriverAssignment from '../components/transport/VehicleDriverAssignment';
import PickupDropLocations from '../components/transport/PickupDropLocations';
import PassengerAssignment from '../components/transport/PassengerAssignment';
import apiService from '../services/apiService';
import dayjs from 'dayjs';

const { confirm } = Modal;

const removeDuplicatePassengers = (passengers) => {
  if (!passengers || !Array.isArray(passengers)) return [];
  
  const uniquePassengers = passengers.filter((passenger, index, self) =>
    index === self.findIndex(p => 
      p.employeeCode === passenger.employeeCode && 
      p.employeeName === passenger.employeeName
    )
  );
  
  return uniquePassengers;
};

const HomePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [companyNumericId, setCompanyNumericId] = useState(null);
  const [projectNumericId, setProjectNumericId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [editTaskData, setEditTaskData] = useState(null);
  const [originalEditData, setOriginalEditData] = useState(null);
  const navigate = useNavigate();

  const sendEmailNotification = async (taskData, taskType) => {
    try {
      console.log('📧 === DEBUG: STARTING EMAIL NOTIFICATION ===');
      console.log('📧 Task Type:', taskType);
      console.log('📧 Task Data:', taskData);

      const notificationData = {
        taskType: taskType,
        companyName: companyName || 'Unknown Company',
        projectName: projectName || 'No Project',
        taskDate: taskData.taskDate || new Date(),
        recipientEmail: 'anbuarasu2017@gmail.com',
        taskId: taskType === 'create' ? (taskData.id || 'Unknown') : (editingTaskId || 'Unknown'),
        vehicleId: taskData.vehicleId || 'N/A',
        driverId: taskData.driverId || 'N/A',
        pickupLocation: taskData.pickupLocation || 'N/A',
        dropLocation: taskData.dropLocation || 'N/A',
        expectedPassengers: taskData.expectedPassengers || 0
      };

      console.log('📧 Final Notification Data:', notificationData);
      console.log('📧 Calling apiService.sendFleetTaskNotification...');
      
      const response = await apiService.sendFleetTaskNotification(notificationData);
      
      console.log('📧 API Response from email service:', response);
      
      if (response && response.success) {
        console.log('✅ Email notification sent successfully');
        return true;
      } else {
        console.warn('⚠️ Email notification failed:', response?.message || 'No response message');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending email notification:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('🏠 HomePage mounted - checking for editing data...');
    loadCompanies();
    loadEditingData();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      const companies = Array.isArray(response.data) ? response.data : [];
      setAvailableCompanies(companies);
      console.log('🏢 Available companies loaded:', companies);
    } catch (error) {
      console.error('❌ Error loading companies:', error);
    }
  };

  const loadEditingData = () => {
    try {
      const storedTask = localStorage.getItem('editingFleetTask');
      console.log('📥 Raw stored task from localStorage:', storedTask);
      
      if (storedTask) {
        const taskData = JSON.parse(storedTask);
        console.log('📋 Parsed editing task data:', taskData);
        
        if (taskData.isEditing) {
          console.log('🎯 EDIT MODE DETECTED - Setting up form with task data');
          
          setIsEditing(true);
          setEditingTaskId(taskData.id || taskData._id);
          setEditTaskData(taskData);
          setOriginalEditData(taskData);
          
          if (taskData.companyId) {
            setCompanyNumericId(taskData.companyId);
            setCompanyName(taskData.companyName || '');
          }

          if (taskData.projectId) {
            setProjectNumericId(taskData.projectId);
            setProjectName(taskData.projectName || '');
          }

          console.log('📍 Initial state set from edit data:', {
            companyNumericId: taskData.companyId,
            companyName: taskData.companyName,
            projectNumericId: taskData.projectId,
            projectName: taskData.projectName
          });

          localStorage.removeItem('editingFleetTask');
          console.log('🧹 Cleared editingFleetTask from localStorage');

        } else {
          console.log('❌ No editing flag found in task data');
        }
      } else {
        console.log('📭 No editing data found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading editing data:', error);
      message.error('Failed to load task for editing');
    }
  };

  const handleCompanyChange = (companyMongoId, numericId, companyName) => {
    console.log('🏢 Company changing to:', { companyMongoId, numericId, companyName });
    console.log('📝 Current edit mode:', isEditing);
    console.log('📋 Current edit task data:', editTaskData);
    
    setSelectedCompany(companyMongoId);
    setCompanyNumericId(numericId);
    setCompanyName(companyName || '');

    setProjectName('');
    setProjectNumericId(null);

    if (isEditing && editTaskData) {
      console.log('🔄 EDIT MODE: Handling company change while preserving locations');
      
      const currentFormValues = form.getFieldsValue();
      console.log('📋 Current form values before reset:', currentFormValues);
      
      const preservedFields = {
        taskDate: currentFormValues.taskDate || (editTaskData.taskDate ? dayjs(editTaskData.taskDate) : null),
        pickupTime: currentFormValues.pickupTime || (editTaskData.plannedPickupTime ? dayjs(editTaskData.plannedPickupTime) : null),
        dropTime: currentFormValues.dropTime || (editTaskData.plannedDropTime ? dayjs(editTaskData.plannedDropTime) : null),
        pickupLocation: currentFormValues.pickupLocation || editTaskData.pickupLocation || '',
        dropLocation: currentFormValues.dropLocation || editTaskData.dropLocation || '',
        pickupAddress: currentFormValues.pickupAddress || editTaskData.pickupAddress || '',
        dropAddress: currentFormValues.dropAddress || editTaskData.dropAddress || '',
        notes: currentFormValues.notes || editTaskData.notes || '',
        passengers: currentFormValues.passengers || editTaskData.passengers || []
      };

      console.log('💾 Preserved fields:', preservedFields);

      setTimeout(() => {
        form.setFieldsValue({
          company: companyMongoId,
          project: undefined,
          vehicleId: undefined,
          driverId: undefined,
          ...preservedFields
        });
        
        console.log('✅ Form updated with new company and preserved fields');
      }, 0);

    } else {
      console.log('🔄 CREATE MODE: Resetting all fields');
      setTimeout(() => {
        form.setFieldsValue({
          company: companyMongoId,
          project: undefined,
          vehicleId: undefined,
          driverId: undefined,
          passengers: [],
          taskDate: undefined,
          pickupTime: undefined,
          dropTime: undefined,
          pickupLocation: '',
          dropLocation: '',
          pickupAddress: '',
          dropAddress: '',
          notes: ''
        });
      }, 0);
    }

    console.log('✅ Company changed - Mongo ID:', companyMongoId, 'Numeric ID:', numericId, 'Name:', companyName);
  };

  const handleProjectChange = (projectMongoId, projectName, numericId) => {
    setProjectName(projectName || '');
    setProjectNumericId(numericId);
    console.log('📋 Project selected - Mongo ID:', projectMongoId, 'Name:', projectName, 'Numeric ID:', numericId);
  };

  const onFinish = (values) => {
    const displayProjectName = projectName || 'the selected project';
    const displayCompanyName = companyName || 'the selected company';
    
    confirm({
      title: isEditing ? 'Update transport task?' : 'Create new transport task?',
      icon: <ExclamationCircleOutlined />,
      content: isEditing 
        ? `Update transport task for ${displayCompanyName} - ${displayProjectName}?` 
        : `Create new transport task for ${displayCompanyName} - ${displayProjectName}?`,
      okText: isEditing ? 'Yes, Update' : 'Yes, Create',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk() {
        if (isEditing) {
          handleUpdateSchedule(values);
        } else {
          handleCreateSchedule(values);
        }
      },
    });
  };

  const handleCreateSchedule = async (values) => {
    setLoading(true);
    let createdFleetTaskId = null;
    
    try {
      console.log('=== DEBUG: STARTING SCHEDULE CREATION ===');
      console.log('=== FORM VALUES ===', values);
      console.log('=== PASSENGERS DATA ===', values.passengers);
      console.log('Company numeric ID:', companyNumericId, 'Company Name:', companyName);
      console.log('Project numeric ID:', projectNumericId, 'Project Name:', projectName);

      if (!values.company || !values.vehicleId || !values.taskDate) {
        throw new Error('Please fill all required fields: Company, Vehicle, and Task Date');
      }

      if (!values.passengers || values.passengers.length === 0) {
        throw new Error('No passengers selected. Please select at least one passenger.');
      }

      if (!companyNumericId) {
        throw new Error('Company ID not found. Please select a company again.');
      }

      const formatDateForBackend = (date) => {
        if (!date) return null;
        
        try {
          if (date && date.$d) {
            const jsDate = date.$d;
            return jsDate.toISOString();
          }
          
          if (date instanceof Date) {
            return date.toISOString();
          }
          
          if (typeof date === 'string') {
            return new Date(date).toISOString();
          }
          
          return null;
        } catch (error) {
          console.error('Error formatting date:', error);
          return null;
        }
      };

      const generateId = () => {
        return Math.floor(Math.random() * 1000000) + 1;
      };

      const fleetTaskData = {
        companyId: Number(companyNumericId),
        companyName: companyName,
        projectId: projectNumericId ? Number(projectNumericId) : null,
        projectName: projectName,
        driverId: values.driverId ? Number(values.driverId) : null,
        vehicleId: values.vehicleId ? Number(values.vehicleId) : null,
        taskDate: formatDateForBackend(values.taskDate),
        plannedPickupTime: values.pickupTime ? formatDateForBackend(values.pickupTime) : null,
        plannedDropTime: values.dropTime ? formatDateForBackend(values.dropTime) : null,
        pickupLocation: values.pickupLocation,
        dropLocation: values.dropLocation,
        pickupAddress: values.pickupAddress,
        dropAddress: values.dropAddress,
        expectedPassengers: values.passengers ? values.passengers.length : 0,
        status: 'PLANNED',
        createdBy: 1
      };

      console.log('=== DEBUG: FLEET TASK DATA WITH DATES ===', {
        ...fleetTaskData,
        taskDate: new Date(fleetTaskData.taskDate),
        plannedPickupTime: fleetTaskData.plannedPickupTime ? new Date(fleetTaskData.plannedPickupTime) : null,
        plannedDropTime: fleetTaskData.plannedDropTime ? new Date(fleetTaskData.plannedDropTime) : null
      });

      console.log('=== DEBUG: CREATING FLEET TASK ===');
      const taskResponse = await apiService.createFleetTask(fleetTaskData);
      console.log('=== DEBUG: FLEET TASK API RESPONSE ===', taskResponse);

      if (!taskResponse.success) {
        console.error('=== DEBUG: FLEET TASK CREATION FAILED ===', taskResponse);
        throw new Error(taskResponse.message || 'Failed to create fleet task');
      }

      if (!taskResponse.data || !taskResponse.data.id) {
        throw new Error('Fleet task was created but no ID returned from backend');
      }

      createdFleetTaskId = taskResponse.data.id;
      console.log('✅ Fleet task created successfully with ID:', createdFleetTaskId);

      console.log('=== DEBUG: WAITING FOR DATABASE SYNC ===');
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('=== DEBUG: CREATING PASSENGER RECORDS ===');
      console.log('Passengers to create:', values.passengers);
      
      const passengerPromises = values.passengers.map((passenger, index) => {
        console.log(`=== DEBUG: PROCESSING PASSENGER ${index + 1} ===`, passenger);
        
        const passengerData = {
          id: generateId() + index,
          companyId: Number(companyNumericId),
          companyName: companyName,
          fleetTaskId: Number(createdFleetTaskId),
          workerEmployeeId: Number(passenger.workerEmployeeId || passenger.id || (index + 1)),
          employeeName: passenger.employeeName || `Passenger ${index + 1}`,
          employeeCode: passenger.employeeCode || `EMP${index + 1}`,
          department: passenger.department || 'General',
          pickupLocation: values.pickupLocation || 'Default Pickup',
          dropLocation: values.dropLocation || 'Default Drop',
          status: 'PLANNED',
          createdBy: 1
        };

        console.log(`=== DEBUG: PASSENGER ${index + 1} DATA FOR API ===`, passengerData);

        if (!passengerData.id || !passengerData.companyId || !passengerData.fleetTaskId || !passengerData.workerEmployeeId) {
          throw new Error(`Passenger ${index + 1} missing required fields`);
        }

        return apiService.createFleetTaskPassenger(passengerData)
          .then((result) => {
            console.log(`=== DEBUG: PASSENGER ${index + 1} API RESPONSE ===`, result);
            
            if (!result.success) {
              throw new Error(`Passenger ${index + 1} (${passenger.employeeName || 'Unknown'}): ${result.message || 'Backend creation failed'}`);
            }
            
            return { result, passengerIndex: index + 1 };
          })
          .catch((error) => {
            console.error(`=== DEBUG: PASSENGER ${index + 1} API ERROR ===`, error);
            throw new Error(`Passenger ${index + 1} (${passenger.employeeName || 'Unknown'}): ${error.message || 'Creation failed'}`);
          });
      });

      console.log('=== DEBUG: WAITING FOR ALL PASSENGER CREATIONS ===');
      const passengerResults = await Promise.all(passengerPromises);
      console.log('=== DEBUG: ALL PASSENGERS CREATED SUCCESSFULLY ===', passengerResults);

      console.log(`✅ Successfully created ${passengerResults.length} passenger records`);

      console.log('📧 === CALLING EMAIL NOTIFICATION FOR CREATION ===');
      const emailSent = await sendEmailNotification(
        { ...fleetTaskData, id: createdFleetTaskId }, 
        'create'
      );

      if (emailSent) {
        console.log('✅ Notification sent before showing success message');
      } else {
        console.log('⚠️ Email notification failed, but continuing with success message');
      }

      message.success('Transport Schedule Created Successfully!');
      
      resetForm();
      
      setTimeout(() => {
        navigate('/fleet-tasks');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error creating schedule:', error);
      
      if (createdFleetTaskId) {
        try {
          console.log('=== DEBUG: ATTEMPTING TO CLEAN UP FLEET TASK ===', createdFleetTaskId);
          await apiService.deleteFleetTask(createdFleetTaskId);
          console.log('=== DEBUG: CLEANED UP FLEET TASK ===');
        } catch (cleanupError) {
          console.error('=== DEBUG: CLEANUP FAILED ===', cleanupError);
        }
      }
      
      message.error(`Failed to create transport schedule: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = async (values) => {
    setLoading(true);
    
    try {
      console.log('🔍 === DEBUG: STARTING SCHEDULE UPDATE ===');
      console.log('📋 FORM VALUES:', values);
      console.log('🆔 EDITING TASK ID:', editingTaskId);
      console.log('🏢 CURRENT COMPANY DATA:', { companyNumericId, companyName });
      console.log('📊 CURRENT PROJECT DATA:', { projectNumericId, projectName });
      console.log('📝 ORIGINAL EDIT DATA:', originalEditData);

      if (!values.company || !values.vehicleId || !values.taskDate) {
        throw new Error('Please fill all required fields: Company, Vehicle, and Task Date');
      }

      if (!companyNumericId) {
        throw new Error('Company ID not found. Please select a company again.');
      }

      const formatDateForBackend = (date) => {
        if (!date) return null;
        
        try {
          if (date && date.$d) {
            const jsDate = date.$d;
            return jsDate.toISOString();
          }
          
          if (date instanceof Date) {
            return date.toISOString();
          }
          
          if (typeof date === 'string') {
            return new Date(date).toISOString();
          }
          
          return null;
        } catch (error) {
          console.error('Error formatting date:', error);
          return null;
        }
      };

      const fleetTaskData = {
        companyId: Number(companyNumericId),
        companyName: companyName,
        projectId: projectNumericId ? Number(projectNumericId) : null,
        projectName: projectName,
        driverId: values.driverId ? Number(values.driverId) : null,
        vehicleId: values.vehicleId ? Number(values.vehicleId) : null,
        taskDate: formatDateForBackend(values.taskDate),
        plannedPickupTime: values.pickupTime ? formatDateForBackend(values.pickupTime) : null,
        plannedDropTime: values.dropTime ? formatDateForBackend(values.dropTime) : null,
        pickupLocation: values.pickupLocation,
        dropLocation: values.dropLocation,
        pickupAddress: values.pickupAddress,
        dropAddress: values.dropAddress,
        expectedPassengers: values.passengers ? values.passengers.length : 0,
        notes: values.notes
      };

      console.log('📝 === DEBUG: UPDATING FLEET TASK DATA WITH DATES ===', {
        ...fleetTaskData,
        taskDate: new Date(fleetTaskData.taskDate),
        plannedPickupTime: fleetTaskData.plannedPickupTime ? new Date(fleetTaskData.plannedPickupTime) : null,
        plannedDropTime: fleetTaskData.plannedDropTime ? new Date(fleetTaskData.plannedDropTime) : null
      });
      
      console.log('🔄 === DEBUG: CALLING UPDATE FLEET TASK API ===');
      const updateResponse = await apiService.updateFleetTask(editingTaskId, fleetTaskData);
      console.log('✅ === DEBUG: FLEET TASK UPDATE API RESPONSE ===', updateResponse);
      
      if (!updateResponse.success) {
        console.error('❌ === DEBUG: FLEET TASK UPDATE FAILED ===', updateResponse);
        throw new Error(updateResponse.message || 'Failed to update fleet task');
      }

      console.log('✅ Fleet task updated successfully');

      if (values.passengers) {
        console.log('=== DEBUG: COMPLETE PASSENGER REPLACEMENT ===');
        console.log('Selected passengers in form:', values.passengers);
        
        try {
          console.log('📋 Fetching current passengers for task:', editingTaskId);
          const currentPassengersResponse = await apiService.getFleetTaskPassengersByTaskId(editingTaskId);
          const currentPassengers = Array.isArray(currentPassengersResponse.data) 
            ? currentPassengersResponse.data 
            : [];
          
          console.log('📋 Current passengers in database:', currentPassengers.length);
          
          const normalizedFormPassengers = values.passengers.map(passenger => ({
            employeeCode: passenger.employeeCode,
            employeeName: passenger.employeeName,
            workerEmployeeId: passenger.workerEmployeeId || passenger.id,
            department: passenger.department
          }));
          
          console.log('✅ Normalized form passengers:', normalizedFormPassengers);
          
          const uniqueFormPassengers = removeDuplicatePassengers(normalizedFormPassengers);
          console.log('✅ Unique passengers from form after deduplication:', uniqueFormPassengers.length);
          
          const formPassengerMap = new Map();
          uniqueFormPassengers.forEach(passenger => {
            const key = `${passenger.employeeCode}-${passenger.employeeName}`;
            formPassengerMap.set(key, passenger);
          });
          
          const currentPassengerMap = new Map();
          currentPassengers.forEach(passenger => {
            const key = `${passenger.employeeCode}-${passenger.employeeName}`;
            currentPassengerMap.set(key, passenger);
          });
          
          console.log('🔍 Form passenger keys:', Array.from(formPassengerMap.keys()));
          console.log('🔍 Current passenger keys:', Array.from(currentPassengerMap.keys()));
          
          const passengersToDelete = currentPassengers.filter(passenger => {
            const key = `${passenger.employeeCode}-${passenger.employeeName}`;
            return !formPassengerMap.has(key);
          });
          
          console.log('🗑️ Passengers to delete (not in form):', passengersToDelete.length);
          console.log('Passengers to delete details:', passengersToDelete.map(p => `${p.employeeName} (${p.employeeCode})`));
          
          const passengersToCreate = uniqueFormPassengers.filter(passenger => {
            const key = `${passenger.employeeCode}-${passenger.employeeName}`;
            return !currentPassengerMap.has(key);
          });
          
          console.log('👥 Passengers to create (new in form):', passengersToCreate.length);
          console.log('Passengers to create details:', passengersToCreate.map(p => `${p.employeeName} (${p.employeeCode})`));
          
          if (passengersToDelete.length > 0) {
            console.log('🗑️ Deleting passengers not in form selection...');
            const deletePromises = passengersToDelete.map(passenger => 
              apiService.deleteFleetTaskPassenger(passenger.id)
                .then(() => console.log(`✅ Deleted passenger: ${passenger.employeeName} (${passenger.employeeCode})`))
                .catch(error => {
                  console.error(`❌ Failed to delete passenger ${passenger.employeeName}:`, error);
                  throw new Error(`Failed to remove passenger ${passenger.employeeName}`);
                })
            );
            
            await Promise.all(deletePromises);
            console.log('✅ All unwanted passengers deleted');
          }
          
          if (passengersToCreate.length > 0) {
            console.log('👥 Creating new passengers from form...');
            const createPromises = passengersToCreate.map((passenger, index) => {
              const employeeId = passenger.workerEmployeeId || passenger.id || (index + 1000);
              
              const passengerData = {
                id: Math.floor(Math.random() * 1000000) + 1 + index,
                companyId: Number(companyNumericId),
                companyName: companyName,
                fleetTaskId: Number(editingTaskId),
                workerEmployeeId: Number(employeeId),
                employeeName: passenger.employeeName || `Passenger ${index + 1}`,
                employeeCode: passenger.employeeCode || `EMP${index + 1}`,
                department: passenger.department || 'General',
                pickupLocation: values.pickupLocation || 'Default Pickup',
                dropLocation: values.dropLocation || 'Default Drop',
                status: 'PLANNED',
                createdBy: 1
              };

              console.log(`📝 Creating new passenger:`, passengerData);

              return apiService.createFleetTaskPassenger(passengerData)
                .then((result) => {
                  console.log(`✅ Created passenger: ${passenger.employeeName} (${passenger.employeeCode})`);
                  return result;
                })
                .catch((error) => {
                  console.error(`❌ Failed to create passenger ${passenger.employeeName}:`, error);
                  throw new Error(`Failed to add passenger ${passenger.employeeName}: ${error.message}`);
                });
            });

            await Promise.all(createPromises);
            console.log('✅ All new passengers created');
          } else {
            console.log('ℹ️ No new passengers to create');
          }

          console.log('🎯 Final passenger state:', {
            'Deleted': passengersToDelete.length,
            'Created': passengersToCreate.length,
            'Kept': currentPassengers.length - passengersToDelete.length,
            'Total in DB after update': (currentPassengers.length - passengersToDelete.length) + passengersToCreate.length
          });

        } catch (error) {
          console.error('❌ Error in passenger update:', error);
          throw new Error(`Passenger update failed: ${error.message}`);
        }
      } else {
        console.log('⚠️ No passengers selected - deleting all existing passengers');
        try {
          await apiService.deleteFleetTaskPassengersByTaskId(editingTaskId);
          console.log('✅ All passengers deleted (none selected in form)');
        } catch (error) {
          console.warn('⚠️ Could not delete passengers:', error.message);
        }
      }

      console.log('📧 === CALLING EMAIL NOTIFICATION FOR UPDATE ===');
      const emailSent = await sendEmailNotification(
        { ...fleetTaskData, id: editingTaskId }, 
        'update'
      );

      if (emailSent) {
        console.log('✅ Notification sent before showing success message');
      } else {
        console.log('⚠️ Email notification failed, but continuing with success message');
      }

      message.success('Transport Schedule Updated Successfully!');
      
      resetForm();
      setIsEditing(false);
      setEditingTaskId(null);
      setEditTaskData(null);
      setOriginalEditData(null);
      
      setTimeout(() => {
        navigate('/fleet-tasks');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error updating schedule:', error);
      message.error(`Failed to update transport schedule: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setSelectedCompany(null);
    setProjectName('');
    setCompanyNumericId(null);
    setProjectNumericId(null);
    setIsEditing(false);
    setEditingTaskId(null);
    setCompanyName('');
    setEditTaskData(null);
    setOriginalEditData(null);
    console.log('🔄 Form reset completed');
  };

  return (
    <div>
      <Card 
        className="shadow-sm"
        title={
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold text-gray-800">
              {isEditing ? 'Edit Transport Schedule' : 'Create New Transport Schedule'}
            </div>
            {isEditing && (
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Editing Task #{editingTaskId}
              </div>
            )}
          </div>
        }
      >
        <Form
          form={form}
          name="transport-schedule"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
          validateMessages={{
            required: '${label} is required!',
          }}
          validateTrigger={['onChange', 'onBlur', 'onSubmit']}
        >
          <BasicDetailsForm 
            onCompanyChange={handleCompanyChange} 
            onProjectChange={handleProjectChange}
            form={form}
            isEditing={isEditing}
            editTaskData={editTaskData}
          />
          <VehicleDriverAssignment 
            selectedCompany={selectedCompany} 
            form={form}
            companyNumericId={companyNumericId}
            isEditing={isEditing}
            editTaskData={editTaskData}
          />
          <PickupDropLocations form={form} />
          <PassengerAssignment 
            form={form} 
            companyNumericId={companyNumericId}
          />

          <Row justify="end">
            <Col>
              <div className="flex space-x-3">
                <Button 
                  size="large" 
                  onClick={resetForm}
                  disabled={loading}
                  style={{ 
                    minWidth: '100px',
                    height: '40px',
                    fontSize: '14px',
                  }}
                  className="border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 hover:bg-gray-50"
                >
                  {isEditing ? 'Cancel Edit' : 'Cancel'}
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  loading={loading}
                  style={{ 
                    minWidth: '140px',
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  className="bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                >
                  {isEditing ? 'Update Schedule' : 'Create Schedule'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default HomePage;
// src/pages/CreateTaskPage.jsx
import React from 'react';
import { Form, Button, Card, message } from 'antd';
import BasicDetailsForm from '../components/transport/BasicDetailsForm';
import VehicleDriverAssignment from '../components/transport/VehicleDriverAssignment';
import PickupDropLocations from '../components/transport/PickupDropLocations';
import PassengerAssignment from '../components/transport/PassengerAssignment';
import { fleetTaskService } from '../services/fleetTaskService'; // FIXED: Named import
import { useNavigate } from 'react-router-dom'; // ADDED: For navigation

const CreateTaskPage = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);
  const [companyNumericId, setCompanyNumericId] = React.useState(null);
  const [projectNumericId, setProjectNumericId] = React.useState(null);
  const [projectName, setProjectName] = React.useState('');
  const navigate = useNavigate(); // ADDED: For navigation

  const handleCompanyChange = async (companyMongoId, numericCompanyId) => {
    console.log('Company changed to:', numericCompanyId);
    
    // Reset ALL state
    setCompanyNumericId(numericCompanyId);
    setProjectName('');
    setProjectNumericId(null);

    // Use setTimeout to ensure form reset happens after state update
    setTimeout(() => {
      // Reset ALL form fields - use null instead of undefined
      form.setFieldsValue({
        company: companyMongoId,
        project: null,
        vehicleId: null,
        driverId: null,
        passengers: [],
        taskDate: null,
        pickupTime: null,
        dropTime: null,
        pickupLocation: '',
        dropLocation: ''
      });
    }, 0);

    console.log('Form reset complete for company:', numericCompanyId);
  };

  const handleProjectChange = (projectMongoId, projectName, numericId) => {
    setProjectName(projectName);
    setProjectNumericId(numericId);
    console.log('Project selected:', projectName, 'ID:', numericId);
  };

  const resetForm = () => {
    form.resetFields();
    setCompanyNumericId(null);
    setProjectNumericId(null);
    setProjectName('');
  };

  const onFinish = async (values) => {
    console.log("=== FORM VALUES ===", values);
    
    try {
      setSubmitting(true);

      const taskData = {
        // REMOVED: id field (backend will auto-generate)
        companyId: companyNumericId,
        projectId: projectNumericId || null,
        driverId: values.driverId ? parseInt(values.driverId) : null,
        vehicleId: parseInt(values.vehicleId),
        taskDate: values.taskDate ? values.taskDate.toISOString() : new Date().toISOString(),
        plannedPickupTime: values.pickupTime ? values.pickupTime.toISOString() : null,
        plannedDropTime: values.dropTime ? values.dropTime.toISOString() : null,
        pickupLocation: values.pickupLocation || '',
        pickupAddress: values.pickupAddress || '', // ADDED: pickupAddress
        dropLocation: values.dropLocation || '',
        dropAddress: values.dropAddress || '', // ADDED: dropAddress
        expectedPassengers: values.passengers ? values.passengers.length : 0,
        status: 'PLANNED',
        notes: values.notes || '', // ADDED: notes field
        createdBy: 1, // You might want to get this from user context
      };

      console.log('=== FINAL TASK DATA ===', taskData);

      const response = await fleetTaskService.createFleetTask(taskData);
      
      if (response.data && response.data.success) {
        message.success('Fleet task created successfully!');
        resetForm();
        // Navigate back to fleet tasks page after successful creation
        navigate('/fleet-tasks');
      } else {
        message.error(response.data?.message || 'Failed to create task');
      }
      
    } catch (error) {
      console.error('Task creation error:', error);
      if (error.response?.data?.message) {
        message.error(`Error: ${error.response.data.message}`);
      } else {
        message.error('Error creating task. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form validation failed:', errorInfo);
    message.error('Please fill in all required fields correctly.');
  };

  const handleCancel = () => {
    resetForm();
    navigate('/fleet-tasks'); // Navigate back to fleet tasks page
  };

  return (
    <div className="p-6">
      <Card 
        title="Create New Fleet Task" 
        className="max-w-4xl mx-auto"
        extra={
          <Button onClick={handleCancel}>
            Back to Tasks
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          size="large"
        >
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-700 font-medium mb-2">
              Debug Information:
            </div>
            <div className="text-sm text-blue-600">
              Company ID: {companyNumericId || 'Not selected'}
            </div>
            {projectName && (
              <div className="text-sm text-blue-600 mt-1">
                Project: {projectName} (ID: {projectNumericId})
              </div>
            )}
          </div>

          {/* Basic Details */}
          <BasicDetailsForm 
            onCompanyChange={handleCompanyChange} 
            onProjectChange={handleProjectChange}
            form={form}
          />

          {/* Vehicle & Driver */}
          <VehicleDriverAssignment 
            selectedCompany={companyNumericId}
            form={form}
          />

          {/* Pickup & Drop Locations */}
          <PickupDropLocations form={form} />

          {/* Passenger Assignment */}
          <PassengerAssignment form={form} />

          <Form.Item className="mt-6">
            <div className="flex space-x-3">
              <Button 
                size="large" 
                onClick={handleCancel}
                disabled={submitting}
                style={{ 
                  minWidth: '100px',
                  height: '40px',
                  fontSize: '14px',
                }}
                className="border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={submitting}
                style={{ 
                  minWidth: '140px',
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                className="bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                disabled={!companyNumericId || !form.getFieldValue('vehicleId')}
              >
                {submitting ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateTaskPage;
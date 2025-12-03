// pages/JsCreateTaskPage.js
import React, { useState, useEffect } from 'react';
import { Form, Steps, Button, Card, message, Alert, Modal, Spin, Tag } from 'antd';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon,
  DocumentTextIcon,
  BugAntIcon,
  TruckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import JsBasicDetailsForm from '../components/transport/JsBasicDetailsForm';
import JsVehicleDriverAssignment from '../components/transport/JsVehicleDriverAssignment';
import JsPassengerAssignment from '../components/transport/JsPassengerAssignment';
import JsPickupDropLocations from '../components/transport/JsPickupDropLocations';
import { 
  fleetTaskService, 
  fleetTaskPassengerService,
  companyService,
  vehicleService,
  driverService,
  employeeService,
  projectService
} from '../services';

const { Step } = Steps;

const JsCreateTaskPage = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [debugData, setDebugData] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [apiStatus, setApiStatus] = useState({ working: false, message: '' });
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [creationLog, setCreationLog] = useState([]);

  // Company ID - should match your actual company ID in database
  const companyId = 1;

  const steps = [
    {
      title: 'Basic Details',
      icon: '📋',
      component: <JsBasicDetailsForm form={form} companies={companies} projects={projects} />
    },
    {
      title: 'Vehicle & Driver',
      icon: '🚗',
      component: <JsVehicleDriverAssignment form={form} vehicles={vehicles} drivers={drivers} loading={dataLoading} />
    },
    {
      title: 'Locations',
      icon: '📍',
      component: <JsPickupDropLocations form={form} />
    },
    {
      title: 'Passengers',
      icon: '👥',
      component: (
        <JsPassengerAssignment 
          form={form} 
          companyId={companyId}
          employees={employees}
          selectedPassengers={selectedPassengers}
          onPassengersChange={setSelectedPassengers}
          loading={dataLoading}
        />
      )
    }
  ];

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setCreationLog(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    addLog('🚀 Page loaded - initializing...');
    
    // Generate unique numeric ID for the task
    const taskId = Math.floor(100000 + Math.random() * 900000);
    form.setFieldValue('id', taskId);
    form.setFieldValue('companyId', companyId);
    form.setFieldValue('status', 'PLANNED');
    
    addLog(`📝 Generated Task ID: ${taskId}`);
    addLog(`🏢 Set Company ID: ${companyId}`);
    
    // Fetch initial data and test API connection
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setDataLoading(true);
    addLog('📡 Fetching initial data from API...');
    
    try {
      // Fetch all required data
      const [companiesData, vehiclesData, driversData, employeesData, projectsData] = await Promise.allSettled([
        companyService.getCompanies(),
        vehicleService.getVehiclesByCompany(companyId),
        driverService.getDriversByCompany(companyId),
        employeeService.getEmployeesByCompany(companyId),
        projectService.getProjectsByCompany?.(companyId) || projectService.getAllProjects?.() || Promise.resolve([])
      ]);

      // Set companies
      if (companiesData.status === 'fulfilled') {
        const companiesResult = companiesData.value.data || companiesData.value || [];
        setCompanies(Array.isArray(companiesResult) ? companiesResult : []);
        addLog(`🏢 Loaded ${companiesResult.length} companies`);
      }

      // Set vehicles
      if (vehiclesData.status === 'fulfilled') {
        const vehiclesResult = vehiclesData.value.data || vehiclesData.value || [];
        setVehicles(Array.isArray(vehiclesResult) ? vehiclesResult : []);
        addLog(`🚗 Loaded ${vehiclesResult.length} vehicles`);
      }

      // Set drivers
      if (driversData.status === 'fulfilled') {
        const driversResult = driversData.value.data || driversData.value || [];
        setDrivers(Array.isArray(driversResult) ? driversResult : []);
        addLog(`👨‍💼 Loaded ${driversResult.length} drivers`);
      }

      // Set employees
      if (employeesData.status === 'fulfilled') {
        const employeesResult = employeesData.value.data || employeesData.value || [];
        setEmployees(Array.isArray(employeesResult) ? employeesResult : []);
        addLog(`👥 Loaded ${employeesResult.length} employees`);
      }

      // Set projects
      if (projectsData.status === 'fulfilled') {
        const projectsResult = projectsData.value.data || projectsData.value || [];
        setProjects(Array.isArray(projectsResult) ? projectsResult : []);
        addLog(`📋 Loaded ${projectsResult.length} projects`);
      }

      // Test API connection
      await testApiConnection();

      addLog('✅ All data loaded successfully');

    } catch (error) {
      addLog(`❌ Error loading data: ${error.message}`, 'error');
      message.error('Failed to load initial data');
    } finally {
      setDataLoading(false);
    }
  };

  const testApiConnection = async () => {
    addLog('🔌 Testing API connection...');
    try {
      const response = await fleetTaskService.getFleetTasks();
      setApiStatus({ working: true, message: '✅ API connected successfully' });
      addLog('✅ API connection successful');
    } catch (error) {
      setApiStatus({ 
        working: false, 
        message: `❌ API connection failed: ${error.message}`
      });
      addLog(`❌ API connection failed: ${error.message}`, 'error');
    }
  };

  const nextStep = async () => {
    try {
      const fields = getStepFields(currentStep);
      addLog(`➡️ Moving to step ${currentStep + 1}, validating fields: ${fields.join(', ')}`);
      await form.validateFields(fields);
      setCurrentStep(currentStep + 1);
      addLog(`✅ Step ${currentStep + 1} validation passed`);
    } catch (error) {
      addLog(`❌ Step validation failed: ${error.errorFields?.[0]?.errors?.[0] || 'Unknown error'}`, 'error');
      message.error('Please fill all required fields');
    }
  };

  const prevStep = () => {
    addLog(`⬅️ Moving back to step ${currentStep - 1}`);
    setCurrentStep(currentStep - 1);
  };

  const getStepFields = (step) => {
    const stepFields = {
      0: ['companyId', 'taskDate', 'plannedPickupTime', 'plannedDropTime'],
      1: ['vehicleId'],
      2: [],
      3: []
    };
    return stepFields[step] || [];
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      addLog('🎯 Starting fleet task creation process...');
      
      const values = await form.validateFields();
      addLog('✅ Form validation passed');
      
      console.log('📝 Form values:', values);

      // Prepare fleetTask data - MATCHING YOUR BACKEND EXPECTATIONS
      const fleetTaskData = {
        id: parseInt(values.id),
        companyId: parseInt(values.companyId),
        projectId: values.projectId ? parseInt(values.projectId) : null,
        driverId: values.driverId ? parseInt(values.driverId) : null,
        vehicleId: parseInt(values.vehicleId),
        taskDate: values.taskDate ? values.taskDate.format('YYYY-MM-DD') + 'T00:00:00.000Z' : null,
        plannedPickupTime: values.taskDate && values.plannedPickupTime 
          ? `${values.taskDate.format('YYYY-MM-DD')}T${values.plannedPickupTime.format('HH:mm:ss')}.000Z`
          : null,
        plannedDropTime: values.taskDate && values.plannedDropTime 
          ? `${values.taskDate.format('YYYY-MM-DD')}T${values.plannedDropTime.format('HH:mm:ss')}.000Z`
          : null,
        pickupAddress: values.pickupAddress || '',
        dropAddress: values.dropAddress || '',
        expectedPassengers: values.expectedPassengers || 0,
        notes: values.notes || '',
        status: 'PLANNED',
        // Add missing fields that backend expects
        pickupLocation: null,
        dropLocation: null,
        actualStartTime: null,
        actualEndTime: null,
        routeLog: [],
        createdBy: null
      };

      addLog('📦 Prepared fleet task data for backend');
      console.log('🟡 FRONTEND: Sending to backend:', fleetTaskData);
      setDebugData({ type: 'fleetTask', data: fleetTaskData });

      // Create fleet task in MongoDB
      addLog('📤 Sending request to backend API...');
      const taskResponse = await fleetTaskService.createFleetTask(fleetTaskData);
      
      addLog('✅ Backend response received');
      console.log('✅ FRONTEND: Backend response:', taskResponse);

      if (taskResponse.success) {
        const createdTask = taskResponse.data;
        
        addLog(`🎉 Fleet task created successfully! Task ID: ${createdTask.id}`);
        
        // Store debug info
        setDebugData(prev => ({
          ...prev,
          fleetTaskResponse: taskResponse,
          createdTaskId: createdTask.id
        }));

        // Create fleet task passengers if any selected
        if (selectedPassengers.length > 0) {
          addLog(`👥 Creating ${selectedPassengers.length} passengers...`);
          await createFleetTaskPassengers(createdTask.id, selectedPassengers);
        }

        message.success('Transport Schedule Created Successfully!');
        
        // Show debug modal
        setShowDebug(true);

        // Reset form after success
        setTimeout(() => {
          form.resetFields();
          setSelectedPassengers([]);
          setCurrentStep(0);
          // Generate new ID for next task
          const newTaskId = Math.floor(100000 + Math.random() * 900000);
          form.setFieldValue('id', newTaskId);
          form.setFieldValue('companyId', companyId);
          addLog(`🔄 Form reset, new Task ID: ${newTaskId}`);
        }, 3000);
      }
    } catch (error) {
      addLog(`💥 Creation failed: ${error.message}`, 'error');
      console.error('❌ FRONTEND: Error creating task:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to create transport task';
      
      addLog(`❌ Error details: ${errorMessage}`, 'error');
      message.error(`Creation Failed: ${errorMessage}`);
      
      // Store error in debug data
      setDebugData(prev => ({
        ...prev,
        error: errorMessage,
        errorDetails: error.response?.data
      }));
      setShowDebug(true);
    } finally {
      setLoading(false);
    }
  };

  const createFleetTaskPassengers = async (fleetTaskId, passengerIds) => {
    try {
      const passengerPromises = passengerIds.map((employeeId) => {
        const passengerData = {
          id: Math.floor(100000 + Math.random() * 900000),
          companyId: companyId,
          fleetTaskId: fleetTaskId,
          workerEmployeeId: employeeId,
          status: 'PLANNED',
          pickupConfirmedAt: null,
          dropConfirmedAt: null,
          notes: null
        };
        return fleetTaskPassengerService.createFleetTaskPassenger(passengerData);
      });

      await Promise.all(passengerPromises);
      addLog(`✅ Created ${passengerIds.length} passengers for task ${fleetTaskId}`);
    } catch (error) {
      addLog(`❌ Error creating passengers: ${error.message}`, 'error');
      throw error;
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Loading real-time data...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <Card className="mb-4 sm:mb-6 shadow-sm rounded-lg border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Create New Transport Schedule
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Real-time MongoDB Storage • Company ID: {companyId}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                Task ID: {form.getFieldValue('id') || 'Generating...'}
              </div>
              <div className="flex gap-2">
                <Tag icon={<TruckIcon className="w-3 h-3" />} color="green">
                  {vehicles.length} Vehicles
                </Tag>
                <Tag icon={<UserGroupIcon className="w-3 h-3" />} color="purple">
                  {employees.length} Employees
                </Tag>
              </div>
              <Button 
                size="small" 
                icon={<BugAntIcon className="w-4 h-4" />}
                onClick={() => setShowDebug(true)}
                className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
              >
                Debug Logs
              </Button>
            </div>
          </div>
        </Card>

        {/* API Status */}
        {!apiStatus.working && (
          <Alert
            message="API Connection Issue"
            description={apiStatus.message}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {/* Steps */}
        <Card className="mb-4 sm:mb-6 shadow-sm rounded-lg border border-gray-200">
          <Steps current={currentStep} className="w-full" size="small">
            {steps.map((step, index) => (
              <Step 
                key={index} 
                title={<span className="hidden sm:inline text-xs sm:text-sm">{step.title}</span>}
                icon={<span className="text-xs sm:text-sm">{step.icon}</span>}
              />
            ))}
          </Steps>
        </Card>

        {/* Form Content */}
        <Form form={form} layout="vertical" size="large" className="mb-4 sm:mb-6">
          {steps[currentStep].component}
        </Form>

        {/* Navigation Buttons */}
        <Card className="shadow-sm rounded-lg border border-gray-200">
          <div className="flex justify-between items-center gap-3">
            <Button
              size="large"
              icon={<ArrowLeftIcon className="w-4 h-4" />}
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={nextStep}
                icon={<ArrowRightIcon className="w-4 h-4" />}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border-blue-600 rounded-lg"
              >
                <span className="hidden sm:inline">Next</span>
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={handleSubmit}
                icon={<CheckIcon className="w-4 h-4" />}
                disabled={vehicles.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 border-green-600 rounded-lg"
              >
                <span className="hidden sm:inline">
                  {vehicles.length === 0 ? 'No Vehicles Available' : 'Create Transport Schedule'}
                </span>
                <span className="sm:hidden">
                  {vehicles.length === 0 ? 'No Vehicles' : 'Create'}
                </span>
              </Button>
            )}
          </div>
        </Card>

        {/* Debug Modal */}
        <Modal
          title="🔍 Real-time Debug Information"
          open={showDebug}
          onCancel={() => setShowDebug(false)}
          footer={[
            <Button key="close" onClick={() => setShowDebug(false)}>
              Close
            </Button>,
            <Button 
              key="retry" 
              type="primary" 
              onClick={testApiConnection}
            >
              Test API Again
            </Button>
          ]}
          width={1000}
        >
          <div className="space-y-4">
            {/* API Status */}
            <Alert
              message={apiStatus.message}
              type={apiStatus.working ? 'success' : 'error'}
              showIcon
            />
            
            {/* Data Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-blue-50 p-3 rounded border">
                <div className="font-semibold text-blue-800">Companies</div>
                <div className="text-blue-600">{companies.length} found</div>
                {companies.slice(0, 2).map(company => (
                  <div key={company.id} className="text-xs text-blue-500">ID {company.id}: {company.name}</div>
                ))}
              </div>
              <div className="bg-green-50 p-3 rounded border">
                <div className="font-semibold text-green-800">Vehicles</div>
                <div className="text-green-600">{vehicles.length} found</div>
                {vehicles.slice(0, 2).map(vehicle => (
                  <div key={vehicle.id} className="text-xs text-green-500">ID {vehicle.id}: {vehicle.registrationNo}</div>
                ))}
              </div>
              <div className="bg-purple-50 p-3 rounded border">
                <div className="font-semibold text-purple-800">Employees</div>
                <div className="text-purple-600">{employees.length} found</div>
                {employees.slice(0, 2).map(employee => (
                  <div key={employee.id} className="text-xs text-purple-500">ID {employee.id}: {employee.fullName}</div>
                ))}
              </div>
              <div className="bg-orange-50 p-3 rounded border">
                <div className="font-semibold text-orange-800">Drivers</div>
                <div className="text-orange-600">{drivers.length} found</div>
                {drivers.slice(0, 2).map(driver => (
                  <div key={driver.id} className="text-xs text-orange-500">ID {driver.id}: {driver.name}</div>
                ))}
              </div>
            </div>

            {/* Real-time Logs */}
            <div>
              <h4 className="font-semibold mb-2">📋 Real-time Logs:</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto">
                {creationLog.slice(-20).map((log, index) => (
                  <div key={index} className={`${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    [{log.timestamp}] {log.message}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Request/Response Data */}
            {debugData && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">📤 Sent to Backend:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40 border">
                    {JSON.stringify(debugData.data, null, 2)}
                  </pre>
                </div>
                
                {debugData.fleetTaskResponse && (
                  <div>
                    <h4 className="font-semibold mb-2">📥 Backend Response:</h4>
                    <pre className="bg-green-50 p-3 rounded text-xs overflow-auto max-h-40 border border-green-200">
                      {JSON.stringify(debugData.fleetTaskResponse, null, 2)}
                    </pre>
                  </div>
                )}
                
                {debugData.error && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">❌ Error:</h4>
                    <pre className="bg-red-50 p-3 rounded text-xs overflow-auto max-h-40 border border-red-200">
                      {JSON.stringify({
                        message: debugData.error,
                        details: debugData.errorDetails
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default JsCreateTaskPage;
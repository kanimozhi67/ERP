import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Select, 
  Input, 
  TimePicker, 
  InputNumber, 
  Card, 
  Space, 
  Button, 
  List,
  Tag,
  Divider,
  Spin,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  MinusCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

const API_BASE_URL = 'http://localhost:5000/api';

const TransportTaskForm = ({ form, selectedCompany }) => {
  const [transportType, setTransportType] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tools, setTools] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingTools, setLoadingTools] = useState(false);

  // Fetch data when company changes
  useEffect(() => {
    if (selectedCompany?.id) {
      fetchDrivers(selectedCompany.id);
      fetchVehicles(selectedCompany.id);
    } else {
      // Reset all data if no company selected
      setDrivers([]);
      setVehicles([]);
      setWorkers([]);
      setMaterials([]);
      setTools([]);
    }
  }, [selectedCompany]);

  // Fetch workers, materials, tools when transport type changes and company is selected
  useEffect(() => {
    if (selectedCompany?.id && transportType) {
      switch (transportType) {
        case 'WORKER':
          fetchWorkers(selectedCompany.id);
          break;
        case 'MATERIAL':
          fetchMaterials(selectedCompany.id);
          break;
        case 'TOOL':
          fetchTools(selectedCompany.id);
          break;
        default:
          break;
      }
    }
  }, [transportType, selectedCompany]);

  const fetchDrivers = async (companyId) => {
    setLoadingDrivers(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/employees/company/${companyId}`);
      let driversData = [];
      if (Array.isArray(response.data)) {
        driversData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        driversData = response.data.data;
      }
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchVehicles = async (companyId) => {
    setLoadingVehicles(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/company/${companyId}`);
      let vehiclesData = [];
      if (Array.isArray(response.data)) {
        vehiclesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        vehiclesData = response.data.data;
      }
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchWorkers = async (companyId) => {
    setLoadingWorkers(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/workers/company/${companyId}`);
      let workersData = [];
      if (Array.isArray(response.data)) {
        workersData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        workersData = response.data.data;
      }
      setWorkers(workersData);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchMaterials = async (companyId) => {
    setLoadingMaterials(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/materials/company/${companyId}`);
      let materialsData = [];
      if (Array.isArray(response.data)) {
        materialsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        materialsData = response.data.data;
      }
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const fetchTools = async (companyId) => {
    setLoadingTools(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tools/company/${companyId}`);
      let toolsData = [];
      if (Array.isArray(response.data)) {
        toolsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        toolsData = response.data.data;
      }
      setTools(toolsData);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setTools([]);
    } finally {
      setLoadingTools(false);
    }
  };

  const renderPassengersItemsSection = () => {
    if (!selectedCompany) {
      return (
        <Alert 
          message="Please select a company first to load passengers/items" 
          type="info" 
          showIcon 
        />
      );
    }

    switch (transportType) {
      case 'WORKER':
        return (
          <Spin spinning={loadingWorkers}>
            <Form.Item 
              name={['additional_data', 'workers']} 
              label="Select Workers"
              rules={transportType === 'WORKER' ? [{ required: true, message: 'Please select workers' }] : []}
            >
              <Select 
                mode="multiple" 
                placeholder="Select workers to transport"
                showSearch
                optionFilterProp="children"
                loading={loadingWorkers}
                disabled={!selectedCompany}
              >
                {workers.map(worker => (
                  <Option key={worker.id} value={worker.id}>
                    {worker.name} - {worker.role || worker.department || 'Worker'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Spin>
        );

      case 'MATERIAL':
        return (
          <Spin spinning={loadingMaterials}>
            <Form.List name={['additional_data', 'materialQuantities']}>
              {(fields, { add, remove }) => (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">Materials to Transport</span>
                    <Button 
                      type="dashed" 
                      onClick={() => add()} 
                      icon={<PlusOutlined />}
                      disabled={!selectedCompany}
                    >
                      Add Material
                    </Button>
                  </div>
                  
                  {fields.map((field, index) => (
                    <Space key={field.key} className="flex w-full mb-2" align="baseline">
                      <Form.Item
                        {...field}
                        name={[field.name, 'materialId']}
                        rules={[{ required: true, message: 'Select material' }]}
                        className="flex-1"
                      >
                        <Select 
                          placeholder="Select material" 
                          showSearch
                          optionFilterProp="children"
                          loading={loadingMaterials}
                        >
                          {materials.map(material => (
                            <Option key={material.id} value={material.id}>
                              {material.name} ({material.unit || 'units'})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'quantity']}
                        rules={[{ required: true, message: 'Enter quantity' }]}
                        className="w-32"
                      >
                        <InputNumber placeholder="Qty" min={1} style={{ width: '100%' }} />
                      </Form.Item>
                      <MinusCircleOutlined 
                        onClick={() => remove(field.name)} 
                        className="text-red-500 cursor-pointer"
                      />
                    </Space>
                  ))}
                  
                  {fields.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No materials added. Click "Add Material" to start.
                    </div>
                  )}
                </div>
              )}
            </Form.List>
          </Spin>
        );

      case 'TOOL':
        return (
          <Spin spinning={loadingTools}>
            <Form.List name={['additional_data', 'toolQuantities']}>
              {(fields, { add, remove }) => (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">Tools to Transport</span>
                    <Button 
                      type="dashed" 
                      onClick={() => add()} 
                      icon={<PlusOutlined />}
                      disabled={!selectedCompany}
                    >
                      Add Tool
                    </Button>
                  </div>
                  
                  {fields.map((field, index) => (
                    <Space key={field.key} className="flex w-full mb-2" align="baseline">
                      <Form.Item
                        {...field}
                        name={[field.name, 'toolId']}
                        rules={[{ required: true, message: 'Select tool' }]}
                        className="flex-1"
                      >
                        <Select 
                          placeholder="Select tool" 
                          showSearch
                          optionFilterProp="children"
                          loading={loadingTools}
                        >
                          {tools.map(tool => (
                            <Option key={tool.id} value={tool.id}>
                              {tool.name} ({tool.toolType || 'Tool'})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'quantity']}
                        rules={[{ required: true, message: 'Enter quantity' }]}
                        className="w-32"
                      >
                        <InputNumber placeholder="Qty" min={1} style={{ width: '100%' }} />
                      </Form.Item>
                      <MinusCircleOutlined 
                        onClick={() => remove(field.name)} 
                        className="text-red-500 cursor-pointer"
                      />
                    </Space>
                  ))}
                  
                  {fields.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No tools added. Click "Add Tool" to start.
                    </div>
                  )}
                </div>
              )}
            </Form.List>
          </Spin>
        );

      default:
        return (
          <div className="text-gray-500 text-center py-4">
            Select a transport type to configure passengers/items
          </div>
        );
    }
  };

  return (
    <Card title="🚐 Transport Task Details" size="small" className="mb-4">
      {!selectedCompany && (
        <Alert 
          message="Company selection required" 
          description="Please select a company first to load drivers and vehicles."
          type="warning" 
          showIcon 
          className="mb-4"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver Selection */}
        <Form.Item 
          name={['additional_data', 'driverId']} 
          label="Driver"
          rules={[{ required: true, message: 'Please select a driver' }]}
        >
          <Select 
            placeholder={selectedCompany ? "Select driver" : "Select company first"}
            showSearch
            optionFilterProp="children"
            loading={loadingDrivers}
            disabled={!selectedCompany}
          >
            {drivers.map(driver => (
              <Option key={driver.id} value={driver.id}>
                {driver.fullName} - {driver.employeeCode} ({driver.jobTitle})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Vehicle Selection */}
        <Form.Item 
          name={['additional_data', 'vehicleId']} 
          label="Vehicle"
          rules={[{ required: true, message: 'Please select a vehicle' }]}
        >
          <Select 
            placeholder={selectedCompany ? "Select vehicle" : "Select company first"}
            showSearch
            optionFilterProp="children"
            loading={loadingVehicles}
            disabled={!selectedCompany}
          >
            {vehicles.map(vehicle => (
              <Option key={vehicle.id} value={vehicle.id}>
                {vehicle.registrationNo} - {vehicle.vehicleType} ({vehicle.vehicleCode})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Transport Type */}
        <Form.Item 
          name={['additional_data', 'transportType']} 
          label="Transport Type"
          rules={[{ required: true, message: 'Please select transport type' }]}
        >
          <Select 
            placeholder="Select transport type" 
            onChange={setTransportType}
            disabled={!selectedCompany}
          >
            <Option value="WORKER">Worker Transport</Option>
            <Option value="MATERIAL">Material Transport</Option>
            <Option value="TOOL">Tool Transport</Option>
          </Select>
        </Form.Item>

        {/* Pickup Location */}
        <Form.Item 
          name={['additional_data', 'pickupLocation']} 
          label="Pickup Location"
          rules={[{ required: true, message: 'Please enter pickup location' }]}
        >
          <Input placeholder="Enter pickup location" />
        </Form.Item>

        {/* Drop Location */}
        <Form.Item 
          name={['additional_data', 'dropLocation']} 
          label="Drop Location"
          rules={[{ required: true, message: 'Please enter drop location' }]}
        >
          <Input placeholder="Enter drop location" />
        </Form.Item>

        {/* Pickup Time */}
        <Form.Item 
          name={['additional_data', 'pickupTime']} 
          label="Pickup Time"
          rules={[{ required: true, message: 'Please select pickup time' }]}
        >
          <TimePicker 
            format="HH:mm" 
            placeholder="Select pickup time" 
            style={{ width: '100%' }}
            minuteStep={5}
          />
        </Form.Item>

        {/* Drop Time */}
        <Form.Item 
          name={['additional_data', 'dropTime']} 
          label="Drop Time"
          rules={[{ required: true, message: 'Please select drop time' }]}
        >
          <TimePicker 
            format="HH:mm" 
            placeholder="Select drop time" 
            style={{ width: '100%' }}
            minuteStep={5}
          />
        </Form.Item>
      </div>

      {/* Passengers / Items Section */}
      <Divider>Passengers / Items</Divider>
      {renderPassengersItemsSection()}

      {/* Remarks */}
      <Form.Item 
        name={['additional_data', 'remarks']} 
        label="Remarks"
        className="mt-4"
      >
        <TextArea 
          rows={3} 
          placeholder="Enter any additional remarks or instructions" 
        />
      </Form.Item>
    </Card>
  );
};

export default TransportTaskForm;
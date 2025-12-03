// src/components/transport/VehicleDriverAssignment.jsx
import React, { useState, useEffect } from 'react';
import { Form, Select, Row, Col, Spin, Alert } from 'antd';
import { CarOutlined, UserOutlined } from '@ant-design/icons';
import apiService from '../../services/apiService';

const { Option } = Select;

const VehicleDriverAssignment = ({ selectedCompany, form, companyNumericId, isEditing, editTaskData }) => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (companyNumericId) {
      loadDataByCompany(companyNumericId);
    } else {
      resetData();
    }
  }, [companyNumericId]);

  // Handle edit data initialization
  useEffect(() => {
    if (isEditing && editTaskData && companyNumericId && !hasInitialized) {
      initializeEditData();
    }
  }, [isEditing, editTaskData, companyNumericId, hasInitialized]);

  const initializeEditData = () => {
    console.log('🎯 INITIALIZING VEHICLE/DRIVER EDIT DATA');
    
    // Set vehicle and driver values from edit data
    setTimeout(() => {
      if (editTaskData.vehicleId) {
        form.setFieldsValue({
          vehicleId: editTaskData.vehicleId.toString()
        });
        console.log('🚗 Set vehicle ID:', editTaskData.vehicleId);
      }
      
      if (editTaskData.driverId) {
        form.setFieldsValue({
          driverId: editTaskData.driverId.toString()
        });
        console.log('👤 Set driver ID:', editTaskData.driverId);
      }
      
      setHasInitialized(true);
    }, 1000);
  };

  const resetData = () => {
    setVehicles([]);
    setDrivers([]);
    setApiErrors([]);
    setHasInitialized(false);
    // Force clear the form values
    if (form) {
      form.setFieldsValue({
        vehicleId: undefined,
        driverId: undefined
      });
    }
  };

  const loadDataByCompany = async (numericCompanyId) => {
    setLoading(true);
    setApiErrors([]);
    try {
      let vehiclesData = [];
      let driversData = [];

      // Load Vehicles
      try {
        const vehiclesResponse = await apiService.getVehiclesByCompany(numericCompanyId);
        
        // Extract vehicles data
        if (vehiclesResponse && vehiclesResponse.data) {
          if (Array.isArray(vehiclesResponse.data)) {
            vehiclesData = vehiclesResponse.data;
          } else if (Array.isArray(vehiclesResponse.data.data)) {
            vehiclesData = vehiclesResponse.data.data;
          }
        } else if (Array.isArray(vehiclesResponse)) {
          vehiclesData = vehiclesResponse;
        }
      } catch (vehicleError) {
        console.error('Vehicles API error:', vehicleError);
        setApiErrors(prev => [...prev, `Vehicles API failed: ${vehicleError.message}`]);
      }

      // Load Drivers - FROM EMPLOYEES COLLECTION
      try {
        const employeesResponse = await apiService.getEmployeesByCompany(numericCompanyId);
        
        // Extract employees data who can be drivers
        let employeesData = [];
        
        if (employeesResponse && employeesResponse.data) {
          if (Array.isArray(employeesResponse.data)) {
            employeesData = employeesResponse.data;
          } else if (Array.isArray(employeesResponse.data.data)) {
            employeesData = employeesResponse.data.data;
          }
        } else if (Array.isArray(employeesResponse)) {
          employeesData = employeesResponse;
        }

        // Transform employees into drivers format AND FILTER OUT UNDEFINED NAMES
        driversData = employeesData
          .map(employee => ({
            driverId: employee.id,
            employeeName: employee.fullName,
            employeeCode: employee.employeeCode,
            companyId: employee.companyId,
            jobTitle: employee.jobTitle,
            status: employee.status
          }))
          // FILTER: Remove drivers with undefined, null, or empty names
          .filter(driver => {
            return driver.employeeName && 
                   driver.employeeName.trim() !== '' && 
                   driver.employeeName !== 'undefined' &&
                   driver.employeeName !== 'null';
          });

      } catch (employeeError) {
        console.error('Employees API error:', employeeError);
        setApiErrors(prev => [...prev, `Employees API failed: ${employeeError.message}`]);
        
        // Fallback: Try to get all employees and filter
        try {
          const allEmployeesResponse = await apiService.getEmployees();
          
          let allEmployees = [];
          if (allEmployeesResponse && allEmployeesResponse.data) {
            if (Array.isArray(allEmployeesResponse.data)) {
              allEmployees = allEmployeesResponse.data;
            } else if (Array.isArray(allEmployeesResponse.data.data)) {
              allEmployees = allEmployeesResponse.data.data;
            }
          }
          
          // Filter by company ID AND valid names
          const filteredEmployees = allEmployees.filter(emp => {
            const companyMatch = emp.companyId === parseInt(numericCompanyId) || emp.companyId == numericCompanyId;
            const hasValidName = emp.fullName && 
                                emp.fullName.trim() !== '' && 
                                emp.fullName !== 'undefined' &&
                                emp.fullName !== 'null';
            
            return companyMatch && hasValidName;
          });
          
          // Transform to drivers format
          driversData = filteredEmployees.map(employee => ({
            driverId: employee.id,
            employeeName: employee.fullName,
            employeeCode: employee.employeeCode,
            companyId: employee.companyId
          }));
          
        } catch (fallbackError) {
          console.error('Employees fallback failed:', fallbackError);
        }
      }

      setVehicles(vehiclesData);
      setDrivers(driversData);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      setApiErrors(prev => [...prev, `Unexpected error: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="text-lg font-semibold text-gray-800 mb-4">VEHICLE & DRIVER ASSIGNMENT</div>
      
      {apiErrors.length > 0 && (
        <Alert
          message="API Issues Detected"
          description={
            <div>
              <div>Some APIs returned errors:</div>
              <ul className="mt-2">
                {apiErrors.map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <div className="border-l-4 border-blue-500 pl-4">
        <Row gutter={[32, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Vehicle"
              name="vehicleId"
              rules={[{ required: true, message: 'Please select a vehicle!' }]}
            >
              <Select
                placeholder={companyNumericId ? "Select a vehicle" : "Please select a company first"}
                suffixIcon={<CarOutlined />}
                loading={loading}
                disabled={!companyNumericId || loading}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {vehicles.map(vehicle => (
                  <Option key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.registrationNo} - {vehicle.vehicleType}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {!loading && companyNumericId && vehicles.length === 0 && (
              <div className="text-sm text-orange-500">
                No vehicles available for this company
              </div>
            )}
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Driver"
              name="driverId"
              rules={[{ required: true, message: 'Please select a driver!' }]}
            >
              <Select
                placeholder={companyNumericId ? "Select a driver" : "Please select a company first"}
                suffixIcon={<UserOutlined />}
                loading={loading}
                disabled={!companyNumericId || loading}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {drivers.map(driver => (
                  <Option key={driver.driverId} value={driver.driverId.toString()}>
                    {driver.employeeName} {driver.employeeCode && `(${driver.employeeCode})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {!loading && companyNumericId && drivers.length === 0 && (
              <div className="text-sm text-orange-500">
                No drivers available for this company
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default VehicleDriverAssignment;
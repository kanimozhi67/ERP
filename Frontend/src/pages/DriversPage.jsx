import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  message, 
  Space, 
  Card, 
  Tag,
  Row,
  Col,
  Spin,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [companyFilter, setCompanyFilter] = useState(null);
  const [employeesError, setEmployeesError] = useState(null);
  const [form] = Form.useForm();

  const isSuperAdmin = true;

  // Fetch all initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setEmployeesError(null);
    try {
      const companiesData = await fetchCompanies();
      const employeesData = await fetchAllEmployees();
      const vehiclesData = await fetchAllVehicles();
      
      console.log('📊 All data loaded:', {
        companies: companiesData.length,
        employees: employeesData.length,
        vehicles: vehiclesData.length
      });
      
      await fetchDrivers(employeesData, vehiclesData);
    } catch (error) {
      console.error('Error initializing data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      const companiesData = extractArrayData(response);
      setCompanies(companiesData);
      return companiesData;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  };

  const fetchAllEmployees = async () => {
    try {
      console.log('🔄 Fetching employees...');
      const response = await apiService.getEmployees();
      const employeesData = extractArrayData(response);
      
      console.log('✅ Employees fetched:', employeesData);
      
      const processedEmployees = employeesData.map(emp => ({
        id: emp.id || emp._id,
        _id: emp._id,
        companyId: emp.companyId,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        phone: emp.phone,
        jobTitle: emp.jobTitle,
        status: emp.status,
      }));
      
      setAllEmployees(processedEmployees);
      setEmployeesError(null);
      return processedEmployees;
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      setEmployeesError('Failed to load employees. Please check backend server.');
      setAllEmployees([]);
      throw error;
    }
  };

  const fetchAllVehicles = async () => {
    try {
      const response = await apiService.getVehicles();
      const vehiclesData = extractArrayData(response);
      
      console.log('🚗 Vehicles fetched:', vehiclesData);
      
      setAllVehicles(vehiclesData);
      return vehiclesData;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  };

  // FIXED: Enhanced driver data mapping with consistent field handling
  const fetchDrivers = async (employeesData = allEmployees, vehiclesData = allVehicles) => {
    try {
      const response = await apiService.getDrivers();
      const driversData = extractArrayData(response);
      
      console.log('🚗 Raw drivers data:', driversData);
      
      // Enhance drivers with employee and vehicle data
      const enhancedDrivers = driversData.map((driver) => {
        // Normalize vehicle ID field - handle both vehicleId and assignedVehicleId
        const normalizedVehicleId = driver.vehicleId || driver.assignedVehicleId;
        
        // Find employee data with better matching
        const employee = employeesData.find(emp => {
          const empId = emp.id || emp._id;
          const driverEmpId = driver.employeeId;
          
          // Handle both string and number comparisons
          return (
            empId == driverEmpId || // Loose equality to handle "1" vs 1
            emp.employeeCode === driver.employeeCode
          );
        });

        // Find vehicle data with better matching
        const vehicle = vehiclesData.find(veh => {
          if (!normalizedVehicleId) return false;
          
          const vehicleId = veh.id || veh._id;
          return (
            vehicleId == normalizedVehicleId || // Loose equality
            veh.registrationNo === normalizedVehicleId
          );
        });

        console.log(`🔍 Driver ${driver.employeeName || 'Unknown'}:`, {
          normalizedVehicleId,
          foundVehicle: vehicle,
          employeeFound: !!employee
        });

        const enhancedDriver = {
          ...driver,
          id: driver.id || driver._id,
          companyId: driver.companyId,
          employeeId: driver.employeeId,
          employeeName: employee ? employee.fullName : (driver.employeeName || 'Unknown'),
          employeeCode: driver.employeeCode || (employee ? employee.employeeCode : ''),
          licenseNo: driver.licenseNo,
          licenseExpiry: driver.licenseExpiry,
          vehicleId: normalizedVehicleId, // Use normalized field
          vehicleInfo: vehicle,
          status: driver.status || 'ACTIVE',
        };

        return enhancedDriver;
      });
      
      console.log('✅ Enhanced drivers:', enhancedDrivers);
      
      setDrivers(enhancedDrivers);
      setFilteredDrivers(enhancedDrivers);
      
      updateAvailableEmployees(employeesData, enhancedDrivers);
      
      return enhancedDrivers;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      message.error('Failed to load drivers');
      throw error;
    }
  };

  // Helper function to extract array data from various response formats
  const extractArrayData = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    } else if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response?.data && typeof response.data === 'object') {
      const data = response.data;
      for (const key in data) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
      }
    }
    console.warn('Unexpected response format:', response);
    return [];
  };

  // FIXED: Update available employees logic
  const updateAvailableEmployees = (employeesList, driversList = drivers) => {
    const assignedActiveEmployeeIds = new Set(
      driversList
        .filter(driver => driver.status === 'ACTIVE')
        .map(driver => driver.employeeId?.toString()) // Convert to string for consistent comparison
    );

    const available = employeesList.filter(employee => 
      !assignedActiveEmployeeIds.has(employee.id?.toString()) && 
      employee.status === 'ACTIVE'
    );
    
    console.log('📋 Available employees:', available);
    setAvailableEmployees(available);
  };

  // Auto-refresh when employees or vehicles data changes
  useEffect(() => {
    if (allEmployees.length > 0 && drivers.length > 0) {
      updateAvailableEmployees(allEmployees, drivers);
    }
  }, [allEmployees, drivers]);

  // Filter drivers based on search and company filter
  useEffect(() => {
    let filtered = drivers;

    if (companyFilter) {
      filtered = filtered.filter(driver => driver.companyId == companyFilter); // Loose equality
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(driver => {
        const driverName = driver.employeeName?.toLowerCase() || '';
        const employeeId = driver.employeeId?.toString().toLowerCase() || '';
        const licenseNo = driver.licenseNo?.toLowerCase() || '';
        const vehicleReg = getVehicleDisplay(driver.vehicleId)?.toLowerCase() || '';
        const employeeCode = driver.employeeCode?.toLowerCase() || '';
        
        return driverName.includes(searchLower) || 
               employeeId.includes(searchLower) ||
               licenseNo.includes(searchLower) ||
               vehicleReg.includes(searchLower) ||
               employeeCode.includes(searchLower);
      });
    }

    setFilteredDrivers(filtered);
  }, [drivers, companyFilter, searchText]);

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id == companyId); // Loose equality
    return company ? company.name : 'Unknown Company';
  };

  // FIXED: Improved vehicle display with better ID matching
  const getVehicleDisplay = (vehicleId) => {
    if (!vehicleId) {
      return '—';
    }
    
    const vehicle = allVehicles.find(v => {
      const vid = v.id || v._id;
      return (
        vid == vehicleId || // Loose equality for "1" vs 1
        v.registrationNo === vehicleId
      );
    });
    
    if (!vehicle) {
      return '—';
    }
    
    return `${vehicle.registrationNo} (${vehicle.vehicleType} ${vehicle.capacity} Seater)`;
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'green', text: 'ACTIVE' },
      'INACTIVE': { color: 'red', text: 'INACTIVE' },
      'SUSPENDED': { color: 'orange', text: 'SUSPENDED' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // FIXED: Get available vehicles filtered by company
  const getAvailableVehicles = useCallback((currentDriverId = null, companyId = null) => {
    const assignedVehicleIds = new Set(
      drivers
        .filter(driver => 
          driver.vehicleId && 
          driver.status === 'ACTIVE' && 
          driver.id !== currentDriverId
        )
        .map(driver => driver.vehicleId)
    );

    let availableVehicles = allVehicles.filter(vehicle => 
      !assignedVehicleIds.has(vehicle.id) && 
      vehicle.status === 'AVAILABLE'
    );

    // Filter by company if provided
    if (companyId) {
      availableVehicles = availableVehicles.filter(vehicle => 
        vehicle.companyId == companyId // Loose equality
      );
    }

    return availableVehicles;
  }, [drivers, allVehicles]);

  const handleCreate = () => {
    setEditingDriver(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = async (driver) => {
    setEditingDriver(driver);
    setModalVisible(true);
    
    // Find the employee data
    const employee = allEmployees.find(emp => 
      emp.id == driver.employeeId // Loose equality
    );
    
    form.setFieldsValue({
      companyId: driver.companyId,
      employeeId: driver.employeeId,
      jobTitle: driver.jobTitle || (employee ? employee.jobTitle : 'Driver'),
      licenseNo: driver.licenseNo,
      licenseExpiry: driver.licenseExpiry ? dayjs(driver.licenseExpiry) : null,
      vehicleId: driver.vehicleId,
    });

    if (employee) {
      form.setFieldsValue({
        employeeName: employee.fullName,
        jobTitle: employee.jobTitle
      });
    }
  };

  const handleStatusToggle = async (driver) => {
    try {
      const newStatus = driver.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updatedDriver = { 
        ...driver, 
        status: newStatus
      };
      
      await apiService.updateDriver(driver.id, updatedDriver);
      
      message.success(`Driver ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
      await fetchAllData();
      
    } catch (error) {
      console.error('Error updating driver status:', error);
      message.error('Failed to update driver status');
    }
  };

  // FIXED: Handle form submission with consistent data types
  const handleSubmit = async (values) => {
    setFormLoading(true);
    try {
      console.log('📝 Submitting driver data:', values);
      
      // Find selected employee
      const selectedEmployee = allEmployees.find(emp => 
        emp.id == values.employeeId // Loose equality
      );

      if (!selectedEmployee) {
        message.error('Selected employee not found');
        setFormLoading(false);
        return;
      }

      const driverData = {
        companyId: parseInt(values.companyId),
        employeeId: parseInt(values.employeeId), // Ensure number type
        employeeName: selectedEmployee.fullName,
        employeeCode: selectedEmployee.employeeCode,
        jobTitle: values.jobTitle || selectedEmployee.jobTitle,
        licenseNo: values.licenseNo,
        licenseExpiry: values.licenseExpiry ? values.licenseExpiry.format('YYYY-MM-DD') : null,
        vehicleId: values.vehicleId ? parseInt(values.vehicleId) : null, // Ensure number type
        status: editingDriver ? editingDriver.status : 'ACTIVE',
      };

      console.log('🚀 Saving driver with data:', driverData);

      if (editingDriver) {
        await apiService.updateDriver(editingDriver.id, {
          ...driverData,
          id: editingDriver.id
        });
        message.success('Driver updated successfully');
      } else {
        await apiService.createDriver(driverData);
        message.success('Driver created successfully');
      }
      
      setModalVisible(false);
      form.resetFields();
      await fetchAllData();
      
    } catch (error) {
      console.error('❌ Error saving driver:', error);
      message.error('Failed to save driver: ' + (error.response?.data?.message || error.message));
    } finally {
      setFormLoading(false);
    }
  };

  // FIXED: Handle company change with vehicle filtering
  const handleCompanyChange = (companyId) => {
    form.setFieldsValue({
      employeeId: undefined,
      employeeName: undefined,
      jobTitle: undefined,
      vehicleId: undefined
    });
    
    // Update available vehicles based on selected company
    const companyVehicles = getAvailableVehicles(null, companyId);
    console.log('🚗 Vehicles for company', companyId, ':', companyVehicles);
  };

  const handleEmployeeChange = (employeeId) => {
    const selectedEmployee = allEmployees.find(emp => 
      emp.id == employeeId // Loose equality
    );
    if (selectedEmployee) {
      form.setFieldsValue({
        employeeName: selectedEmployee.fullName,
        jobTitle: selectedEmployee.jobTitle
      });
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleCompanyFilterChange = (value) => {
    setCompanyFilter(value);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingDriver(null);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Driver Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (name, record) => (
        <Space>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium">{name}</div>
            {record.employeeCode && (
              <div className="text-xs text-gray-500">ID: {record.employeeCode}</div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      render: (id) => id || '—',
    },
    {
      title: 'License No',
      dataIndex: 'licenseNo',
      key: 'licenseNo',
      render: (license) => license || '—',
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleId',
      key: 'vehicle',
      render: (vehicleId) => getVehicleDisplay(vehicleId),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'License Expiry',
      dataIndex: 'licenseExpiry',
      key: 'licenseExpiry',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '—',
      sorter: (a, b) => dayjs(a.licenseExpiry).unix() - dayjs(b.licenseExpiry).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            onClick={() => handleEdit(record)}
            size="small"
          >
            View/Edit
          </Button>
          <Button 
            type="link" 
            danger={record.status === 'ACTIVE'}
            onClick={() => handleStatusToggle(record)}
            size="small"
          >
            {record.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </Space>
      ),
    },
  ];

  // Get available vehicles for the modal based on selected company
  const formCompanyId = form.getFieldValue('companyId');
  const currentAvailableVehicles = getAvailableVehicles(editingDriver?.id, formCompanyId);

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: 0, 
            color: '#1f2937' 
          }}>
            Driver Directory
          </h1>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px', 
            alignItems: 'center'
          }}>
            <Search
              placeholder="Search by Name / License No / Vehicle Reg"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '280px' }}
              value={searchText}
            />
            <Select
              placeholder="Filter by Company"
              allowClear
              onChange={handleCompanyFilterChange}
              style={{ width: 200 }}
              size="large"
              value={companyFilter}
            >
              {companies.map(company => (
                <Option key={company.id} value={company.id}>
                  {company.name}
                </Option>
              ))}
            </Select>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              size="large"
              onClick={handleCreate}
              style={{ whiteSpace: 'nowrap' }}
            >
              Create New Driver
            </Button>
          </div>
        </div>
      </Card>

      {employeesError && (
        <Alert
          message="Employees Loading Issue"
          description={employeesError}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" onClick={fetchAllEmployees}>
              Retry
            </Button>
          }
        />
      )}

      <Card>
        <Table 
          columns={columns}
          dataSource={filteredDrivers}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} drivers`,
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: searchText ? `No drivers found for "${searchText}"` : 'No drivers found'
          }}
        />
      </Card>

      {/* CREATE/EDIT DRIVER MODAL */}
      <Modal
        title={
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {editingDriver ? 'Edit Driver' : 'Create New Driver'}
          </span>
        }
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Spin spinning={formLoading}>
          {employeesError && (
            <Alert
              message="Cannot Load Employees"
              description="The employees list cannot be loaded. Please check your backend server and try again."
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ marginTop: '16px' }}
          >
            <div style={{ marginBottom: '24px' }}>
              <Row gutter={16}>
                {isSuperAdmin && (
                  <Col span={12}>
                    <Form.Item
                      name="companyId"
                      label="Company"
                      rules={[{ required: true, message: 'Please select company' }]}
                    >
                      <Select 
                        placeholder="Select Company"
                        size="large"
                        onChange={handleCompanyChange}
                        style={{ width: '100%' }}
                      >
                        {companies.map(company => (
                          <Option key={company.id} value={company.id}>
                            {company.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                )}
                
                <Col span={isSuperAdmin ? 12 : 24}>
                  <Form.Item
                    name="employeeId"
                    label="Employee"
                    rules={[{ required: true, message: 'Please select an employee' }]}
                  >
                    <Select 
                      placeholder={employeesError ? "Employees not available" : "Select Existing Employee"}
                      size="large"
                      onChange={handleEmployeeChange}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      style={{ width: '100%' }}
                      disabled={!!employeesError}
                    >
                      {availableEmployees.map(employee => (
                        <Option key={employee.id} value={employee.id}>
                          {employee.fullName} — {employee.employeeCode}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="jobTitle"
                    label="Job Title"
                  >
                    <Input 
                      placeholder="Auto-filled from employee selection"
                      size="large"
                      disabled
                      style={{ width: '100%', backgroundColor: '#f9fafb' }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="employeeName"
                    label="Employee Name"
                  >
                    <Input 
                      placeholder="Auto-filled from employee selection"
                      size="large"
                      disabled
                      style={{ width: '100%', backgroundColor: '#f9fafb' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="licenseNo"
                    label="License Number"
                    rules={[{ required: true, message: 'Please enter license number' }]}
                  >
                    <Input 
                      placeholder="DL-4587-HYD"
                      size="large"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="licenseExpiry"
                    label="License Expiry Date"
                    rules={[{ required: true, message: 'Please select license expiry date' }]}
                  >
                    <DatePicker 
                      placeholder="2026-02-15"
                      format="YYYY-MM-DD"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="vehicleId"
                    label="Assign Vehicle"
                  >
                    <Select 
                      placeholder="Select Vehicle"
                      size="large"
                      allowClear
                      style={{ width: '100%' }}
                    >
                      {currentAvailableVehicles.map(vehicle => (
                        <Option key={vehicle.id} value={vehicle.id}>
                          {vehicle.registrationNo} – {vehicle.vehicleType} {vehicle.capacity} Seater
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              paddingTop: '16px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <Button 
                onClick={handleModalCancel}
                size="large"
                style={{ padding: '0 24px' }}
              >
                CANCEL
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                loading={formLoading}
                style={{ padding: '0 24px' }}
                disabled={!!employeesError}
              >
                {editingDriver ? 'UPDATE DRIVER' : 'CREATE DRIVER'}
              </Button>
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default DriversPage;
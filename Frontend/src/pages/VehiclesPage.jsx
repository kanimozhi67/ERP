// src/pages/VehiclesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  message,
  Space,
  Card,
  Tag,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CarOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import vehicleService from '../services/vehicleService';
import apiService from '../services/apiService';

const { Option } = Select;
const { TextArea } = Input;

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  // Search states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load initial data
  useEffect(() => {
    loadData();
    loadCompanies();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await vehicleService.getVehicles();
      console.log('🚗 Vehicles API Response:', response);
      
      // Handle different response structures
      let vehiclesData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          vehiclesData = response.data;
        } else if (Array.isArray(response.data.data)) {
          vehiclesData = response.data.data;
        } else if (Array.isArray(response.data.vehicles)) {
          vehiclesData = response.data.vehicles;
        }
      } else if (Array.isArray(response)) {
        vehiclesData = response;
      }
      
      console.log('📊 Processed vehicles data:', vehiclesData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('❌ Error loading vehicles:', error);
      message.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      const companiesData = Array.isArray(response.data) ? response.data : [];
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  // FIXED: Smart search that matches exactly what you type
  const filteredData = useMemo(() => {
    if (!searchText && !statusFilter && !companyFilter) {
      return vehicles;
    }

    return vehicles.filter(vehicle => {
      let matchesSearch = true;
      let matchesStatus = true;
      let matchesCompany = true;

      // Search text filter - SMART: Different matching for different fields
      if (searchText) {
        const searchLower = searchText.toLowerCase().trim();
        
        // Check if search is for vehicle code (like VAN001, VAN002)
        const isVehicleCodeSearch = /^[a-z]+\d+$/i.test(searchText);
        
        // Check if search is for vehicle type (like Van, Bus, Car)
        const isVehicleTypeSearch = /^[a-z]+$/i.test(searchText);
        
        let registrationMatch = false;
        let vehicleCodeMatch = false;
        let vehicleTypeMatch = false;

        if (isVehicleCodeSearch) {
          // Search for exact vehicle code match (case-insensitive)
          vehicleCodeMatch = vehicle.vehicleCode?.toLowerCase() === searchLower;
        } else if (isVehicleTypeSearch) {
          // Search for exact vehicle type match (case-insensitive)
          vehicleTypeMatch = vehicle.vehicleType?.toLowerCase() === searchLower;
        } else {
          // General search - check all fields with partial matching
          registrationMatch = vehicle.registrationNo?.toLowerCase().includes(searchLower) || false;
          vehicleCodeMatch = vehicle.vehicleCode?.toLowerCase().includes(searchLower) || false;
          vehicleTypeMatch = vehicle.vehicleType?.toLowerCase().includes(searchLower) || false;
        }

        matchesSearch = registrationMatch || vehicleCodeMatch || vehicleTypeMatch;
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter) {
        const vehicleStatus = vehicle.status?.toUpperCase() || '';
        const filterStatus = statusFilter.toUpperCase();
        matchesStatus = vehicleStatus === filterStatus;
        
        if (!matchesStatus) return false;
      }

      // Company filter
      if (companyFilter) {
        const vehicleCompanyId = vehicle.companyId?.toString();
        const filterCompanyId = companyFilter.toString();
        matchesCompany = vehicleCompanyId === filterCompanyId;
        
        if (!matchesCompany) return false;
      }

      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [vehicles, searchText, statusFilter, companyFilter]);

  // Handle search
  const handleSearch = (values) => {
    console.log('🔍 Search Form Values:', values);
    setSearchText(values.searchText || '');
    setStatusFilter(values.status || '');
    setCompanyFilter(values.company || '');
    setCurrentPage(1);
  };

  const resetFilters = () => {
    searchForm.resetFields();
    setSearchText('');
    setStatusFilter('');
    setCompanyFilter('');
    setCurrentPage(1);
  };

  // CRUD Operations
  const handleCreate = () => {
    setEditingVehicle(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue({
      ...vehicle,
      companyId: vehicle.companyId?.toString(),
      insuranceExpiry: vehicle.insuranceExpiry ? dayjs(vehicle.insuranceExpiry) : null,
      lastServiceDate: vehicle.lastServiceDate ? dayjs(vehicle.lastServiceDate) : null,
    });
    setModalVisible(true);
  };

  const handleView = (vehicle) => {
    setViewingVehicle(vehicle);
    setViewModalVisible(true);
  };

  const handleDelete = async (vehicleId) => {
    try {
      await vehicleService.deleteVehicle(vehicleId);
      message.success('Vehicle deleted successfully');
      setVehicles(prev => prev.filter(v => v.id !== vehicleId && v._id !== vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      message.error('Failed to delete vehicle');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const vehicleData = {
        ...values,
        companyId: parseInt(values.companyId),
        capacity: parseInt(values.capacity),
        odometer: values.odometer ? parseInt(values.odometer) : null,
        insuranceExpiry: values.insuranceExpiry ? values.insuranceExpiry.toISOString() : null,
        lastServiceDate: values.lastServiceDate ? values.lastServiceDate.toISOString() : null,
      };

      if (editingVehicle) {
        // Update existing vehicle
        const vehicleId = editingVehicle.id || editingVehicle._id;
        await vehicleService.updateVehicle(vehicleId, vehicleData);
        message.success('Vehicle updated successfully');
        
        // Update local state
        setVehicles(prev => prev.map(v => 
          (v.id === vehicleId || v._id === vehicleId) 
            ? { ...v, ...vehicleData }
            : v
        ));
      } else {
        // Create new vehicle
        const response = await vehicleService.createVehicle(vehicleData);
        message.success('Vehicle created successfully');
        
        // Add to local state
        if (response.data) {
          setVehicles(prev => [...prev, response.data]);
        }
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      message.error(`Failed to ${editingVehicle ? 'update' : 'create'} vehicle`);
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : `Company ${companyId}`;
  };

  const getStatusTag = (status) => {
    const colorMap = {
      'AVAILABLE': 'green',
      'IN_USE': 'blue',
      'MAINTENANCE': 'orange',
      'OUT_OF_SERVICE': 'red'
    };
    const textMap = {
      'AVAILABLE': 'Available',
      'IN_USE': 'In Use',
      'MAINTENANCE': 'Maintenance',
      'OUT_OF_SERVICE': 'Out of Service'
    };
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  // Table columns
  const columns = [
    {
      title: 'Vehicle Code',
      dataIndex: 'vehicleCode',
      key: 'vehicleCode',
      sorter: (a, b) => (a.vehicleCode || '').localeCompare(b.vehicleCode || ''),
    },
    {
      title: 'Registration No',
      dataIndex: 'registrationNo',
      key: 'registrationNo',
      sorter: (a, b) => (a.registrationNo || '').localeCompare(b.registrationNo || ''),
    },
    {
      title: 'Type',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      sorter: (a, b) => (a.vehicleType || '').localeCompare(b.vehicleType || ''),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      sorter: (a, b) => (a.capacity || 0) - (b.capacity || 0),
      render: (capacity) => `${capacity || 0} seats`,
    },
    {
      title: 'Company',
      key: 'company',
      render: (_, record) => getCompanyName(record.companyId),
      sorter: (a, b) => getCompanyName(a.companyId)?.localeCompare(getCompanyName(b.companyId) || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
    },
    {
      title: 'Last Service',
      dataIndex: 'lastServiceDate',
      key: 'lastServiceDate',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.lastServiceDate || 0) - new Date(b.lastServiceDate || 0),
    },
    {
      title: 'Insurance Expiry',
      dataIndex: 'insuranceExpiry',
      key: 'insuranceExpiry',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.insuranceExpiry || 0) - new Date(b.insuranceExpiry || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit Vehicle">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Delete Vehicle"
            description="Are you sure you want to delete this vehicle?"
            onConfirm={() => handleDelete(record.id || record._id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Tooltip title="Delete Vehicle">
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card 
        className="shadow-sm"
        title={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
              <CarOutlined className="mr-2" />
              Vehicles Management
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreate}
                size="small"
              >
                Add Vehicle
              </Button>
            </div>
          </div>
        }
      >
        {/* Search Section */}
        <Card size="small" className="mb-4" bodyStyle={{ padding: '12px' }}>
          <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
            <Row gutter={[12, 8]} align="bottom">
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Search" name="searchText" className="mb-2">
                  <Input 
                    placeholder="Registration, code, or type..." 
                    prefix={<SearchOutlined />} 
                    allowClear 
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Form.Item label="Status" name="status" className="mb-2">
                  <Select placeholder="All status" allowClear size="small">
                    <Option value="AVAILABLE">Available</Option>
                    <Option value="IN_USE">In Use</Option>
                    <Option value="MAINTENANCE">Maintenance</Option>
                    <Option value="OUT_OF_SERVICE">Out of Service</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Company" name="company" className="mb-2">
                  <Select placeholder="All companies" allowClear size="small">
                    {companies.map(company => (
                      <Option key={company.id} value={company.id.toString()}>
                        {company.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Form.Item className="mb-2">
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SearchOutlined />} 
                    style={{ width: '100%' }}
                    size="small"
                  >
                    Search
                  </Button>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Form.Item className="mb-2">
                  <Button 
                    onClick={resetFilters}
                    style={{ width: '100%' }}
                    size="small"
                  >
                    Reset
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Results count */}
        <div className="mb-3 text-sm text-gray-600 px-1">
          Showing {filteredData.length} of {vehicles.length} vehicles
          {filteredData.length !== vehicles.length && (
            <span className="text-blue-600 ml-2">
              (Filtered by {searchText ? 'search, ' : ''}{statusFilter ? 'status, ' : ''}{companyFilter ? 'company' : ''})
            </span>
          )}
        </div>

        {/* Vehicles Table */}
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          loading={loading}
          rowKey={(record) => record._id || record.id}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} vehicles`,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size) setPageSize(size);
            },
          }}
          size="middle"
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit Vehicle Modal */}
      <Modal
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Company"
                name="companyId"
                rules={[{ required: true, message: 'Please select a company' }]}
              >
                <Select placeholder="Select company" size="large">
                  {companies.map(company => (
                    <Option key={company.id} value={company.id.toString()}>
                      {company.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Vehicle Code"
                name="vehicleCode"
                rules={[{ required: true, message: 'Please enter vehicle code' }]}
              >
                <Input placeholder="e.g., VAN001" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Registration Number"
                name="registrationNo"
                rules={[{ required: true, message: 'Please enter registration number' }]}
              >
                <Input placeholder="e.g., ABC123" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Vehicle Type"
                name="vehicleType"
                rules={[{ required: true, message: 'Please enter vehicle type' }]}
              >
                <Input placeholder="e.g., Van, Bus, Car" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Capacity"
                name="capacity"
                rules={[{ required: true, message: 'Please enter capacity' }]}
              >
                <InputNumber 
                  placeholder="Number of seats" 
                  min={1} 
                  max={100}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status" size="large">
                  <Option value="AVAILABLE">Available</Option>
                  <Option value="IN_USE">In Use</Option>
                  <Option value="MAINTENANCE">Maintenance</Option>
                  <Option value="OUT_OF_SERVICE">Out of Service</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Last Service Date"
                name="lastServiceDate"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder="Select date"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Insurance Expiry Date"
                name="insuranceExpiry"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder="Select date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Odometer Reading"
                name="odometer"
              >
                <InputNumber 
                  placeholder="Current odometer" 
                  min={0}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <div className="flex justify-end space-x-3">
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Vehicle Modal */}
      <Modal
        title="Vehicle Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={500}
      >
        {viewingVehicle && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <strong>Vehicle Code:</strong>
                <div>{viewingVehicle.vehicleCode}</div>
              </Col>
              <Col span={12}>
                <strong>Registration No:</strong>
                <div>{viewingVehicle.registrationNo}</div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <strong>Vehicle Type:</strong>
                <div>{viewingVehicle.vehicleType}</div>
              </Col>
              <Col span={12}>
                <strong>Capacity:</strong>
                <div>{viewingVehicle.capacity} seats</div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <strong>Company:</strong>
                <div>{getCompanyName(viewingVehicle.companyId)}</div>
              </Col>
              <Col span={12}>
                <strong>Status:</strong>
                <div>{getStatusTag(viewingVehicle.status)}</div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <strong>Last Service:</strong>
                <div>{formatDate(viewingVehicle.lastServiceDate)}</div>
              </Col>
              <Col span={12}>
                <strong>Insurance Expiry:</strong>
                <div>{formatDate(viewingVehicle.insuranceExpiry)}</div>
              </Col>
            </Row>
            {viewingVehicle.odometer && (
              <Row gutter={16}>
                <Col span={12}>
                  <strong>Odometer:</strong>
                  <div>{viewingVehicle.odometer} km</div>
                </Col>
              </Row>
            )}
            <Row gutter={16}>
              <Col span={24}>
                <strong>Created:</strong>
                <div>{formatDate(viewingVehicle.createdAt)}</div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VehiclesPage;
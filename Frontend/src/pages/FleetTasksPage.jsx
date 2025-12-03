// src/pages/FleetTasksPage.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Dropdown,
  Badge,
  List,
  Avatar,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import fleetTaskService from '../services/fleetTaskService';
import apiService from '../services/apiService';

// Extend dayjs with UTC and timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;

// INSTANT: Simple status normalization
const normalizeStatus = (status) => {
  if (!status) return 'PLANNED';
  const statusStr = String(status).toUpperCase();
  if (statusStr.includes('PLAN') || statusStr.includes('SCHEDULE')) return 'PLANNED';
  if (statusStr.includes('PROGRESS') || statusStr.includes('ONGOING') || statusStr.includes('ACTIVE')) return 'ONGOING';
  if (statusStr.includes('COMPLETE') || statusStr.includes('DONE') || statusStr.includes('FINISH')) return 'COMPLETED';
  if (statusStr.includes('CANCEL')) return 'CANCELLED';
  return 'PLANNED';
};

const FleetTasksPage = () => {
  const [fleetTasks, setFleetTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [passengers, setPassengers] = useState({});
  const [searchForm] = Form.useForm();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isMounted = useRef(true);

  // ✅ FIXED: Correct time formatting - preserves exact time without timezone shift
 // ✅ FIXED: Correct time formatting that displays 12:00 AM as 12:00 AM
// ✅ FIXED: Display time as 12:00 AM / 12:00 PM (without seconds)
const formatTime = useCallback((timeString) => {
  if (!timeString) return '';
  try {
    // Use local time instead of UTC to avoid timezone conversion
    const date = new Date(timeString);
    
    // Extract local time components
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // the hour '0' should be '12'
    
    // Format with leading zeros for minutes only (no seconds)
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Time formatting error:', error);
    return timeString;
  }
}, []);

  // Debug function to check what's happening with times
  const debugTime = useCallback((timeString, label = 'Time') => {
    if (!timeString) return;
    const date = new Date(timeString);
    console.log(`🕒 ${label}:`, {
      original: timeString,
      dateObject: date,
      utcHours: date.getUTCHours(),
      utcMinutes: date.getUTCMinutes(),
      localHours: date.getHours(),
      localMinutes: date.getMinutes(),
      timezoneOffset: date.getTimezoneOffset(),
      toISOString: date.toISOString(),
      toLocaleString: date.toLocaleString('en-US'),
      formatted: formatTime(timeString)
    });
  }, [formatTime]);

  const filteredData = useMemo(() => {
    if (!searchText && !statusFilter && (!dateRange || dateRange.length === 0)) {
      return fleetTasks;
    }

    return fleetTasks.filter(task => {
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const driverMatch = task.displayDriverName?.toLowerCase().includes(searchLower);
        const vehicleMatch = task.displayVehicleName?.toLowerCase().includes(searchLower);
        if (!driverMatch && !vehicleMatch) return false;
      }

      if (statusFilter && normalizeStatus(task.status) !== statusFilter) {
        return false;
      }

      if (dateRange && dateRange.length === 2) {
        const taskDate = dayjs(task.taskDate);
        const start = dayjs(dateRange[0]).startOf('day');
        const end = dayjs(dateRange[1]).endOf('day');
        if (taskDate.isBefore(start) || taskDate.isAfter(end)) return false;
      }

      return true;
    });
  }, [fleetTasks, searchText, statusFilter, dateRange]);

  useEffect(() => {
    isMounted.current = true;
    loadData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    console.time('🚀 INSTANT LOAD');

    try {
      const [tasksResponse, passengersResponse] = await Promise.all([
        fleetTaskService.getFleetTasks(),
        apiService.getFleetTaskPassengers()
      ]);
      
      if (!isMounted.current) return;

      let tasksData = [];
      if (tasksResponse?.data) {
        tasksData = Array.isArray(tasksResponse.data) ? tasksResponse.data :
                   Array.isArray(tasksResponse.data?.data) ? tasksResponse.data.data :
                   Array.isArray(tasksResponse.data?.tasks) ? tasksResponse.data.tasks : [];
      }

      let allPassengers = [];
      if (passengersResponse?.data) {
        allPassengers = Array.isArray(passengersResponse.data) ? passengersResponse.data :
                       Array.isArray(passengersResponse.data?.data) ? passengersResponse.data.data : [];
      }

      console.log(`📋 INSTANT: Loaded ${tasksData.length} tasks, ${allPassengers.length} passengers`);

      const passengerMap = {};
      allPassengers.forEach(passenger => {
        const taskId = passenger.fleetTaskId;
        if (!passengerMap[taskId]) passengerMap[taskId] = [];
        passengerMap[taskId].push(passenger);
      });

      setPassengers(passengerMap);

      const processedTasks = tasksData.map((task) => {
        const taskId = task.id;
        const taskPassengers = passengerMap[taskId] || [];
        
        // Debug times for first few tasks
        if (taskId < 3 && task.plannedPickupTime) {
          debugTime(task.plannedPickupTime, `Task ${taskId} Pickup`);
        }
        
        return {
          ...task,
          status: normalizeStatus(task.status),
          displayDriverName: task.driverName || `Driver ${task.driverId}`,
          displayVehicleName: task.vehicleCode || `Vehicle ${task.vehicleId}`,
          workersAssigned: taskPassengers.length,
          passengers: taskPassengers
        };
      });

      setFleetTasks(processedTasks);
      console.timeEnd('🚀 INSTANT LOAD');

    } catch (error) {
      console.error('❌ Load error:', error);
      if (isMounted.current) {
        message.error('Failed to load tasks');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [debugTime]);

  const handleSearch = useCallback((values) => {
    setSearchText(values.searchText || '');
    setStatusFilter(values.status || '');
    setDateRange(values.dateRange || []);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    searchForm.resetFields();
    setSearchText('');
    setStatusFilter('');
    setDateRange([]);
    setCurrentPage(1);
  }, [searchForm]);

  const handleCreate = useCallback(() => {
    localStorage.removeItem('editingFleetTask');
    navigate('/home');
  }, [navigate]);

  const handleEdit = useCallback((task) => {
    const taskId = task.id || task._id;
    const taskPassengers = passengers[taskId] || [];

    const taskData = {
      id: taskId,
      _id: task._id,
      companyId: task.companyId || 2,
      companyName: task.companyName || "Tech Solutions Inc",
      companyMongoId: null,
      projectId: task.projectId,
      projectName: task.projectName,
      projectMongoId: null,
      driverId: task.driverId,
      driverName: task.driverName || task.displayDriverName,
      vehicleId: task.vehicleId,
      vehicleCode: task.vehicleCode || task.displayVehicleName,
      taskDate: task.taskDate,
      plannedPickupTime: task.plannedPickupTime,
      plannedDropTime: task.plannedDropTime,
      pickupLocation: task.pickupLocation,
      dropLocation: task.dropLocation,
      pickupAddress: task.pickupAddress,
      dropAddress: task.dropAddress,
      status: task.status,
      notes: task.notes,
      expectedPassengers: task.expectedPassengers,
      passengers: taskPassengers,
      workersAssigned: taskPassengers.length,
      isEditing: true,
      _debug: {
        companyId: task.companyId,
        companyName: task.companyName,
        projectId: task.projectId,
        projectName: task.projectName
      }
    };
    
    console.log('📝 Preparing edit data:', taskData);
    localStorage.setItem('editingFleetTask', JSON.stringify(taskData));
    navigate('/home');
  }, [navigate, passengers]);

  const showDeleteConfirm = useCallback((task) => {
    setTaskToDelete(task);
    setDeleteModalVisible(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!taskToDelete) return;
    
    try {
      const taskId = taskToDelete.id || taskToDelete._id;
      await fleetTaskService.deleteFleetTask(taskId);
      message.success('Fleet task deleted successfully');
      setDeleteModalVisible(false);
      setTaskToDelete(null);
      setFleetTasks(prev => prev.filter(task => (task.id !== taskId && task._id !== taskId)));
      setPassengers(prev => {
        const newPassengers = { ...prev };
        delete newPassengers[taskId];
        return newPassengers;
      });
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Failed to delete task');
    }
  }, [taskToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalVisible(false);
    setTaskToDelete(null);
  }, []);

  const getStatusTag = useCallback((status) => {
    const normalizedStatus = normalizeStatus(status);
    const colorMap = {
      'PLANNED': 'blue',
      'ONGOING': 'orange', 
      'COMPLETED': 'green',
      'CANCELLED': 'red'
    };
    const textMap = {
      'PLANNED': 'Scheduled',
      'ONGOING': 'In Progress',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return <Tag color={colorMap[normalizedStatus] || 'default'}>{textMap[normalizedStatus] || normalizedStatus}</Tag>;
  }, []);

  const getStatusMenu = useCallback((record) => {
    const taskId = record._id || record.id;
    const currentStatus = normalizeStatus(record.status);
    
    const statusOptions = [
      { key: 'PLANNED', label: 'Mark as Scheduled', disabled: currentStatus === 'PLANNED' },
      { key: 'ONGOING', label: 'Mark as In Progress', disabled: currentStatus === 'ONGOING' },
      { key: 'COMPLETED', label: 'Mark as Completed', disabled: currentStatus === 'COMPLETED' },
      { key: 'CANCELLED', label: 'Mark as Cancelled', disabled: currentStatus === 'CANCELLED' },
    ];

    return {
      items: statusOptions.map(option => ({
        key: option.key,
        label: option.label,
        disabled: option.disabled,
        onClick: () => handleStatusUpdate(taskId, option.key),
      })),
    };
  }, []);

  const handleStatusUpdate = useCallback(async (taskId, newStatus) => {
    try {
      const normalizedStatus = normalizeStatus(newStatus);
      await fleetTaskService.updateFleetTaskStatus(taskId, normalizedStatus);
      message.success(`Status updated to ${normalizedStatus}`);
      setFleetTasks(prev => prev.map(task => 
        (task.id === taskId || task._id === taskId) 
          ? { ...task, status: normalizedStatus }
          : task
      ));
    } catch (error) {
      console.error('Status update error:', error);
      message.error('Failed to update status');
    }
  }, []);

  const handleView = useCallback((task) => {
    const taskPassengers = task.passengers || [];
    const workersAssigned = taskPassengers.length;

    Modal.info({
      title: `Fleet Task Details - #${task.id}`,
      width: '90%',
      style: { maxWidth: '800px' },
      content: (
        <div className="space-y-4">
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}><strong>Task ID:</strong> {task.id}</Col>
            <Col xs={24} sm={12}><strong>Date:</strong> {task.taskDate ? new Date(task.taskDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}</Col>
          </Row>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}><strong>Driver:</strong> {task.displayDriverName || 'N/A'}</Col>
            <Col xs={24} sm={12}><strong>Vehicle:</strong> {task.displayVehicleName || 'N/A'}</Col>
          </Row>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}><strong>Route:</strong> {task.pickupLocation || 'N/A'} → {task.dropLocation || 'N/A'}</Col>
            <Col xs={24} sm={12}><strong>Status:</strong> {getStatusTag(task.status)}</Col>
          </Row>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <strong>Pickup Time:</strong> {formatTime(task.plannedPickupTime)}
            </Col>
            <Col xs={24} sm={12}>
              <strong>Drop Time:</strong> {formatTime(task.plannedDropTime)}
            </Col>
          </Row>
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <div><strong>Workers Assigned:</strong> <Tag color="blue">{workersAssigned}</Tag></div>
            </Col>
          </Row>
          
          {workersAssigned > 0 && (
            <div>
              <strong>Assigned Workers ({workersAssigned}):</strong>
              <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                <List
                  dataSource={taskPassengers}
                  renderItem={(passenger, index) => (
                    <List.Item className="px-3 py-2 border-b last:border-b-0">
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} size="small" />}
                        title={<span className="text-sm">{passenger.employeeName || `Worker ${index + 1}`}</span>}
                        description={
                          <div className="text-xs text-gray-600">
                            <div>Employee Code: {passenger.employeeCode || 'N/A'}</div>
                            <div>Department: {passenger.department || 'N/A'}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </div>
          )}
        </div>
      ),
    });
  }, [getStatusTag, formatTime]);

  const columns = useMemo(() => [
    {
      title: 'Date',
      dataIndex: 'taskDate',
      key: 'taskDate',
      responsive: ['md'],
      render: (date) => date ? new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '-',
      sorter: (a, b) => new Date(a.taskDate) - new Date(b.taskDate),
    },
    {
      title: 'Driver',
      key: 'driver',
      responsive: ['sm'],
      render: (_, record) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{record.displayDriverName || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Vehicle',
      key: 'vehicle',
      responsive: ['md'],
      render: (_, record) => (
        <div className="min-w-0">
          <div className="truncate">{record.displayVehicleName || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Route',
      key: 'route',
      render: (_, record) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{record.pickupLocation || 'N/A'} → {record.dropLocation || 'N/A'}</div>
          {record.plannedPickupTime && (
            <div className="text-xs text-gray-500 truncate">
              {formatTime(record.plannedPickupTime)} {record.plannedDropTime && `→ ${formatTime(record.plannedDropTime)}`}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Workers',
      dataIndex: 'workersAssigned',
      key: 'workersAssigned',
      responsive: ['sm'],
      render: (workers) => (
        <div className="flex items-center space-x-1">
          <Badge count={workers || 0} showZero size="small" style={{ backgroundColor: '#52c41a' }}>
            <TeamOutlined style={{ fontSize: '14px', color: '#1890ff' }} />
          </Badge>
          <span className="text-sm hidden sm:inline">{workers}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      responsive: ['sm'],
      render: (status, record) => (
        <Dropdown menu={getStatusMenu(record)} trigger={['click']}>
          <span style={{ cursor: 'pointer' }} className="inline-block">
            {getStatusTag(status)}
          </span>
        </Dropdown>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)} 
            size="small"
            title="View Details"
          />
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            size="small"
            title="Edit Task"
          />
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => showDeleteConfirm(record)} 
            size="small"
            title="Delete Task"
          />
        </Space>
      ),
    },
  ], [formatTime, getStatusMenu, getStatusTag, handleView, handleEdit, showDeleteConfirm]);

  return (
    <div className="p-2 sm:p-4">
      <Card 
        className="shadow-sm"
        bodyStyle={{ padding: '16px' }}
        title={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-lg sm:text-xl font-semibold text-gray-800">Fleet Tasks</div>
            {loading && <Spin size="small" />}
          </div>
        }
        extra={
          <div className="mt-2 sm:mt-0">
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
              size="middle"
            >
              New Task
            </Button>
          </div>
        }
      >
        <Form
          layout="vertical"
          form={searchForm}
          onFinish={handleSearch}
          initialValues={{ searchText: '', status: '', dateRange: [] }}
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="searchText" label="Search">
                <Input placeholder="Driver or Vehicle" prefix={<SearchOutlined />} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="Status">
                <Select placeholder="Select status" allowClear>
                  <Option value="PLANNED">Scheduled</Option>
                  <Option value="ONGOING">In Progress</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={6}>
              <Form.Item name="dateRange" label="Date Range">
                <DatePicker.RangePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={6} className="flex items-end">
              <Space>
                <Button type="primary" htmlType="submit">Search</Button>
                <Button onClick={resetFilters}>Reset</Button>
              </Space>
            </Col>
          </Row>
        </Form>

        <div className="overflow-x-auto mt-4">
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            rowKey={(record) => record._id || record.id}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredData.length,
              showSizeChanger: true,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
            size="middle"
            className="rounded-lg"
          />
        </div>
      </Card>

      <Modal
        title="Confirm Deletion"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this fleet task?</p>
      </Modal>
    </div>
  );
};

export default FleetTasksPage;
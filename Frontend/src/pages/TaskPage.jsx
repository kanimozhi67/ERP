import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Button, 
  Table, 
  Tag,
  Space,
  Descriptions,
  message,
  Spin,
  Modal,
  Select,
  Alert
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import BaseFields from "../components/TaskForm/BaseFields";
import dynamicSections from "../components/TaskForm/DynamicSections";

const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const API_BASE_URL = 'http://localhost:5000/api';

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // Start with list view
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [form] = Form.useForm();
  const [taskType, setTaskType] = useState('WORK');

  useEffect(() => {
    fetchCompanies();
    fetchProjects();
    fetchTasks();
  }, []);

  // Fetch companies
  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/companies`);
      let companiesData = [];
      if (Array.isArray(response.data)) {
        companiesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        companiesData = response.data.data;
      } else if (response.data && Array.isArray(response.data.companies)) {
        companiesData = response.data.companies;
      }
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      message.error('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects`);
      let projectsData = [];
      if (Array.isArray(response.data)) {
        projectsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        projectsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.projects)) {
        projectsData = response.data.projects;
      }
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('Failed to load projects');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/tasks`);
      let tasksData = [];
      if (Array.isArray(response.data)) {
        tasksData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        tasksData = response.data.data;
      } else if (response.data && Array.isArray(response.data.tasks)) {
        tasksData = response.data.tasks;
      }
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Handle company change
  const handleCompanyChange = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    setSelectedCompany(company);
    
    // Reset dependent fields when company changes
    if (form) {
      form.setFieldsValue({
        projectId: undefined
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      setFormLoading(true);
      
      const taskData = {
        ...values,
        taskType,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        status: 'PLANNED',
        companyId: values.companyId, // Use selected company
        additionalData: values.additional_data || {}
      };

      console.log('Submitting task data:', taskData);

      let response;
      if (selectedTask) {
        response = await axios.put(`${API_BASE_URL}/tasks/${selectedTask.id}`, taskData);
        message.success('Task updated successfully!');
      } else {
        response = await axios.post(`${API_BASE_URL}/tasks`, taskData);
        message.success('Task created successfully!');
      }

      // Update tasks list
      if (selectedTask) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id ? response.data.data : task
          )
        );
      } else {
        setTasks(prevTasks => [...prevTasks, response.data.data]);
      }

      setSelectedTask(response.data.data);
      setViewMode('details');
      form.resetFields();
      setSelectedCompany(null);
      
    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${selectedTask ? 'update' : 'create'} task`;
      message.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    confirm({
      title: 'Are you sure you want to delete this task?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
          message.success('Task deleted successfully!');
          setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(null);
            setViewMode('list');
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          message.error('Failed to delete task');
        }
      },
    });
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setViewMode('create');
    
    // Populate form with task data
    form.setFieldsValue({
      companyId: task.companyId,
      projectId: task.projectId,
      taskName: task.taskName,
      taskType: task.taskType,
      description: task.description,
      dateRange: [
        task.startDate ? dayjs(task.startDate) : null,
        task.endDate ? dayjs(task.endDate) : null
      ],
      notes: task.notes,
      additional_data: task.additionalData || {}
    });
    
    // Set selected company for dynamic sections
    const company = companies.find(c => c.id === task.companyId);
    setSelectedCompany(company);
    setTaskType(task.taskType);
  };

  const handleFormCancel = () => {
    if (selectedTask) {
      setViewMode('details');
    } else {
      setViewMode('list');
    }
    setSelectedCompany(null);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setViewMode('create');
    form.resetFields();
    setTaskType('WORK');
    setSelectedCompany(null);
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Task Name',
      dataIndex: 'taskName',
      key: 'taskName',
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (projectName) => projectName || 'N/A'
    },
    {
      title: 'Type',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'COMPLETED' ? 'green' : 
                     status === 'IN_PROGRESS' ? 'orange' : 
                     status === 'CANCELLED' ? 'red' : 'blue';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedTask(record);
              setViewMode('details');
            }}
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const DynamicSection = dynamicSections[taskType] || dynamicSections["OTHER"];
  const isEditing = Boolean(selectedTask && viewMode === 'create');

  return (
    <div className="p-6">
      {/* Header Section with Title and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="mb-0">Task Management</Title>
        {viewMode === 'list' && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
            size="large"
          >
            Create Task
          </Button>
        )}
      </div>

      {/* Create/Edit Task Form */}
      {viewMode === 'create' && (
        <Card 
          title={isEditing ? `✏️ Edit Task - ${selectedTask.taskName}` : '🧱 Create New Task'} 
          className="mb-4 max-w-3xl mx-auto"
        >
          <Spin spinning={formLoading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                taskType: 'WORK',
                dateRange: [dayjs(), dayjs()],
              }}
            >
              {/* 🔹 Company Selection */}
              <Form.Item
                name="companyId"
                label="Company"
                rules={[{ required: true, message: 'Please select a company' }]}
              >
                <Select
                  placeholder="Select Company"
                  onChange={handleCompanyChange}
                  loading={loadingCompanies}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                  onClear={() => setSelectedCompany(null)}
                >
                  {companies.map(company => (
                    <Option key={company.id} value={company.id}>
                      {company.name} ({company.tenantCode})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Show warning if TRANSPORT task type selected but no company */}
              {taskType === 'TRANSPORT' && !selectedCompany && (
                <Alert 
                  message="Company Required for Transport Tasks" 
                  description="Please select a company to load drivers and vehicles for transport tasks."
                  type="warning" 
                  showIcon 
                  className="mb-4"
                />
              )}

              {/* 🔹 Common / Base Fields */}
              <BaseFields 
                onTaskTypeChange={setTaskType}
                projects={projects}
              />

              {/* 🔹 Dynamic Section - Pass selectedCompany to TransportTaskForm */}
              <div className="mt-6 border-t pt-4">
                {taskType === 'TRANSPORT' ? (
                  <DynamicSection form={form} selectedCompany={selectedCompany} />
                ) : (
                  <DynamicSection form={form} />
                )}
              </div>

              {/* 🔹 Buttons */}
              <div className="flex justify-end mt-6 space-x-3">
                <Button 
                  onClick={handleFormCancel}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={formLoading}
                  disabled={projects.length === 0 || !form.getFieldValue('companyId')}
                >
                  {isEditing ? 'Update Task' : 'Create Task'}
                </Button>
              </div>
            </Form>
          </Spin>
        </Card>
      )}

      {/* Task List */}
      {viewMode === 'list' && (
        <Card>
          <Spin spinning={loading}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg">Total Tasks: <strong>{tasks.length}</strong></span>
              <Button onClick={fetchTasks} loading={loading}>
                Refresh
              </Button>
            </div>
            <Table 
              columns={columns} 
              dataSource={tasks}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Spin>
        </Card>
      )}

      {/* Task Details View */}
      {viewMode === 'details' && selectedTask && (
        <Card title={`📋 Task Details - ${selectedTask.taskName}`}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Task ID">{selectedTask.id}</Descriptions.Item>
            <Descriptions.Item label="Task Name">{selectedTask.taskName}</Descriptions.Item>
            <Descriptions.Item label="Company">
              {companies.find(c => c.id === selectedTask.companyId)?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Project">{selectedTask.projectName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Task Type"><Tag color="blue">{selectedTask.taskType}</Tag></Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={
                selectedTask.status === 'COMPLETED' ? 'green' : 
                selectedTask.status === 'IN_PROGRESS' ? 'orange' : 
                selectedTask.status === 'CANCELLED' ? 'red' : 'blue'
              }>
                {selectedTask.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Description">{selectedTask.description || 'No description'}</Descriptions.Item>
            <Descriptions.Item label="Start Date">{selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="End Date">{selectedTask.endDate ? new Date(selectedTask.endDate).toLocaleDateString() : 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>{selectedTask.notes || 'No notes provided'}</Descriptions.Item>
            {selectedTask.additionalData && Object.keys(selectedTask.additionalData).length > 0 && (
              <Descriptions.Item label="Additional Data" span={2}>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="m-0 text-xs">{JSON.stringify(selectedTask.additionalData, null, 2)}</pre>
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
          
          <div className="text-center mt-4">
            <Button 
              type="primary" 
              onClick={handleCreateTask}
              className="mr-2"
            >
              Create New Task
            </Button>
            <Button 
              onClick={() => handleEditTask(selectedTask)}
              className="mr-2"
            >
              Edit Task
            </Button>
            <Button onClick={() => setViewMode('list')}>
              Back to List
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TaskPage;
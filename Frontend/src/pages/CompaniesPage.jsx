import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Space, 
  Card, 
  Popconfirm, 
  Tag,
  Grid
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { useBreakpoint } = Grid;

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await apiService.getCompanies();
      
      // Extract companies data from response
      let companiesData = [];
      
      if (Array.isArray(response?.data)) {
        companiesData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        companiesData = response.data.data;
      } else if (Array.isArray(response?.data?.companies)) {
        companiesData = response.data.companies;
      } else if (Array.isArray(response)) {
        companiesData = response;
      }
      
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      message.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  // Function to get the next available ID
  const getNextAvailableId = () => {
    if (companies.length === 0) return 1;
    
    // Get all existing IDs and find the maximum
    const existingIds = companies.map(company => company.id).filter(id => !isNaN(id));
    if (existingIds.length === 0) return 1;
    
    const maxId = Math.max(...existingIds);
    return maxId + 1;
  };

  const handleCreate = () => {
    setEditingCompany(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    form.setFieldsValue({
      name: company.name,
      tenantCode: company.tenantCode,
    });
    setModalVisible(true);
  };

  const handleDelete = async (companyId) => {
    try {
      await apiService.deleteCompany(companyId);
      message.success('Company deleted successfully');
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      message.error('Failed to delete company');
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Auto-generate the next ID for new companies
      const companyId = editingCompany ? editingCompany.id : getNextAvailableId();
      
      // Prepare company data - only send id, name, and tenantCode
      const companyData = {
        id: companyId,
        name: values.name.trim(),
        tenantCode: values.tenantCode.trim().toUpperCase()
      };

      if (editingCompany) {
        await apiService.updateCompany(companyId, companyData);
        message.success('Company updated successfully');
      } else {
        await apiService.createCompany(companyData);
        message.success('Company created successfully');
      }
      
      setModalVisible(false);
      form.resetFields();
      await fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save company';
      message.error(errorMessage);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingCompany(null);
    form.resetFields();
  };

  // Format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Responsive columns configuration
  const getColumns = () => {
    const baseColumns = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
        align: 'center',
        responsive: ['md'],
        render: (id) => (
          <Tag 
            color="blue" 
            style={{ 
              margin: 0,
              fontSize: '12px',
              padding: '2px 8px',
              fontWeight: '600',
              minWidth: '40px',
              display: 'inline-block'
            }}
          >
            #{id}
          </Tag>
        ),
        sorter: (a, b) => a.id - b.id,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Company Name',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        render: (name) => (
          <div style={{ 
            fontSize: '14px',
            fontWeight: '500',
            padding: '4px 0'
          }}>
            {name}
          </div>
        ),
      },
      {
        title: 'Tenant Code',
        dataIndex: 'tenantCode',
        key: 'tenantCode',
        width: 140,
        align: 'center',
        responsive: ['sm'],
        render: (code) => (
          <Tag 
            color="green" 
            style={{ 
              margin: 0,
              fontSize: '12px',
              padding: '2px 8px',
              fontWeight: '500'
            }}
          >
            {code}
          </Tag>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        align: 'center',
        responsive: ['lg'],
        render: (date) => (
          <div style={{ 
            fontSize: '12px',
            color: '#666',
            padding: '4px 0'
          }}>
            {formatDate(date)}
          </div>
        ),
        sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      },
    ];

    // Actions column - aligned to the right
    const actionsColumn = {
      title: 'Actions',
      key: 'actions',
      width: 150,
      align: 'right',
      render: (_, record) => {
        const companyId = record.id;
        
        return (
          <Space size="small" style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              size="small"
              style={{ 
                padding: '0 8px',
                fontSize: '12px',
                height: '24px',
                color: '#1890ff'
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete Company?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(companyId)}
              okText="Delete"
              cancelText="Cancel"
              okType="danger"
            >
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
                style={{ 
                  padding: '0 8px',
                  fontSize: '12px',
                  height: '24px'
                }}
              >
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    };

    return [...baseColumns, actionsColumn];
  };

  return (
    <div style={{ 
      padding: screens.xs ? '8px' : '16px',
      minHeight: '100vh',
      background: '#fafafa'
    }}>
      <Card 
        title={
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600'
          }}>
            🏢 Companies
          </div>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
            size="middle"
          >
            Add Company
          </Button>
        }
        style={{ 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e8e8e8',
          borderRadius: '8px'
        }}
        styles={{
          body: {
            padding: '16px'
          }
        }}
      >
        <Table 
          columns={getColumns()} 
          dataSource={companies} 
          loading={loading}
          rowKey={(record) => record.id}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total}`,
            size: 'default',
            style: { 
              marginBottom: 0,
              textAlign: 'right'
            }
          }}
          size="middle"
          style={{
            fontSize: '14px'
          }}
          responsive
          locale={{
            emptyText: (
              <div style={{ 
                padding: '40px 24px', 
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#bfbfbf', 
                  marginBottom: '8px' 
                }}>
                  No companies found
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#d9d9d9', 
                  marginBottom: '16px' 
                }}>
                  Create your first company to get started
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleCreate}
                  size="small"
                >
                  Create Company
                </Button>
              </div>
            )
          }}
        />
      </Card>

      <Modal
        title={
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600'
          }}>
            {editingCompany ? `Edit Company` : 'Create New Company'}
          </div>
        }
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={400}
        styles={{
          body: {
            padding: '20px'
          }
        }}
        destroyOnClose={false}
        modalRender={(node) => {
          // Ensure form is connected to the modal
          return React.cloneElement(node, {
            form: form
          });
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="middle"
        >
          <Form.Item
            name="name"
            label="Company Name"
            rules={[
              { required: true, message: 'Please enter company name' },
              { min: 2, message: 'Company name must be at least 2 characters' },
              { max: 100, message: 'Company name must be less than 100 characters' }
            ]}
          >
            <Input 
              placeholder="Enter company name" 
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="tenantCode"
            label="Tenant Code"
            rules={[
              { required: true, message: 'Please enter tenant code' },
              { min: 2, message: 'Tenant code must be at least 2 characters' },
              { max: 20, message: 'Tenant code must be less than 20 characters' },
              { 
                pattern: /^[A-Z0-9_]+$/,
                message: 'Tenant code can only contain uppercase letters, numbers, and underscores'
              }
            ]}
          >
            <Input 
              placeholder="Enter your tenant code" 
              maxLength={20}
              showCount
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'flex-end' 
            }}>
              <Button onClick={handleModalCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
              >
                {editingCompany ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompaniesPage;
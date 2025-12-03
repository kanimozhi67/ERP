import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Input, 
  Table, 
  Checkbox, 
  Row, 
  Col, 
  message, 
  Spin, 
  Alert,
  Card,
  Space,
  Typography,
  Grid
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  SearchOutlined, 
  UserOutlined, 
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons';
import apiService from '../../services/apiService';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const PassengerAssignment = ({ form, companyNumericId }) => {
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = !screens.lg;

  // Fetch worker employees from API
  const fetchWorkerEmployees = async () => {
    if (!companyNumericId) {
      console.log('⚠️ No company ID provided, skipping worker fetch');
      setWorkers([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('👥 Fetching worker employees for company:', companyNumericId);
      
      const response = await apiService.getWorkerEmployees(companyNumericId);
      
      if (response && response.success) {
        console.log('✅ Worker employees fetched successfully:', response.data);
        
        // Transform API response to match our component structure
        const transformedWorkers = response.data.map((employee, index) => ({
          id: employee.id || employee._id || `emp-${index}`,
          workerEmployeeId: employee.userId || employee.id || employee._id,
          employeeName: employee.fullName || `Employee ${index + 1}`,
          department: employee.jobTitle || employee.department || 'General',
          userEmail: employee.email
        }));
        
        setWorkers(transformedWorkers);
        console.log('🔄 Transformed workers:', transformedWorkers);
      } else {
        console.warn('⚠️ No worker employees found or API error:', response?.message);
        setWorkers([]);
        setError(response?.message || 'No workers found for this company');
      }
    } catch (error) {
      console.error('❌ Error fetching worker employees:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load worker employees';
      setError(errorMessage);
      message.error('Failed to load worker employees');
      setWorkers([]);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Filter workers based on search text
  const filteredWorkers = searchText 
    ? workers.filter(worker =>
        worker.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
        worker.department?.toLowerCase().includes(searchText.toLowerCase())
      )
    : workers;

  // Load initial data and set up form synchronization
  useEffect(() => {
    if (!form) return;

    console.log('👥 PassengerAssignment - Component mounted with form');

    const checkAndSetPassengers = () => {
      try {
        const values = form.getFieldsValue();
        console.log('👥 PassengerAssignment - Current form values:', {
          passengers: values.passengers
        });

        if (values.passengers && Array.isArray(values.passengers) && values.passengers.length > 0) {
          console.log('🔄 Setting selected passengers from form:', values.passengers);
          
          const mappedPassengers = values.passengers.map(passenger => {
            // Try to find matching worker in current workers list
            const matchingWorker = workers.find(worker => 
              worker.id === passenger.id || 
              worker.workerEmployeeId === passenger.workerEmployeeId ||
              worker.employeeName === passenger.employeeName
            );

            if (matchingWorker) {
              return matchingWorker;
            } else {
              // If no match found, use the passenger data as is
              return {
                id: passenger.id || passenger.workerEmployeeId || `pass-${Math.random()}`,
                workerEmployeeId: passenger.workerEmployeeId || passenger.id,
                employeeName: passenger.employeeName || `Passenger ${passenger.id}`,
                department: passenger.department || 'General',
                ...passenger
              };
            }
          });

          setSelectedPassengers(mappedPassengers);
        }
      } catch (error) {
        console.error('❌ Error reading passenger data from form:', error);
      }
    };

    // Set up intervals to check form data
    const intervals = [
      setTimeout(checkAndSetPassengers, 300),
      setTimeout(checkAndSetPassengers, 800),
      setTimeout(checkAndSetPassengers, 1500),
    ];

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [form, workers]);

  // Fetch workers when company ID changes
  useEffect(() => {
    if (companyNumericId) {
      console.log('🏢 Company ID changed, fetching workers:', companyNumericId);
      fetchWorkerEmployees();
    } else {
      console.log('🏢 No company ID available');
      setWorkers([]);
      setSelectedPassengers([]);
      setError(null);
    }
  }, [companyNumericId]);

  const handleSelectAll = () => {
    if (workers.length === 0) return;
    
    const allPassengers = [...workers];
    setSelectedPassengers(allPassengers);
    form.setFieldsValue({ passengers: allPassengers });
    message.success(`Selected all ${allPassengers.length} workers`);
  };

  const handleClearAll = () => {
    setSelectedPassengers([]);
    form.setFieldsValue({ passengers: [] });
    message.info('Cleared all selections');
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleSelectWorker = (worker, checked) => {
    let updatedPassengers;
    if (checked) {
      updatedPassengers = [...selectedPassengers, worker];
    } else {
      updatedPassengers = selectedPassengers.filter(p => p.id !== worker.id);
    }
    
    setSelectedPassengers(updatedPassengers);
    form.setFieldsValue({ passengers: updatedPassengers });
    
    console.log('🔄 Updated passengers:', updatedPassengers);
  };

  const handleSelectAllInTable = (checked) => {
    let updatedPassengers;
    if (checked) {
      const newSelections = filteredWorkers.filter(worker => 
        !selectedPassengers.some(p => p.id === worker.id)
      );
      updatedPassengers = [...selectedPassengers, ...newSelections];
    } else {
      const filteredIds = filteredWorkers.map(worker => worker.id);
      updatedPassengers = selectedPassengers.filter(p => !filteredIds.includes(p.id));
    }
    
    setSelectedPassengers(updatedPassengers);
    form.setFieldsValue({ passengers: updatedPassengers });
    
    console.log('🔄 Updated passengers after select all:', updatedPassengers);
  };

  const isWorkerSelected = (workerId) => {
    return selectedPassengers.some(p => p.id === workerId);
  };

  // Responsive columns configuration - no horizontal scroll needed
  const getColumns = () => {
    const baseColumns = [
      {
        title: 'Select',
        dataIndex: 'id',
        key: 'select',
        width: isMobile ? 60 : 80,
        render: (id, record) => (
          <Checkbox
            checked={isWorkerSelected(id)}
            onChange={(e) => handleSelectWorker(record, e.target.checked)}
            disabled={loading}
          />
        ),
      },
      {
        title: 'Worker Name',
        dataIndex: 'employeeName',
        key: 'employeeName',
        render: (name, record) => (
          <Space size="small" direction={isMobile ? "vertical" : "horizontal"} align={isMobile ? "start" : "center"}>
            <UserOutlined className="text-gray-400" />
            <div>
              <div className="font-medium" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                {name}
              </div>
              {record.userEmail && (
                <div className="text-xs text-gray-500" style={{ fontSize: isMobile ? '10px' : '12px' }}>
                  {record.userEmail}
                </div>
              )}
            </div>
          </Space>
        ),
      },
      {
        title: 'Job Title',
        dataIndex: 'department',
        key: 'department',
        width: isMobile ? 100 : 150,
        render: (department) => (
          <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
            {department}
          </Text>
        ),
      },
    ];

    return baseColumns;
  };

  if (loading && !initialized) {
    return (
      <Card className="mb-6" style={{ borderLeft: '4px solid #722ed1' }}>
        <Title level={4} className="text-gray-800 mb-4">
          <TeamOutlined className="mr-2" />
          PASSENGER ASSIGNMENT
        </Title>
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
          <span className="ml-2 text-gray-600">Loading worker employees...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="mb-6" 
      style={{ borderLeft: '4px solid #722ed1' }}
      bodyStyle={{ padding: isMobile ? '12px' : '20px' }}
    >
      <Title level={4} className="text-gray-800 mb-4" style={{ fontSize: isMobile ? '16px' : '18px' }}>
        <TeamOutlined className="mr-2" />
        PASSENGER ASSIGNMENT
      </Title>

      <div className="space-y-4">
        {/* Search Section */}
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>Search Worker Name / Job Title</Text>
              <Input
                placeholder="Search by name or job title"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchText}
                onChange={handleSearch}
                size={isMobile ? "middle" : "large"}
                allowClear
                disabled={!companyNumericId || loading}
                style={{ fontSize: isMobile ? '13px' : '14px' }}
              />
            </Space>
          </Col>
          {companyNumericId && !isMobile && (
            <Col xs={24} md={8}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Company ID: {companyNumericId}
              </Text>
            </Col>
          )}
        </Row>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Error Loading Workers"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={fetchWorkerEmployees}>
                Retry
              </Button>
            }
            style={{ fontSize: isMobile ? '12px' : '14px' }}
          />
        )}

        {/* No Company Selected */}
        {!companyNumericId ? (
          <Alert
            message="Company Selection Required"
            description="Please select a company first to load available workers."
            type="warning"
            showIcon
            style={{ fontSize: isMobile ? '12px' : '14px' }}
          />
        ) : workers.length === 0 && initialized && !error ? (
          <Alert
            message="No Workers Found"
            description="No active worker employees found for this company."
            type="info"
            showIcon
            style={{ fontSize: isMobile ? '12px' : '14px' }}
          />
        ) : (
          <>
            {/* Action Buttons */}
            <Row gutter={[8, 8]} justify="space-between" align="middle">
              <Col>
                <Space wrap size={isMobile ? "small" : "middle"}>
                  <Button 
                    type="default" 
                    icon={<CheckOutlined />}
                    onClick={handleSelectAll}
                    disabled={workers.length === 0 || loading}
                    size={isMobile ? "small" : "middle"}
                    style={{ fontSize: isMobile ? '12px' : '14px' }}
                  >
                    {isMobile ? `All (${workers.length})` : `Select All (${workers.length})`}
                  </Button>
                  <Button 
                    type="default" 
                    icon={<CloseOutlined />}
                    onClick={handleClearAll}
                    disabled={selectedPassengers.length === 0 || loading}
                    size={isMobile ? "small" : "middle"}
                    style={{ fontSize: isMobile ? '12px' : '14px' }}
                  >
                    {isMobile ? 'Clear' : 'Clear All'}
                  </Button>
                </Space>
              </Col>
              <Col>
                <Button 
                  type="default" 
                  icon={<ReloadOutlined />}
                  onClick={fetchWorkerEmployees}
                  loading={loading}
                  size={isMobile ? "small" : "middle"}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  {isMobile ? '' : 'Refresh'}
                </Button>
              </Col>
            </Row>

            {/* Workers Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <Row justify="space-between" align="middle" gutter={[8, 8]}>
                  <Col>
                    <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>
                      Workers List ({filteredWorkers.length} found)
                      {selectedPassengers.length > 0 && ` - ${selectedPassengers.length} selected`}
                    </Text>
                  </Col>
                  <Col>
                    <Checkbox
                      onChange={(e) => handleSelectAllInTable(e.target.checked)}
                      checked={
                        filteredWorkers.length > 0 && 
                        filteredWorkers.every(worker => isWorkerSelected(worker.id))
                      }
                      indeterminate={
                        filteredWorkers.some(worker => isWorkerSelected(worker.id)) &&
                        !filteredWorkers.every(worker => isWorkerSelected(worker.id))
                      }
                      disabled={filteredWorkers.length === 0}
                      style={{ fontSize: isMobile ? '12px' : '14px' }}
                    >
                      {isMobile ? 'All' : 'Select All'}
                    </Checkbox>
                  </Col>
                </Row>
              </div>
              <Table
                columns={getColumns()}
                dataSource={filteredWorkers}
                rowKey="id"
                pagination={false}
                scroll={{ y: isMobile ? 250 : 350 }}
                size={isMobile ? "small" : "middle"}
                rowClassName="hover:bg-gray-50"
                loading={loading}
                locale={{
                  emptyText: searchText ? 'No workers match your search' : 'No workers available'
                }}
                style={{
                  fontSize: isMobile ? '12px' : '14px'
                }}
                className="no-horizontal-scroll"
              />
            </div>
          </>
        )}

        {/* Selection Summary */}
        {selectedPassengers.length > 0 && (
          <Alert
            message={`${selectedPassengers.length} worker(s) selected for transport`}
            description={
              <Text type="success" style={{ fontSize: isMobile ? '11px' : '12px' }}>
                <strong>Selected:</strong> {selectedPassengers.slice(0, 3).map(p => p.employeeName).join(', ')}
                {selectedPassengers.length > 3 && ` and ${selectedPassengers.length - 3} more...`}
              </Text>
            }
            type="success"
            showIcon
            style={{ fontSize: isMobile ? '12px' : '14px' }}
          />
        )}

        {/* Hidden Form Field */}
        <Form.Item
          name="passengers"
          rules={[
            { 
              required: true, 
              message: 'Please select at least one passenger' 
            }
          ]}
          style={{ display: 'none' }}
        >
          <Input type="hidden" />
        </Form.Item>
      </div>
    </Card>
  );
};

export default PassengerAssignment;
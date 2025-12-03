import React, { useState, useEffect } from 'react';
import { Form, Input, Row, Col, Button } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';

const PickupDropLocations = ({ form }) => {
  const [pickupValue, setPickupValue] = useState('');
  const [dropValue, setDropValue] = useState('');

  const handleSearchClick = (field) => {
    const input = document.querySelector(`[name="${field}"]`);
    if (input) input.focus();
  };

  // Use a more direct approach - check form values on mount and periodically
  useEffect(() => {
    if (!form) {
      console.log('📍 PickupDropLocations - No form instance available');
      return;
    }

    console.log('📍 PickupDropLocations - Component mounted with form');

    const checkAndSetValues = () => {
      try {
        const values = form.getFieldsValue();
        console.log('📍 PickupDropLocations - Current form values:', {
          pickupLocation: values.pickupLocation,
          dropLocation: values.dropLocation
        });

        // Set local state from form values
        if (values.pickupLocation !== undefined && values.pickupLocation !== pickupValue) {
          console.log('🔄 Setting pickup value:', values.pickupLocation);
          setPickupValue(values.pickupLocation || '');
        }
        
        if (values.dropLocation !== undefined && values.dropLocation !== dropValue) {
          console.log('🔄 Setting drop value:', values.dropLocation);
          setDropValue(values.dropLocation || '');
        }
      } catch (error) {
        console.error('❌ Error reading form values:', error);
      }
    };

    // Check immediately
    checkAndSetValues();

    // Set up periodic checks to catch autofilled values
    const intervals = [
      setTimeout(checkAndSetValues, 300),
      setTimeout(checkAndSetValues, 800),
      setTimeout(checkAndSetValues, 1500),
      setTimeout(checkAndSetValues, 2500),
      setTimeout(checkAndSetValues, 4000)
    ];

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [form, pickupValue, dropValue]);

  // Handle input changes
  const handlePickupChange = (e) => {
    const value = e.target.value;
    setPickupValue(value);
    if (form) {
      form.setFieldsValue({ pickupLocation: value });
    }
  };

  const handleDropChange = (e) => {
    const value = e.target.value;
    setDropValue(value);
    if (form) {
      form.setFieldsValue({ dropLocation: value });
    }
  };

  return (
    <div className="mb-8">
      <div className="text-lg font-semibold text-gray-800 mb-4">PICKUP & DROP LOCATIONS</div>
      <div className="border-l-4 border-orange-500 pl-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Form.Item
              label="Pickup Location"
              name="pickupLocation"
              rules={[
                { required: true, message: 'Please enter pickup location' },
                { max: 200, message: 'Pickup location cannot exceed 200 characters' }
              ]}
            >
              <div className="relative">
                <Input 
                  placeholder="Enter pickup location (e.g., Chennai)"
                  size="large"
                  prefix={<EnvironmentOutlined className="text-gray-400" />}
                  suffix={
                    <Button 
                      type="text" 
                      icon={<SearchOutlined />} 
                      className="text-blue-500 hover:text-blue-700"
                      size="small"
                      onClick={() => handleSearchClick('pickupLocation')}
                    />
                  }
                  showCount
                  maxLength={200}
                  value={pickupValue}
                  onChange={handlePickupChange}
                />
              </div>
            </Form.Item>
          </Col>

          <Col xs={24} lg={12}>
            <Form.Item
              label="Drop Location"
              name="dropLocation"
              rules={[
                { required: true, message: 'Please enter drop location' },
                { max: 200, message: 'Drop location cannot exceed 200 characters' }
              ]}
            >
              <div className="relative">
                <Input 
                  placeholder="Enter drop location (e.g., Madurai)"
                  size="large"
                  prefix={<EnvironmentOutlined className="text-gray-400" />}
                  suffix={
                    <Button 
                      type="text" 
                      icon={<SearchOutlined />} 
                      className="text-blue-500 hover:text-blue-700"
                      size="small"
                      onClick={() => handleSearchClick('dropLocation')}
                    />
                  }
                  showCount
                  maxLength={200}
                  value={dropValue}
                  onChange={handleDropChange}
                />
              </div>
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PickupDropLocations;
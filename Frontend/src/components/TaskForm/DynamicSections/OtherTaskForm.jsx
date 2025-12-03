import React from 'react';
import { Form, Input, Card } from 'antd';

const { TextArea } = Input;

const OtherTaskForm = ({ form }) => (
  <Card title="📋 Additional Information" size="small" className="mb-4">
    <Form.Item 
      name={['additional_data', 'customFields']} 
      label="Additional Information"
    >
      <TextArea 
        rows={3} 
        placeholder="Enter any additional information for this task type" 
      />
    </Form.Item>
  </Card>
);

export default OtherTaskForm;
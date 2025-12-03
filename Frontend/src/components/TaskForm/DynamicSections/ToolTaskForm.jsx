import React from 'react';
import { Form, Select, Input, Card } from 'antd';

const { Option } = Select;

const ToolTaskForm = ({ form }) => (
  <Card title="🛠️ Tool Task Details" size="small" className="mb-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item 
        name={['additional_data', 'toolType']} 
        label="Tool Type"
      >
        <Select placeholder="Select tool type">
          <Option value="POWER_TOOL">Power Tool</Option>
          <Option value="HAND_TOOL">Hand Tool</Option>
          <Option value="MEASUREMENT">Measurement Tool</Option>
          <Option value="SAFETY">Safety Equipment</Option>
          <Option value="OTHER">Other</Option>
        </Select>
      </Form.Item>

      <Form.Item 
        name={['additional_data', 'toolName']} 
        label="Tool Name"
      >
        <Input placeholder="Enter tool name" />
      </Form.Item>

      <Form.Item 
        name={['additional_data', 'condition']} 
        label="Condition"
      >
        <Select placeholder="Select tool condition">
          <Option value="NEW">New</Option>
          <Option value="GOOD">Good</Option>
          <Option value="FAIR">Fair</Option>
          <Option value="POOR">Poor</Option>
          <Option value="NEEDS_REPAIR">Needs Repair</Option>
        </Select>
      </Form.Item>
    </div>
  </Card>
);

export default ToolTaskForm;
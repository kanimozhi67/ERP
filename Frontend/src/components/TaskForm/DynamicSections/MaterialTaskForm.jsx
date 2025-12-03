import React from 'react';
import { Form, Select, InputNumber, Input, Card } from 'antd';

const { Option } = Select;

const MaterialTaskForm = ({ form }) => (
  <Card title="🏗️ Material Task Details" size="small" className="mb-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item 
        name={['additional_data', 'materialType']} 
        label="Material Type"
      >
        <Select placeholder="Select material type">
          <Option value="CONSTRUCTION">Construction Material</Option>
          <Option value="ELECTRICAL">Electrical</Option>
          <Option value="PLUMBING">Plumbing</Option>
          <Option value="OFFICE_SUPPLIES">Office Supplies</Option>
          <Option value="OTHER">Other</Option>
        </Select>
      </Form.Item>

      <Form.Item 
        name={['additional_data', 'quantity']} 
        label="Quantity"
      >
        <InputNumber 
          min={1} 
          className="w-full" 
          placeholder="Enter quantity" 
        />
      </Form.Item>

      <Form.Item 
        name={['additional_data', 'unit']} 
        label="Unit"
      >
        <Input placeholder="e.g., kg, pieces, boxes" />
      </Form.Item>

      <Form.Item 
        name={['additional_data', 'supplier']} 
        label="Supplier"
      >
        <Input placeholder="Enter supplier name" />
      </Form.Item>
    </div>
  </Card>
);

export default MaterialTaskForm;
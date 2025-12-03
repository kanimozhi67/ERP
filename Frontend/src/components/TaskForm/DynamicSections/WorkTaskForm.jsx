import React from 'react';
import { Form, Select, InputNumber, Card } from 'antd';

const { Option } = Select;

const WorkTaskForm = ({ form }) => (
  <Card title="👷 Work Task Details" size="small" className="mb-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item 
        name={['additional_data', 'workType']} 
        label="Work Type"
      >
        <Select placeholder="Select work type">
          <Option value="CONSTRUCTION">Construction</Option>
          <Option value="REPAIR">Repair</Option>
          <Option value="INSTALLATION">Installation</Option>
          <Option value="DEMOLITION">Demolition</Option>
          <Option value="RENOVATION">Renovation</Option>
        </Select>
      </Form.Item>

      <Form.Item 
        name={['additional_data', 'priority']} 
        label="Priority"
      >
        <Select placeholder="Select priority">
          <Option value="LOW">Low</Option>
          <Option value="MEDIUM">Medium</Option>
          <Option value="HIGH">High</Option>
          <Option value="URGENT">Urgent</Option>
        </Select>
      </Form.Item>

      <Form.Item 
        name={['additional_data', 'estimatedHours']} 
        label="Estimated Hours"
      >
        <InputNumber 
          min={1} 
          max={1000} 
          className="w-full" 
          placeholder="Enter hours" 
        />
      </Form.Item>

      <Form.Item 
        name={['additional_data', 'crewSize']} 
        label="Crew Size"
      >
        <InputNumber 
          min={1} 
          max={50} 
          className="w-full" 
          placeholder="Enter crew size" 
        />
      </Form.Item>
    </div>
  </Card>
);

export default WorkTaskForm;
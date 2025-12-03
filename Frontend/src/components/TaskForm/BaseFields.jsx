import React from 'react';
import { Form, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const TASK_TYPES = [
  'WORK', 'TRANSPORT', 'MATERIAL', 'TOOL', 'INSPECTION',
  'MAINTENANCE', 'ADMIN', 'TRAINING', 'OTHER'
];

const BaseFields = ({ onTaskTypeChange, projects = [] }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item
        name="projectId"
        label="Project"
        rules={[{ required: true, message: 'Please select a project' }]}
      >
        <Select 
          placeholder={projects.length === 0 ? "No projects available" : "Select Project"}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
          disabled={projects.length === 0}
        >
          {projects.map(project => (
            <Option key={project.id} value={project.id}>
              {project.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="taskName"
        label="Task Name"
        rules={[{ required: true, message: 'Please enter task name' }]}
      >
        <Input placeholder="Enter task name" />
      </Form.Item>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item
        name="taskType"
        label="Task Type"
        rules={[{ required: true, message: 'Please select task type' }]}
      >
        <Select onChange={onTaskTypeChange} placeholder="Select Task Type">
          {TASK_TYPES.map(type => (
            <Option key={type} value={type}>{type}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <Input placeholder="Enter task description" />
      </Form.Item>
    </div>

    <Form.Item 
      name="dateRange" 
      label="Date Range"
    >
      <RangePicker 
        style={{ width: '100%' }}
        placeholder={['Start Date', 'End Date']}
      />
    </Form.Item>

    <Form.Item
      name="notes"
      label="Notes"
    >
      <TextArea rows={4} placeholder="Enter additional notes" />
    </Form.Item>

    {projects.length === 0 && (
      <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
        ⚠️ No projects found. Please create projects first to assign tasks.
      </div>
    )}
  </div>
);

export default BaseFields;
// components/transport/JsBasicDetailsForm.js
import React from 'react';
import { Form, Select, DatePicker, TimePicker, InputNumber } from 'antd';
import { 
  BuildingOfficeIcon, 
  CalendarIcon, 
  ClockIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const { Option } = Select;

const JsBasicDetailsForm = ({ form, companies, projects }) => {
  console.log('🔍 BasicDetailsForm - Companies:', companies);
  console.log('🔍 BasicDetailsForm - Projects:', projects);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
          <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">BASIC DETAILS</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Company ID - FIXED: Store numeric ID */}
        <Form.Item
          name="companyId" // CHANGED from "company"
          label={<span className="text-sm font-medium text-gray-700">Company *</span>}
          rules={[{ required: true, message: 'Please select company' }]}
          className="mb-0"
        >
          <Select
            size="large"
            placeholder="Select Company"
            className="w-full rounded-lg"
            suffixIcon={<BuildingOfficeIcon className="w-4 h-4 text-gray-400" />}
            onChange={(value) => {
              console.log('🏢 Selected company ID:', value, 'Type:', typeof value);
            }}
          >
            {companies.map(company => (
              <Option key={company.id} value={company.id}> {/* Store numeric ID */}
                {company.name} ({company.tenantCode}) - ID: {company.id}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Project ID - FIXED: Store numeric ID */}
        <Form.Item
          name="projectId" // CHANGED from "project"
          label={<span className="text-sm font-medium text-gray-700">Project</span>}
          className="mb-0"
        >
          <Select
            size="large"
            placeholder="Select Project"
            className="w-full rounded-lg"
            onChange={(value) => {
              console.log('📋 Selected project ID:', value, 'Type:', typeof value);
            }}
          >
            {projects.map(project => (
              <Option key={project.id} value={project.id}> {/* Store numeric ID */}
                {project.name} - {project.code} (ID: {project.id})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Task Date */}
        <Form.Item
          name="taskDate"
          label={<span className="text-sm font-medium text-gray-700">Task Date *</span>}
          rules={[{ required: true, message: 'Please select task date' }]}
          className="mb-0"
        >
          <DatePicker
            size="large"
            className="w-full rounded-lg"
            format="DD/MM/YYYY"
            suffixIcon={<CalendarIcon className="w-4 h-4 text-gray-400" />}
            onChange={(date) => {
              console.log('📅 Selected task date:', date?.format('YYYY-MM-DD'));
            }}
          />
        </Form.Item>

        {/* Expected Passengers */}
        <Form.Item
          name="expectedPassengers"
          label={<span className="text-sm font-medium text-gray-700">Expected Passengers</span>}
          className="mb-0"
        >
          <InputNumber
            size="large"
            min={0}
            placeholder="0"
            className="w-full rounded-lg"
            onChange={(value) => {
              console.log('👥 Expected passengers:', value);
            }}
          />
        </Form.Item>

        {/* Planned Pickup Time - FIXED NAME */}
        <Form.Item
          name="plannedPickupTime" // CHANGED from "pickupTime"
          label={<span className="text-sm font-medium text-gray-700">Pickup Time *</span>}
          rules={[{ required: true, message: 'Please select pickup time' }]}
          className="mb-0"
        >
          <TimePicker
            size="large"
            format="HH:mm"
            className="w-full rounded-lg"
            suffixIcon={<ClockIcon className="w-4 h-4 text-gray-400" />}
            onChange={(time) => {
              console.log('⏰ Selected pickup time:', time?.format('HH:mm'));
            }}
          />
        </Form.Item>

        {/* Planned Drop Time - FIXED NAME */}
        <Form.Item
          name="plannedDropTime" // CHANGED from "dropTime"
          label={<span className="text-sm font-medium text-gray-700">Drop Time *</span>}
          rules={[{ required: true, message: 'Please select drop time' }]}
          className="mb-0"
        >
          <TimePicker
            size="large"
            format="HH:mm"
            className="w-full rounded-lg"
            suffixIcon={<ClockIcon className="w-4 h-4 text-gray-400" />}
            onChange={(time) => {
              console.log('⏰ Selected drop time:', time?.format('HH:mm'));
            }}
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default JsBasicDetailsForm;
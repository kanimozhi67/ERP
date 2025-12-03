import React, { useState } from 'react';
import { Form, Button, Card, Spin, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import BaseFields from './BaseFields';
import dynamicSections from './DynamicSections';

const API_BASE_URL = 'http://localhost:5000/api';

const TaskForm = ({ 
  isEditing = false, 
  selectedTask = null, 
  onCancel, 
  onSuccess,
  projects = [],
  formLoading = false 
}) => {
  const [form] = Form.useForm();
  const [taskType, setTaskType] = useState(selectedTask?.taskType || 'WORK');
  const [loading, setLoading] = useState(false);

  const DynamicSection = dynamicSections[taskType] || dynamicSections['OTHER'];

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const taskData = {
        ...values,
        taskType,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        status: 'PLANNED',
        companyId: 1,
        additionalData: values.additional_data || {}
      };

      console.log('Submitting task data:', taskData);

      let response;
      if (isEditing && selectedTask) {
        response = await axios.put(`${API_BASE_URL}/tasks/${selectedTask.id}`, taskData);
        message.success('Task updated successfully!');
      } else {
        response = await axios.post(`${API_BASE_URL}/tasks`, taskData);
        message.success('Task created successfully!');
      }

      if (onSuccess) {
        onSuccess(response.data.data);
      }

      if (!isEditing) {
        form.resetFields();
        setTaskType('WORK');
      }

    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} task`;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set form values when editing
  React.useEffect(() => {
    if (isEditing && selectedTask) {
      form.setFieldsValue({
        projectId: selectedTask.projectId,
        taskName: selectedTask.taskName,
        taskType: selectedTask.taskType,
        description: selectedTask.description,
        dateRange: [
          selectedTask.startDate ? dayjs(selectedTask.startDate) : null,
          selectedTask.endDate ? dayjs(selectedTask.endDate) : null
        ],
        notes: selectedTask.notes,
        additional_data: selectedTask.additionalData || {}
      });
      setTaskType(selectedTask.taskType);
    }
  }, [isEditing, selectedTask, form]);

  return (
    <Card 
      title={
        <div className="flex items-center">
          <PlusOutlined className="mr-2" />
          {isEditing ? `✏️ Edit Task - ${selectedTask?.taskName}` : '🧱 Create New Task'}
        </div>
      } 
      className="mb-4 shadow-md"
    >
      <Spin spinning={loading || formLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            taskType: 'WORK'
          }}
        >
          {/* 🔹 Common / Base Fields */}
          <BaseFields 
            onTaskTypeChange={setTaskType}
            projects={projects}
          />

          {/* 🔹 Dynamic Section */}
          <div className="mt-6 border-t pt-4">
            <DynamicSection form={form} />
          </div>

          {/* 🔹 Buttons */}
          <div className="flex justify-end mt-6 space-x-3">
            <Button 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              disabled={projects.length === 0}
            >
              {isEditing ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </Form>
      </Spin>
    </Card>
  );
};

export default TaskForm;
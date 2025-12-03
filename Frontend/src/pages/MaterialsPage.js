import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Input, Modal, Form, InputNumber } from 'antd';
import axios from 'axios';

const { Search } = Input;

const MaterialPage = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [form] = Form.useForm();

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/materials');
      setMaterials(res.data);
      setFilteredData(res.data);
    } catch (err) {
      message.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const onSearch = (value) => {
    const filtered = materials.filter(item =>
      item.name.toLowerCase().includes(value.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredData(filtered);
  };

  const openModal = (material = null) => {
    setEditingMaterial(material);
    if (material) {
      form.setFieldsValue(material);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingMaterial(null);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/materials/${id}`);
      message.success('Material deleted');
      fetchMaterials();
    } catch (err) {
      message.error('Failed to delete material');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingMaterial) {
        await axios.put(`http://localhost:5000/api/materials/${editingMaterial._id}`, values);
        message.success('Material updated');
      } else {
        await axios.post('http://localhost:5000/api/materials', values);
        message.success('Material added');
      }
      fetchMaterials();
      handleCancel();
    } catch (err) {
      message.error('Failed to save material');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', filters: [
      { text: 'bag', value: 'bag' },
      { text: 'm3', value: 'm3' },
      { text: 'pcs', value: 'pcs' },
      { text: 'liter', value: 'liter' },
      { text: 'sheet', value: 'sheet' },
      { text: 'kg', value: 'kg' },
    ], onFilter: (value, record) => record.unit === value },
    { title: 'Stock Qty', dataIndex: 'stock_qty', key: 'stock_qty', sorter: (a, b) => a.stock_qty - b.stock_qty },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => openModal(record)}>Edit</Button>
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record._id)}>
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => openModal()}>Add Material</Button>
        <Search
          placeholder="Search by name or description"
          onSearch={onSearch}
          allowClear
          style={{ width: 300 }}
        />
      </Space>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 5 }}
      />

      {/* Modal Form */}
      <Modal
        title={editingMaterial ? 'Edit Material' : 'Add Material'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter material name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true, message: 'Please enter unit' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="stock_qty" label="Stock Quantity" rules={[{ required: true, message: 'Please enter stock quantity' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">{editingMaterial ? 'Update' : 'Add'}</Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialPage;

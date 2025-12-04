import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  message,
  Popconfirm,
  Input,
  Modal,
  Form,
  InputNumber,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

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
      const res = await axios.get("http://localhost:5000/api/materials");
      setMaterials(res.data);
      setFilteredData(res.data);
    } catch (err) {
      message.error("Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);


  const onSearch = (value) => {
  const search = value.trim().toLowerCase();

  if (!search) {
    setFilteredData(materials); // reset when empty
    return;
  }

  const filtered = materials.filter((item) => {
    const name = item?.name?.toLowerCase() || "";
    const desc = item?.description?.toLowerCase() || "";
    const unit = item?.unit?.toLowerCase() || "";
    const qty = String(item?.stock_qty || "").toLowerCase();

    return (
      name.includes(search) ||
      desc.includes(search) ||
      unit.includes(search) ||
      qty.includes(search)
    );
  });

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
      message.success("Material deleted");
      fetchMaterials();
    } catch (err) {
      message.error("Failed to delete material");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingMaterial) {
        await axios.put(
          `http://localhost:5000/api/materials/${editingMaterial._id}`,
          values
        );
        message.success("Material updated");
      } else {
        await axios.post("http://localhost:5000/api/materials", values);
        message.success("Material added");
      }
      fetchMaterials();
      handleCancel();
    } catch (err) {
      message.error("Failed to save material");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      filters: [
        { text: "bag", value: "bag" },
        { text: "meter", value: "meter" },
        { text: "pcs", value: "pcs" },
        { text: "liter", value: "liter" },
        { text: "sheet", value: "sheet" },
        { text: "kg", value: "kg" },
      ],
      onFilter: (value, record) => record.unit === value,
    },
    {
      title: "Stock Qty",
      dataIndex: "stock_qty",
      key: "stock_qty",
      sorter: (a, b) => a.stock_qty - b.stock_qty,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => openModal(record)}>
            <EditOutlined />
          </Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              danger
              style={{
                backgroundColor: "white",
                borderColor: "red",
                color: "red",
              }}
            >
              {" "}
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
    
      <Card 
  title={
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "12px" 
    }}>
      <div style={{ 
        fontSize: "18px", 
        fontWeight: "600" 
      }}><span style={{ fontSize: "25px" }}>📦</span> 
        Materials
      </div>

      <Input
        placeholder="🔍  Search materials "
        allowClear
        onChange={(e) => onSearch(e.target.value)}
         style={{ width: 260 }}
      />
    </div>
  }
  extra={
    <Button
      type="primary"
      onClick={() => openModal()}
      size="middle"
      icon={<PlusOutlined />}
    >
      Add Material
    </Button>
  }
  style={{ 
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e8e8e8",
    borderRadius: "8px"
  }}
  styles={{
    body: { padding: "16px" }
  }}
> </Card>

       

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
         pagination={{
         
    pageSize: 5,
     pageSizeOptions: ['5', '10', '20', '50'],
    showSizeChanger: false,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
    position: ['bottomCenter'],
   
  }}
      />

      {/* Modal Form */}
      <Modal
        title={editingMaterial ? "Edit Material" : "Add Material"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter material name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="unit"
            label="Unit"
            rules={[{ required: true, message: "Please enter unit" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="stock_qty"
            label="Stock Quantity"
            rules={[{ required: true, message: "Please enter stock quantity" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingMaterial ? "Update" : "Add"}
              </Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialPage;

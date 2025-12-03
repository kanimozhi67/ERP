import React from 'react';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const DriverManagementPage = () => {
  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>Driver Management</Title>
        <p>Driver management content goes here...</p>
      </Content>
    </Layout>
  );
};

export default DriverManagementPage;
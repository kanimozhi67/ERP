import React from 'react';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const FleetManagementPage = () => {
  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>Fleet Management</Title>
        <p>Fleet management content goes here...</p>
      </Content>
    </Layout>
  );
};

export default FleetManagementPage;
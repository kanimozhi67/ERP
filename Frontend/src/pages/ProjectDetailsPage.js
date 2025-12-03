import React from 'react';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const ProjectDetailsPage = () => {
  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>Project Details</Title>
        <p>Project details content goes here...</p>
      </Content>
    </Layout>
  );
};

export default ProjectDetailsPage;
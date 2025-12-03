import React from 'react';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const ProjectsPage = () => {
  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>Projects</Title>
        <p>Projects management content goes here...</p>
      </Content>
    </Layout>
  );
};

export default ProjectsPage;
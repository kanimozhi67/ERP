import React from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, message, ConfigProvider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = (values) => {
    console.log('Login values:', values);
    message.success('Login successful!');
    
    // Redirect to home page after successful login
    navigate('/home');
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <Card 
            className="w-full shadow-2xl rounded-2xl border-0"
            bordered={false}
            styles={{
              body: {
                padding: '40px 32px'
              }
            }}
          >
            <div className="text-center mb-4">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="h-16 w-auto mx-auto"
              />
            </div>
            
            <div className="text-center mb-8">
              <Title level={2} className="!mb-2 !text-gray-800 font-semibold">
                Welcome Back
              </Title>
              <Text className="text-gray-500 text-base">
                Please sign in to continue
              </Text>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
              requiredMark={false}
              size="large"
            >
              <Form.Item
                label={<span className="text-gray-700 font-medium text-sm">Username</span>}
                name="username"
                className="mb-4"
              >
                <Input 
                  prefix={<UserOutlined className="text-gray-400" />} 
                  placeholder="Enter your username"
                  className="rounded-lg h-12 hover:border-blue-400 focus:border-blue-400"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-gray-700 font-medium text-sm">Password</span>}
                name="password"
                className="mb-2"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Enter your password"
                  className="rounded-lg h-12 hover:border-blue-400 focus:border-blue-400"
                />
              </Form.Item>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-6">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-gray-600 text-sm">
                    Remember me
                  </Checkbox>
                </Form.Item>
                
                <a 
                  href="#forgot" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium no-underline hover:underline whitespace-nowrap"
                  onClick={(e) => {
                    e.preventDefault();
                    message.info('Forgot password feature coming soon!');
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              <Form.Item className="mb-4">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="w-full h-12 rounded-lg text-base font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <div className="text-center pt-4 border-t border-gray-200">
              <Text className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <a 
                  href="#signup" 
                  className="text-blue-600 hover:text-blue-800 font-semibold no-underline hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    message.info('Sign up feature coming soon!');
                  }}
                >
                  Create account
                </a>
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default LoginPage;
// src/components/SideNav.jsx
import React from 'react';
import { Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeOutlined,
  MessageOutlined,
  UserOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  ProjectOutlined,
  ContactsOutlined,
  FileDoneOutlined,
  DoubleLeftOutlined,
  CarOutlined,
  ScheduleOutlined
} from '@ant-design/icons';

const SideNav = ({ collapsed, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: '/companies',
      icon: <MessageOutlined />,
      label: 'Companies',
    },
    {
      key: '/fleet-tasks',
      icon: <CheckSquareOutlined />,
      label: 'Fleet Tasks',
    },
    {
      key: '/vehicles',
      icon: <CarOutlined />,
      label: 'Vehicles',
    },
    {
      key: '/drivers',
      icon: <UserOutlined />,
      label: 'Drivers',
    },
    {
      key: '/tasks',
      icon: <ScheduleOutlined />,
      label: 'Tasks',
    },
    {
      key: '/todo',
      icon: <CheckSquareOutlined />,
      label: 'Todo List',
    },
    {
      key: '/notes',
      icon: <FileTextOutlined />,
      label: 'Notes',
    },
    {
      key: '/scrumboard',
      icon: <ProjectOutlined />,
      label: 'Scrumboard',
    },
    {
      key: '/contacts',
      icon: <ContactsOutlined />,
      label: 'Contacts',
    },
    {
      key: '/invoice',
      icon: <FileDoneOutlined />,
      label: 'Invoice',
    },
  ];

  const handleMenuClick = (key) => {
    navigate(key);
    onClose();
  };

  const handleOverlayClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <>
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleOverlayClick}
        />
      )}
      
      <div className={`
        fixed inset-y-0 left-0 z-50
        bg-white shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${collapsed ? '-translate-x-full' : 'translate-x-0 w-64'}
      `}>
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <img 
            src="/logo.jpg" 
            alt="ITOOOO Logo" 
            className="h-6 w-6 rounded-lg"
          />
          
          <div className="text-center flex-1">
            <div className="text-sm font-bold text-gray-800">ITOOOO</div>
            <div className="text-xs text-gray-500">react.writecabthemes.com</div>
          </div>
          
          {!collapsed && (
            <Button 
              type="text" 
              icon={<DoubleLeftOutlined />} 
              onClick={handleOverlayClick}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1"
              size="small"
            />
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-0"
          onClick={({ key }) => handleMenuClick(key)}
        />

        <div className="absolute bottom-2 left-0 right-0">
          <div className="text-xs text-gray-500 text-center">
            <div>14:47 | pub-dem-wpk</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideNav;
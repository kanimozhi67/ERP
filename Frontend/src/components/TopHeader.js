import React from 'react';
import { Dropdown, Avatar, Button } from 'antd';
import { MoonOutlined, UserOutlined, MailOutlined, LockOutlined, LogoutOutlined } from '@ant-design/icons';

const TopHeader = ({ onToggleSidebar }) => {
  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div className="px-2 py-1 flex items-center space-x-3">
          <Avatar 
            size="large" 
            src="/logo1.jpeg" 
            className="border-2 border-gray-200"
          />
          <div>
            <div className="font-semibold">
              <span className="font-bold">John Doe</span> <span className="text-green-500 ml-1">Pro</span>
            </div>
            <div className="text-gray-500 text-sm">johndoe@gmail.com</div>
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'inbox',
      icon: <MailOutlined />,
      label: 'Inbox',
    },
    {
      key: 'lock',
      icon: <LockOutlined />,
      label: 'Lock Screen',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
    },
  ];

  // Custom Hamburger Icon
  const HamburgerIcon = () => (
    <div className="w-6 h-6 flex flex-col justify-between cursor-pointer">
      <div className="w-full h-0.5 bg-white rounded"></div>
      <div className="w-full h-0.5 bg-white rounded"></div>
      <div className="w-full h-0.5 bg-white rounded"></div>
    </div>
  );

  return (
    <header className="bg-gradient-to-r from-blue-400 to-purple-500 px-6 py-3 flex justify-between items-center shadow-md">
      {/* Left side - Logo, Name, Hamburger */}
      <div className="flex items-center space-x-4 flex-1">
        <img 
          src="/logo.jpg" 
          alt="Logo" 
          className="h-8 w-auto"
        />
        <div className="text-white text-lg font-bold">
          ERP
        </div>
        <div 
          onClick={onToggleSidebar}
          className="cursor-pointer p-2 hover:bg-blue-300 rounded-lg transition-colors"
        >
          <HamburgerIcon />
        </div>
      </div>

      {/* Center - Sales By Category */}
      <div className="flex-1 flex justify-center">
        <div className="text-white text-lg font-semibold">
          Sales By Category
        </div>
      </div>

      {/* Right side - Moon Icon and Avatar */}
      <div className="flex items-center space-x-4 flex-1 justify-end">
        <Button 
          type="text" 
          icon={<MoonOutlined />} 
          className="text-white hover:bg-white hover:bg-opacity-20"
        />
        
        {/* Fixed Dropdown with proper closing behavior */}
        <Dropdown 
          menu={{ items: userMenuItems }} 
          placement="bottomRight"
          trigger={['click']}
        >
          <div 
            className="flex items-center cursor-pointer bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 transition-all"
            onClick={(e) => e.preventDefault()} // Prevent any default behavior
          >
            <Avatar 
              size="default" 
              src="/logo1.jpeg" 
              className="border-2 border-white"
            />
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default TopHeader;
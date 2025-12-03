// components/transport/JsVehicleDriverAssignment.js
import React from 'react';
import { Form, Select, Card, Alert } from 'antd';
import { TruckIcon, UserIcon } from '@heroicons/react/24/outline';

const { Option } = Select;

const JsVehicleDriverAssignment = ({ form, vehicles, drivers, loading }) => {
  const selectedVehicleId = Form.useWatch('vehicleId', form);
  const selectedDriverId = Form.useWatch('driverId', form);
  
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  console.log('🔍 VehicleDriverAssignment - Vehicles:', vehicles);
  console.log('🔍 VehicleDriverAssignment - Drivers:', drivers);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="text-center text-gray-500">Loading vehicles and drivers...</div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <Alert
          message="No Vehicles Available"
          description="Please add vehicles to the system before creating transport tasks."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1 sm:p-2 bg-green-50 rounded-lg">
          <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">VEHICLE & DRIVER ASSIGNMENT</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Vehicle ID - Store numeric ID */}
        <Form.Item
          name="vehicleId"
          label={<span className="text-sm font-medium text-gray-700">Vehicle *</span>}
          rules={[{ required: true, message: 'Please select vehicle' }]}
          className="mb-0"
        >
          <Select
            size="large"
            placeholder="Select Vehicle"
            className="w-full rounded-lg"
            suffixIcon={<TruckIcon className="w-4 h-4 text-gray-400" />}
            onChange={(value) => {
              console.log('🚗 Selected vehicle ID:', value, 'Type:', typeof value);
            }}
          >
            {vehicles.map(vehicle => (
              <Option key={vehicle.id} value={vehicle.id}> {/* Store numeric ID */}
                {vehicle.registrationNo} - {vehicle.vehicleType} ({vehicle.seats} seats) - ID: {vehicle.id}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Driver ID - Store numeric ID */}
        <Form.Item
          name="driverId"
          label={<span className="text-sm font-medium text-gray-700">Driver</span>}
          className="mb-0"
        >
          <Select
            size="large"
            placeholder="Select Driver"
            className="w-full rounded-lg"
            suffixIcon={<UserIcon className="w-4 h-4 text-gray-400" />}
            onChange={(value) => {
              console.log('👨‍💼 Selected driver ID:', value, 'Type:', typeof value);
            }}
          >
            {drivers.map(driver => (
              <Option key={driver.id} value={driver.id}> {/* Store numeric ID */}
                {driver.name} - {driver.licenseType} - ID: {driver.id}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      {/* Selected Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {selectedVehicle && (
          <Card size="small" className="bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <TruckIcon className="w-4 h-4 text-blue-600" />
              <div>
                <h4 className="font-semibold text-sm">{selectedVehicle.registrationNo}</h4>
                <p className="text-xs text-gray-600">{selectedVehicle.vehicleType} • {selectedVehicle.seats} seats</p>
                <p className="text-xs text-gray-500">ID: {selectedVehicle.id}</p>
              </div>
            </div>
          </Card>
        )}

        {selectedDriver && (
          <Card size="small" className="bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-green-600" />
              <div>
                <h4 className="font-semibold text-sm">{selectedDriver.name}</h4>
                <p className="text-xs text-gray-600">{selectedDriver.licenseType}</p>
                <p className="text-xs text-gray-500">ID: {selectedDriver.id}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JsVehicleDriverAssignment;
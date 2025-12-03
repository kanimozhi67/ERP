// components/transport/JsPickupDropLocations.js
import React from 'react';
import { Form, Input } from 'antd';
import { MapPinIcon, LocationMarkerIcon } from '@heroicons/react/24/outline';

const { TextArea } = Input;

const JsPickupDropLocations = ({ form }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1 sm:p-2 bg-orange-50 rounded-lg">
          <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">LOCATION DETAILS</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Pickup Address */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <LocationMarkerIcon className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-800">Pickup Location</span>
          </div>
          <Form.Item
            name="pickupAddress" // CHANGED from "pickupLocation"
            className="mb-0"
          >
            <TextArea
              rows={4}
              placeholder="Enter complete pickup address..."
              className="w-full resize-none border-gray-300"
              onChange={(e) => {
                console.log('📍 Pickup address:', e.target.value);
              }}
            />
          </Form.Item>
        </div>

        {/* Drop Address */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <LocationMarkerIcon className="w-4 h-4 text-red-600" />
            <span className="font-medium text-gray-800">Drop Location</span>
          </div>
          <Form.Item
            name="dropAddress" // CHANGED from "dropLocation"
            className="mb-0"
          >
            <TextArea
              rows={4}
              placeholder="Enter complete drop address..."
              className="w-full resize-none border-gray-300"
              onChange={(e) => {
                console.log('📍 Drop address:', e.target.value);
              }}
            />
          </Form.Item>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4 sm:mt-6">
        <Form.Item
          name="notes"
          label={<span className="text-sm font-medium text-gray-700">Additional Notes</span>}
          className="mb-0"
        >
          <TextArea
            rows={3}
            placeholder="Any additional instructions or notes..."
            className="w-full resize-none border-gray-300"
            onChange={(e) => {
              console.log('📝 Notes:', e.target.value);
            }}
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default JsPickupDropLocations;
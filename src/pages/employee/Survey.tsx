import React from 'react';
import { useParams } from 'react-router-dom';

const EmployeeSurvey: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Employee Survey
            </h1>
            <p className="text-gray-600 mb-4">
              Survey ID: {id}
            </p>
            {/* Survey form will be implemented based on requirements */}
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">
                Survey content will be populated here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSurvey;
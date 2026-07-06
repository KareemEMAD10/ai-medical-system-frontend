import React from 'react';
import { UserCircleIcon, EnvelopeIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const DoctorCard = ({ doctor, onClick }) => {
  return (
    <div
      onClick={() => onClick(doctor)}
      className="card cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
          <UserCircleIcon className="w-8 h-8 text-primary-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {doctor.username}
          </h3>
          {doctor.specialty && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <AcademicCapIcon className="w-4 h-4" />
              <span>{doctor.specialty}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <EnvelopeIcon className="w-4 h-4" />
            <span>{doctor.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;

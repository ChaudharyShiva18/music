// client/src/components/ProgressBar.js
import React from 'react';

function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-200 h-4 rounded overflow-hidden">
      <div
        className="bg-teal-500 h-4 transition-all duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default ProgressBar;

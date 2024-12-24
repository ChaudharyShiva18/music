// client/src/components/DownloadCard.js
import React from 'react';

function DownloadCard({
  link,
  setLink,
  status,
  loading,
  progress,
  messages,
  onDownload
}) {
  return (
    <div className="w-full max-w-md bg-white rounded-md shadow-md p-6">
      {/* Input Field */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          Paste Spotify or YouTube link:
        </label>
        <input
          type="text"
          className="
            w-full p-2 border border-gray-300 rounded 
            focus:outline-none focus:border-teal-500
            transition-colors duration-150
          "
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      {/* Button + Optional Spinner */}
      <div className="mb-4 flex items-center">
        <button
          onClick={onDownload}
          className="
            bg-teal-500 hover:bg-teal-600 text-white 
            font-semibold py-2 px-4 rounded 
            transition-colors duration-200
          "
        >
          Download
        </button>
        {loading && (
          <div className="ml-4 w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Status */}
      <p className="mb-2 text-gray-700">{status}</p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-4 rounded overflow-hidden transition-all">
        <div
          className="bg-teal-500 h-4 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {progress.toFixed(1)}% complete
      </p>

      {/* Logs Output */}
      <ul className="mt-4 bg-gray-50 p-2 rounded max-h-60 overflow-auto text-sm text-gray-700">
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export default DownloadCard;

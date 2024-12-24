// client/src/DownloadForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

import Header from './components/Header';
import Footer from './components/Footer';
import DownloadCard from './components/DownloadCard';

// Create a single socket connection here
const socket = io('http://localhost:5000');

function DownloadForm() {
  const [link, setLink] = useState('');
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for real-time progress
    socket.on('downloadProgress', (data) => {
      if (data.message) {
        handleProgressLine(data.message);
      } else if (data.error) {
        setMessages((prev) => [...prev, `stderr: ${data.error}`]);
      }
    });

    // Listen for completion
    socket.on('downloadComplete', (info) => {
      setLoading(false);
      if (info.status === 'completed') {
        setStatus('Download complete!');
        setProgress(100);
      } else {
        setStatus(`Download failed (code: ${info.code || 'unknown'})`);
      }
    });

    return () => {
      socket.off('downloadProgress');
      socket.off('downloadComplete');
    };
  }, []);

  const handleProgressLine = (line) => {
    setMessages((prev) => [...prev, `stdout: ${line}`]);
    // If it's a yt-dlp line with: DOWNLOAD:xx.x%|ETA:xx
    if (line.startsWith('DOWNLOAD:')) {
      const regex = /DOWNLOAD:([\d.]+)%\|ETA:(\S+)/;
      const match = line.match(regex);
      if (match) {
        const percent = parseFloat(match[1]);
        if (!isNaN(percent)) {
          setProgress(percent);
        }
      }
    }
  };

  // Called when user clicks "Download"
  const startDownload = async () => {
    try {
      setStatus('Starting download...');
      setMessages([]);
      setProgress(0);
      setLoading(true);

      const resp = await axios.post('http://localhost:5000/api/download', { link });
      if (resp.data.success) {
        setStatus(resp.data.message);
      } else {
        setStatus(resp.data.error || 'Error starting download.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setStatus('Error starting download.');
      setLoading(false);
    }
  };

  // Called when user clicks "Organize Music"
  const handleOrganize = async () => {
    try {
      setStatus('Organizing music...');
      const res = await axios.post('http://localhost:5000/api/organize');
      if (res.data.success) {
        setStatus(res.data.message);
      } else {
        setStatus(res.data.error || 'Organizing failed.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Error organizing music.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      {/* Mint Frost gradient is set in index.css body */}
      <Header />

      <DownloadCard
        link={link}
        setLink={setLink}
        status={status}
        loading={loading}
        progress={progress}
        messages={messages}
        onDownload={startDownload}
      />

      <div className="mt-6">
        <button
          onClick={handleOrganize}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors duration-200"
        >
          Organize Music
        </button>
      </div>

      <Footer />
    </div>
  );
}

export default DownloadForm;

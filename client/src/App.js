// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DownloadForm from './DownloadForm';

function App() {
  return (
    <Router>
      <Routes>
        {/* If you only have one page, the path can be "/" */}
        <Route path="/" element={<DownloadForm />} />
      </Routes>
    </Router>
  );
}

export default App;

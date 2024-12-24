// server/routes/organize.js
const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

// POST or GET, but typically POST if we’re triggering an action
router.post('/', (req, res) => {
  // Spawn the Python script
  const pythonProcess = spawn('python3', ['organize/organize.py'], {
    cwd: process.cwd(), // or the correct directory if needed
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  // Capture stdout
  pythonProcess.stdout.on('data', (data) => {
    console.log(`[organize stdout] ${data.toString().trim()}`);
    // You can log or buffer these messages
  });

  // Capture stderr
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[organize stderr] ${data.toString().trim()}`);
  });

  // On completion
  pythonProcess.on('close', (code) => {
    console.log(`Organize script exited with code: ${code}`);
    if (code === 0) {
      return res.json({ success: true, message: 'Music organized successfully!' });
    } else {
      return res.status(500).json({ success: false, error: 'Organize script failed', code });
    }
  });
});

module.exports = router;

// server/routes/progress.js
const express = require('express');
const router = express.Router();
const { progressMap } = require('../utils/progressStore');

// We'll keep an interval-based approach for SSE
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // For demonstration, let's assume the client sends ?jobId= in the query
  const jobId = req.query.jobId;
  if (!jobId) {
    res.write(`data: ${JSON.stringify({ error: 'No jobId provided' })}\n\n`);
    return;
  }

  const sendUpdate = () => {
    const progressData = progressMap[jobId] || { status: 'unknown' };
    // SSE format: "data: <json_string>\n\n"
    res.write(`data: ${JSON.stringify(progressData)}\n\n`);

    // If the job is completed or failed, we can stop updates
    if (progressData.status === 'completed' || progressData.status === 'failed') {
      clearInterval(intervalId);
      // Optionally close the connection so client knows it's done
      res.end();
    }
  };

  // Send updates every 1 second (you can choose any interval or push them in real-time)
  const intervalId = setInterval(sendUpdate, 1000);

  // If client closes connection
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

module.exports = router;

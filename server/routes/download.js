/**
 * server/routes/download.js
 *
 * This route spawns either spotdl (for Spotify links)
 * or yt-dlp (for YouTube links), then emits real-time
 * logs via Socket.IO for progress updates.
 */

const express = require('express');
const { spawn } = require('child_process');

let io = null; // We'll inject the Socket.IO instance

function initSocketIO(ioInstance) {
  io = ioInstance;
}

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ error: 'No link provided' });
    }

    // Decide which command + args to use
    let command;
    let args = [];
    
    // If it’s a Spotify link, use spotdl
    if (link.includes('spotify')) {
      command = 'spotdl';
      args = [
        link,
        '--output',
        '/music' // Adjust to your preferred download folder
      ];

      // NOTE: spotdl doesn't actually rip from Spotify’s DRM streams.
      // It uses Spotify metadata + locates audio on YouTube or other sources.

    // If it’s a YouTube (or YouTube Music) link, use yt-dlp
    } else if (
      link.includes('youtube.com') ||
      link.includes('youtu.be') ||
      link.includes('music.youtube.com')
    ) {
      command = 'yt-dlp';
args = [
  '-f', 'bestaudio',
  '-x', '--audio-format', 'mp3',
  '--embed-metadata', // Embed metadata into the audio file
  '--embed-thumbnail', // Embed the video thumbnail as album art
  '--add-metadata', // Add metadata like title, artist, album, etc.
  '--postprocessor-args', '-id3v2_version 3', // Ensure metadata compatibility with players
  '-o', '/music/%(title)s.%(ext)s', // Output template
  // For easier progress parsing:
  '--progress-template', 
  'DOWNLOAD:%(progress._percent_str)s|ETA:%(progress._eta_str)s',
  '--newline',
  link
];


    } else {
      // If it's not recognized, send error
      return res.status(400).json({ error: 'Unsupported link type' });
    }

    // Spawn process with unbuffered env for real-time logs
    const downloader = spawn(command, args, {
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1' // Force Python to flush logs line-by-line
      }
    });

    // Capture stdout
    downloader.stdout.on('data', (data) => {
      const line = data.toString().trim();
      console.log(`[stdout] ${line}`);

      // Emit to all connected clients (or use rooms for user-specific)
      if (io) {
        io.emit('downloadProgress', { message: line });
      }
    });

    // Capture stderr
    downloader.stderr.on('data', (data) => {
      const errLine = data.toString().trim();
      console.error(`[stderr] ${errLine}`);

      if (io) {
        io.emit('downloadProgress', { error: errLine });
      }
    });

    // On completion
    downloader.on('close', (code) => {
      console.log(`${command} exited with code: ${code}`);
      if (io) {
        if (code === 0) {
          io.emit('downloadComplete', { status: 'completed' });
        } else {
          io.emit('downloadComplete', { status: 'failed', code });
        }
      }
    });

    // Respond to the client that download started
    return res.json({ success: true, message: `Download started with ${command}!` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error occurred' });
  }
});

module.exports = {
  router,
  initSocketIO
};

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

app.use(cors());
app.use(express.json());

// MCP endpoint configuration
let mcpConfig = {
  "version": "1.0",
  "capabilities": ["file_read", "websocket"],
  "files": []
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial connection message
  socket.emit('connected', 'Connected to MCP WebSocket stream');

  // Setup heartbeat interval (every 30 seconds)
  const heartbeat = setInterval(() => {
    socket.emit('heartbeat', new Date().toISOString());
  }, 30000);

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(heartbeat);
  });

  // Error handling
  socket.on('error', (err) => {
    console.error('WebSocket Error:', err);
    clearInterval(heartbeat);
  });
});

// Initialize files list from data directory
async function initializeFilesList() {
  try {
    const dataDir = path.join(__dirname, 'data');
    const files = await fs.readdir(dataDir);
    mcpConfig.files = files.filter(file => file.endsWith('.rtf'));
  } catch (error) {
    console.error('Error reading data directory:', error);
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json(mcpConfig);
});

// MCP configuration endpoint
// MCP configuration endpoint
app.get('/mcp-config', (req, res) => {
  res.json(mcpConfig);
});

// MCP handshake endpoint
app.post('/mcp/handshake', (req, res) => {
  res.json({
    status: "ok",
    version: mcpConfig.version,
    capabilities: mcpConfig.capabilities
  });
});

// MCP status endpoint
app.get('/mcp/status', (req, res) => {
  res.json({
    status: "ok",
    files: mcpConfig.files
  });
});

// Get content of a specific RTF file
app.get('/file/:filename', async (req, res) => {
  const filename = req.params.filename;
  if (!mcpConfig.files.includes(filename)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const filePath = path.join(__dirname, 'data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    res.json({ filename, content: data });
  } catch (error) {
    res.status(500).json({ error: 'Error reading file' });
  }
});

// Initialize files list and start server
initializeFilesList().then(() => {
  console.log('Files list initialized');
});

// Export for Vercel
module.exports = httpServer;

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

const app = express();
const port = 3000;

// Enable CORS with specific options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MCP endpoint configuration
let mcpConfig = {
  "version": "1.0",
  "capabilities": ["file_read", "sse"],
  "files": []
};

// Create event emitter for SSE
const eventEmitter = new EventEmitter();

// SSE endpoint
app.get('/events', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write('event: connected\ndata: Connected to MCP SSE stream\n\n');

  // Setup heartbeat interval (every 30 seconds)
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${new Date().toISOString()}\n\n`);
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
  });

  // Error handling
  req.on('error', (err) => {
    console.error('SSE Error:', err);
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

// Initialize files list before starting server
initializeFilesList().then(() => {
  app.listen(port, () => {
    console.log(`MCP Server running at http://localhost:${port}`);
  });
});

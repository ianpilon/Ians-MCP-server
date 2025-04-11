const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

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
  "capabilities": ["file_read"],
  "files": []
};

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

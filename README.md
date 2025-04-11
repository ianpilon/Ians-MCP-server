# RTF Files MCP Server

A simple MCP (Model Context Protocol) server that serves RTF files.

## Structure
- `/data` - Contains all RTF files
- `server.js` - Main server implementation
- `package.json` - Project dependencies

## Setup
1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

## Usage with Windsurf
Add the following configuration to Windsurf:
```json
{
  "mcpServers": {
    "RTF Files": {
      "serverUrl": "YOUR_VERCEL_URL"  # After deploying to Vercel
    }
  }
}
```

## Deployment
1. Push to GitHub
2. Connect to Vercel
3. Deploy
4. Update Windsurf configuration with your Vercel URL

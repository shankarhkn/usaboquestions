# BioReader Global Leaderboard API

This API server provides global leaderboards for the BioReader Question of the Day feature, allowing users to see rankings across all devices.

## Features

- **Global Leaderboards**: Weekly and monthly leaderboards shared across all users
- **Real-time Updates**: Leaderboards update immediately when users answer questions
- **Fallback Support**: Falls back to local storage if API is unavailable
- **RESTful API**: Simple HTTP endpoints for leaderboard management

## Quick Start

### Option 1: Using the startup script (Recommended)
```bash
cd docs/leaderboard-api
./start-server.sh
```

### Option 2: Manual setup
```bash
cd docs/leaderboard-api
npm install
npm start
```

## API Endpoints

### Get Leaderboards
```
GET /api/leaderboards
```
Returns current weekly and monthly leaderboards.

### Update Leaderboard
```
POST /api/leaderboard/update
Content-Type: application/json

{
  "username": "PlayerName",
  "points": 50,
  "type": "weekly" // or "monthly"
}
```

### Health Check
```
GET /api/health
```
Returns server status.

## Configuration

The API server runs on port 3001 by default. To change this, modify the `PORT` variable in `server.js`.

## Data Storage

Leaderboard data is stored in `leaderboard-data.json` in the same directory. This file is automatically created when the server starts.

## Frontend Integration

The frontend automatically detects if the API is available and falls back to local storage if not. No additional configuration is needed in the browser.

## Troubleshooting

1. **Port already in use**: Change the PORT in server.js
2. **API not responding**: Check that the server is running and accessible
3. **CORS issues**: The server includes CORS headers for cross-origin requests

## Development

For development with auto-restart:
```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

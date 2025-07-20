const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

// Configuration
const PORT = process.env.PORT || 3000;
const WS_URL = 'ws://160.191.243.121:6789/ws/789?id=mrtinhios&key=vantinh592007pq';
const HISTORY_MAX_LENGTH = 200;
const RECONNECT_DELAY = 5000; // 5 seconds
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// Global variables
let history = [];
let currentSession = null;
let nextSession = null; // Added to track next session
let wsClient = null;
let lastActivity = Date.now();
let isShuttingDown = false;

// Pattern predictions (keep all existing pattern predictions)
const patternPredictions = {
{
  "TTT": { "prediction": "Tài", "confidence": 78 },
  "TTX": { "prediction": "Xỉu", "confidence": 89 },
  "TXT": { "prediction": "Tài", "confidence": 65 },
  "TXX": { "prediction": "Xỉu", "confidence": 92 },
  "XTT": { "prediction": "Tài", "confidence": 71 },
  "XTX": { "prediction": "Xỉu", "confidence": 83 },
  "XXT": { "prediction": "Tài", "confidence": 67 },
  "XXX": { "prediction": "Xỉu", "confidence": 96 },

  // Các cầu 4 ký tự
  "TTTT": { "prediction": "Tài", "confidence": 82 },
  "TTTX": { "prediction": "Xỉu", "confidence": 73 },
  "TTXT": { "prediction": "Tài", "confidence": 68 },
  "TTXX": { "prediction": "Xỉu", "confidence": 91 },
  "TXTT": { "prediction": "Tài", "confidence": 77 },
  "TXTX": { "prediction": "Xỉu", "confidence": 84 },
  "TXXT": { "prediction": "Tài", "confidence": 59 },
  "TXXX": { "prediction": "Xỉu", "confidence": 94 },
  "XTTT": { "prediction": "Tài", "confidence": 75 },
  "XTTX": { "prediction": "Xỉu", "confidence": 81 },
  "XTXT": { "prediction": "Tài", "confidence": 66 },
  "XTXX": { "prediction": "Xỉu", "confidence": 88 },
  "XXTT": { "prediction": "Tài", "confidence": 70 },
  "XXTX": { "prediction": "Xỉu", "confidence": 85 },
  "XXXT": { "prediction": "Tài", "confidence": 63 },
  "XXXX": { "prediction": "Xỉu", "confidence": 97 },

  // Các cầu 5 ký tự
  "TTTTT": { "prediction": "Tài", "confidence": 80 },
  "TTTTX": { "prediction": "Xỉu", "confidence": 72 },
  "TTTXT": { "prediction": "Tài", "confidence": 69 },
  "TTTXX": { "prediction": "Xỉu", "confidence": 90 },
  "TTXTT": { "prediction": "Tài", "confidence": 76 },
  "TTXTX": { "prediction": "Xỉu", "confidence": 83 },
  "TTXXT": { "prediction": "Tài", "confidence": 64 },
  "TTXXX": { "prediction": "Xỉu", "confidence": 93 },
  "TXTTT": { "prediction": "Tài", "confidence": 74 },
  "TXTTX": { "prediction": "Xỉu", "confidence": 79 },
  "TXTXT": { "prediction": "Tài", "confidence": 62 },
  "TXTXX": { "prediction": "Xỉu", "confidence": 87 },
  "TXXTT": { "prediction": "Tài", "confidence": 71 },
  "TXXTX": { "prediction": "Xỉu", "confidence": 82 },
  "TXXXT": { "prediction": "Tài", "confidence": 60 },
  "TXXXX": { "prediction": "Xỉu", "confidence": 95 },
  "XTTTT": { "prediction": "Tài", "confidence": 73 },
  "XTTTX": { "prediction": "Xỉu", "confidence": 78 },
  "XTTXT": { "prediction": "Tài", "confidence": 67 },
  "XTTXX": { "prediction": "Xỉu", "confidence": 86 },
  "XTXTT": { "prediction": "Tài", "confidence": 61 },
  "XTXTX": { "prediction": "Xỉu", "confidence": 80 },
  "XTXXT": { "prediction": "Tài", "confidence": 58 },
  "XTXXX": { "prediction": "Xỉu", "confidence": 96 },
  "XXTTT": { "prediction": "Tài", "confidence": 70 },
  "XXTTX": { "prediction": "Xỉu", "confidence": 81 },
  "XXTXT": { "prediction": "Tài", "confidence": 65 },
  "XXTXX": { "prediction": "Xỉu", "confidence": 84 },
  "XXXTT": { "prediction": "Tài", "confidence": 57 },
  "XXXTX": { "prediction": "Xỉu", "confidence": 89 },
  "XXXXT": { "prediction": "Tài", "confidence": 55 },
  "XXXXX": { "prediction": "Xỉu", "confidence": 99 },

  // Các cầu 6 ký tự
  "TTTTTT": { "prediction": "Tài", "confidence": 83 },
  "TTTTTX": { "prediction": "Xỉu", "confidence": 71 },
  "TTTTXT": { "prediction": "Tài", "confidence": 68 },
  "TTTTXX": { "prediction": "Xỉu", "confidence": 92 },
  "TTTXTT": { "prediction": "Tài", "confidence": 75 },
  "TTTXTX": { "prediction": "Xỉu", "confidence": 79 },
  "TTTXXT": { "prediction": "Tài", "confidence": 63 },
  "TTTXXX": { "prediction": "Xỉu", "confidence": 94 },
  "TTXTTT": { "prediction": "Tài", "confidence": 72 },
  "TTXTTX": { "prediction": "Xỉu", "confidence": 77 },
  "TTXTXT": { "prediction": "Tài", "confidence": 66 },
  "TTXTXX": { "prediction": "Xỉu", "confidence": 85 },
  "TTXXTT": { "prediction": "Tài", "confidence": 69 },
  "TTXXTX": { "prediction": "Xỉu", "confidence": 83 },
  "TTXXXT": { "prediction": "Tài", "confidence": 59 },
  "TTXXXX": { "prediction": "Xỉu", "confidence": 97 },
  "TXTTTT": { "prediction": "Tài", "confidence": 74 },
  "TXTTTX": { "prediction": "Xỉu", "confidence": 76 },
  "TXTTXT": { "prediction": "Tài", "confidence": 64 },
  "TXTTXX": { "prediction": "Xỉu", "confidence": 88 },
  "TXTXTT": { "prediction": "Tài", "confidence": 60 },
  "TXTXTX": { "prediction": "Xỉu", "confidence": 82 },
  "TXTXXT": { "prediction": "Tài", "confidence": 56 },
  "TXTXXX": { "prediction": "Xỉu", "confidence": 93 },
  "TXXTTT": { "prediction": "Tài", "confidence": 70 },
  "TXXTTX": { "prediction": "Xỉu", "confidence": 80 },
  "TXXTXT": { "prediction": "Tài", "confidence": 62 },
  "TXXTXX": { "prediction": "Xỉu", "confidence": 87 },
  "TXXXTT": { "prediction": "Tài", "confidence": 54 },
  "TXXXTX": { "prediction": "Xỉu", "confidence": 90 },
  "TXXXXT": { "prediction": "Tài", "confidence": 51 },
  "TXXXXX": { "prediction": "Xỉu", "confidence": 98 },
  "XTTTTT": { "prediction": "Tài", "confidence": 73 },
  "XTTTTX": { "prediction": "Xỉu", "confidence": 78 },
  "XTTTXT": { "prediction": "Tài", "confidence": 65 },
  "XTTTXX": { "prediction": "Xỉu", "confidence": 86 },
  "XTTXTT": { "prediction": "Tài", "confidence": 61 },
  "XTTXTX": { "prediction": "Xỉu", "confidence": 81 },
  "XTTXXT": { "prediction": "Tài", "confidence": 57 },
  "XTTXXX": { "prediction": "Xỉu", "confidence": 95 },
  "XTXTTT": { "prediction": "Tài", "confidence": 67 },
  "XTXTTX": { "prediction": "Xỉu", "confidence": 84 },
  "XTXTXT": { "prediction": "Tài", "confidence": 58 },
  "XTXTXX": { "prediction": "Xỉu", "confidence": 89 },
  "XTXXTT": { "prediction": "Tài", "confidence": 53 },
  "XTXXTX": { "prediction": "Xỉu", "confidence": 91 },
  "XTXXXT": { "prediction": "Tài", "confidence": 50 },
  "XTXXXX": { "prediction": "Xỉu", "confidence": 99 },
  "XXTTTT": { "prediction": "Tài", "confidence": 72 },
  "XXTTTX": { "prediction": "Xỉu", "confidence": 79 },
  "XXTTXT": { "prediction": "Tài", "confidence": 63 },
  "XXTTXX": { "prediction": "Xỉu", "confidence": 85 },
  "XXTXTT": { "prediction": "Tài", "confidence": 59 },
  "XXTXTX": { "prediction": "Xỉu", "confidence": 83 },
  "XXTXXT": { "prediction": "Tài", "confidence": 55 },
  "XXTXXX": { "prediction": "Xỉu", "confidence": 94 },
  "XXXTTT": { "prediction": "Tài", "confidence": 52 },
  "XXXTTX": { "prediction": "Xỉu", "confidence": 92 },
  "XXXTXT": { "prediction": "Tài", "confidence": 49 },
  "XXXTXX": { "prediction": "Xỉu", "confidence": 96 },
  "XXXXTT": { "prediction": "Tài", "confidence": 48 },
  "XXXXTX": { "prediction": "Xỉu", "confidence": 97 },
  "XXXXXT": { "prediction": "Tài", "confidence": 45 },
  "XXXXXX": { "prediction": "Xỉu", "confidence": 100 }
};

// Health monitoring
function startHealthMonitor() {
  setInterval(() => {
    const now = Date.now();
    const inactiveDuration = now - lastActivity;
    
    if (inactiveDuration > HEALTH_CHECK_INTERVAL * 2) {
      console.log(`[Health] No activity for ${Math.floor(inactiveDuration/1000)}s - Reconnecting...`);
      connectWebSocket();
    }
    
    const memoryUsage = process.memoryUsage();
    console.log(`[Health] Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB used, ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB total`);
    
    if (history.length > HISTORY_MAX_LENGTH * 1.2) {
      console.log(`[Health] Trimming history from ${history.length} to ${HISTORY_MAX_LENGTH}`);
      history = history.slice(-HISTORY_MAX_LENGTH);
    }
  }, HEALTH_CHECK_INTERVAL);
}

// WebSocket connection
function connectWebSocket() {
  if (isShuttingDown) return;
  
  console.log('[WebSocket] Connecting to server...');
  
  if (wsClient) {
    try {
      wsClient.removeAllListeners();
      if (wsClient.readyState === WebSocket.OPEN) {
        wsClient.close();
      }
    } catch (e) {
      console.error('[WebSocket] Error cleaning up previous connection:', e);
    }
  }

  wsClient = new WebSocket(WS_URL, {
    handshakeTimeout: 10000,
    maxPayload: 1048576,
  });
  
  wsClient.on('open', () => {
    console.log('[WebSocket] ✅ Connection established');
    lastActivity = Date.now();
    
    setInterval(() => {
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        try {
          wsClient.ping();
        } catch (e) {
          console.error('[WebSocket] Ping error:', e);
        }
      }
    }, 45000);
  });
  
  wsClient.on('message', (data) => {
    try {
      lastActivity = Date.now();
      const result = JSON.parse(data.toString());
      
      if (result.Phien && result.Xuc_xac_1 !== undefined) {
        console.log(`[WebSocket] Received result - Session ${result.Phien}: ${result.Ket_qua}`);
        
        const historyEntry = {
          phien: result.Phien,
          result: result.Ket_qua,
          sum: result.Tong,
          xucxac: [result.Xuc_xac_1, result.Xuc_xac_2, result.Xuc_xac_3],
          timestamp: Date.now()
        };
        
        if (!history.some(h => h.phien === result.Phien)) {
          // When we get a new result, current becomes previous, and we calculate next
          if (currentSession) {
            nextSession = {
              phien: parseInt(currentSession.phien) + 1,
              predicted: true
            };
          }
          
          history.push(historyEntry);
          if (history.length > HISTORY_MAX_LENGTH) {
            history = history.slice(-HISTORY_MAX_LENGTH);
          }
          
          currentSession = historyEntry;
        }
      }
    } catch (error) {
      console.error('[WebSocket] Message processing error:', error);
    }
  });
  
  wsClient.on('close', (code, reason) => {
    console.log(`[WebSocket] ❌ Connection closed (Code: ${code}, Reason: ${reason || 'none'})`);
    if (!isShuttingDown) {
      console.log(`[WebSocket] Reconnecting in ${RECONNECT_DELAY/1000} seconds...`);
      setTimeout(connectWebSocket, RECONNECT_DELAY);
    }
  });
  
  wsClient.on('error', (err) => {
    console.error('[WebSocket] Error:', err);
  });
  
  wsClient.on('ping', () => {
    lastActivity = Date.now();
  });
  
  wsClient.on('pong', () => {
    lastActivity = Date.now();
  });
}

// Prediction functions
function getPredictionOutput() {
  if (!currentSession) {
    return {
      phien_hien_tai: "...",
      phien_tiep_theo: "...",
      du_doan: "...",
      do_tin_cay: "..."
    };
  }

  let prediction = { prediction: "...", confidence: "..." };
  if (history.length >= 3) {
    const lastThree = history.slice(-3).map(h => h.result === "Tài" ? "T" : "X").join("");
    prediction = patternPredictions[lastThree] || {
      prediction: history[history.length-1].result === "Tài" ? "Xỉu" : "Tài",
      confidence: 50
    };
  }

  return {
    phien_hien_tai: currentSession.phien,
    phien_tiep_theo: nextSession ? nextSession.phien : parseInt(currentSession.phien) + 1,
    du_doan: prediction.prediction,
    do_tin_cay: prediction.confidence
  };
}

function getCompleteData() {
  if (!currentSession) {
    return {
      phien: "...",
      xuc_xac: [0, 0, 0],
      ket_qua: "...",
      tong: 0,
      pattern: "",
      algorithm: ""
    };
  }

  const patternHistory = history.map(h => h.result === "Tài" ? "T" : "X").join("");
  
  return {
    phien: currentSession.phien,
    xuc_xac: currentSession.xucxac,
    ket_qua: currentSession.result,
    tong: currentSession.sum,
    pattern: patternHistory,
    algorithm: patternHistory.slice(-6)
  };
}

// Initialize server
const app = express();
app.use(cors());

app.use((req, res, next) => {
  if (isShuttingDown) {
    res.status(503).json({ error: 'Server is shutting down' });
  } else {
    next();
  }
});

// Main endpoint
app.get('/api/789club', (req, res) => {
  try {
    const prediction = getPredictionOutput();
    const data = getCompleteData();
    
    res.json({
      phien_hien_tai: prediction.phien_hien_tai,
      phien_tiep_theo: prediction.phien_tiep_theo,
      du_doan: prediction.du_doan,
      do_tin_cay: prediction.do_tin_cay,
      data: data,
      status: 'healthy',
      last_activity: new Date(lastActivity).toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('[API] Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const now = Date.now();
  const isHealthy = (now - lastActivity) < HEALTH_CHECK_INTERVAL * 2;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    last_activity: new Date(lastActivity).toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    history_length: history.length
  });
});

// Start server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  connectWebSocket();
  startHealthMonitor();
});

// Graceful shutdown
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('[Shutdown] Starting graceful shutdown...');
  
  if (wsClient) {
    try {
      wsClient.close();
    } catch (e) {
      console.error('[Shutdown] Error closing WebSocket:', e);
    }
  }
  
  server.close(() => {
    console.log('[Shutdown] HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('[Shutdown] Force shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

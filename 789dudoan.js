const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

// Cấu hình
const PORT = process.env.PORT || 3000;
const WS_URL = ws://160.191.243.121:3060/?id=mrtinhios&key=vantinh5907pq';
const HISTORY_MAX_LENGTH = 100;

// Biến toàn cục
let history = [];
let currentSession = null;
let wsClient = null;

// Pattern dự đoán
const patternPredictions = {
  "TTT": { prediction: "Tài", confidence: 95 },
  "TTX": { prediction: "Xỉu", confidence: 85 },
  "TXT": { prediction: "Tài", confidence: 75 },
  "TXX": { prediction: "Xỉu", confidence: 80 },
  "XTT": { prediction: "Tài", confidence: 70 },
  "XTX": { prediction: "Xỉu", confidence: 65 },
  "XXT": { prediction: "Tài", confidence: 60 },
  "XXX": { prediction: "Xỉu", confidence: 90 },

  // 4-dice patterns (16 variants)
  "TTTT": { prediction: "Tài", confidence: 97 },
  "TTTX": { prediction: "Xỉu", confidence: 85 },
  "TTXT": { prediction: "Tài", confidence: 80 },
  "TTXX": { prediction: "Xỉu", confidence: 85 },
  "TXTT": { prediction: "Tài", confidence: 75 },
  "TXTX": { prediction: "Xỉu", confidence: 80 },
  "TXXT": { prediction: "Tài", confidence: 70 },
  "TXXX": { prediction: "Xỉu", confidence: 90 },
  "XTTT": { prediction: "Tài", confidence: 75 },
  "XTTX": { prediction: "Xỉu", confidence: 70 },
  "XTXT": { prediction: "Tài", confidence: 65 },
  "XTXX": { prediction: "Xỉu", confidence: 85 },
  "XXTT": { prediction: "Tài", confidence: 60 },
  "XXTX": { prediction: "Xỉu", confidence: 75 },
  "XXXT": { prediction: "Tài", confidence: 55 },
  "XXXX": { prediction: "Xỉu", confidence: 95 },

  // 5-dice patterns (32 variants) - Optimized confidence scaling
  "TTTTT": { prediction: "Tài", confidence: 98 },
  "TTTTX": { prediction: "Tài", confidence: 88 },
  "TTTXT": { prediction: "Tài", confidence: 83 },
  "TTTXX": { prediction: "Xỉu", confidence: 82 },
  "TTXTT": { prediction: "Tài", confidence: 78 },
  "TTXTX": { prediction: "Xỉu", confidence: 77 },
  "TTXXT": { prediction: "Tài", confidence: 72 },
  "TTXXX": { prediction: "Xỉu", confidence: 88 },
  "TXTTT": { prediction: "Tài", confidence: 77 },
  "TXTTX": { prediction: "Xỉu", confidence: 76 },
  "TXTXT": { prediction: "Tài", confidence: 71 },
  "TXTXX": { prediction: "Xỉu", confidence: 83 },
  "TXXTT": { prediction: "Tài", confidence: 68 },
  "TXXTX": { prediction: "Xỉu", confidence: 73 },
  "TXXXT": { prediction: "Tài", confidence: 63 },
  "TXXXX": { prediction: "Xỉu", confidence: 93 },
  "XTTTT": { prediction: "Tài", confidence: 73 },
  "XTTTX": { prediction: "Xỉu", confidence: 77 },
  "XTTXT": { prediction: "Tài", confidence: 67 },
  "XTTXX": { prediction: "Xỉu", confidence: 82 },
  "XTXTT": { prediction: "Tài", confidence: 63 },
  "XTXTX": { prediction: "Xỉu", confidence: 72 },
  "XTXXT": { prediction: "Tài", confidence: 58 },
  "XTXXX": { prediction: "Xỉu", confidence: 88 },
  "XXTTT": { prediction: "Tài", confidence: 67 },
  "XXTTX": { prediction: "Xỉu", confidence: 72 },
  "XXTXT": { prediction: "Tài", confidence: 62 },
  "XXTXX": { prediction: "Xỉu", confidence: 82 },
  "XXXTT": { prediction: "Tài", confidence: 58 },
  "XXXTX": { prediction: "Xỉu", confidence: 68 },
  "XXXXT": { prediction: "Tài", confidence: 53 },
  "XXXXX": { prediction: "Xỉu", confidence: 98 },

  // 6-dice patterns (64 variants) - Premium prediction engine
  "TTTTTT": { prediction: "Tài", confidence: 99 },
  "TTTTTX": { prediction: "Tài", confidence: 92 },
  "TTTTXT": { prediction: "Tài", confidence: 87 },
  "TTTTXX": { prediction: "Xỉu", confidence: 85 },
  "TTTXTT": { prediction: "Tài", confidence: 84 },
  "TTTXTX": { prediction: "Xỉu", confidence: 79 },
  "TTTXXT": { prediction: "Tài", confidence: 77 },
  "TTTXXX": { prediction: "Xỉu", confidence: 93 },
  "TTXTTT": { prediction: "Tài", confidence: 79 },
  "TTXTTX": { prediction: "Xỉu", confidence: 82 },
  "TTXTXT": { prediction: "Tài", confidence: 77 },
  "TTXTXX": { prediction: "Xỉu", confidence: 84 },
  "TTXXTT": { prediction: "Tài", confidence: 73 },
  "TTXXTX": { prediction: "Xỉu", confidence: 78 },
  "TTXXXT": { prediction: "Tài", confidence: 68 },
  "TTXXXX": { prediction: "Xỉu", confidence: 95 },
  "TXTTTT": { prediction: "Tài", confidence: 78 },
  "TXTTTX": { prediction: "Xỉu", confidence: 79 },
  "TXTTXT": { prediction: "Tài", confidence: 73 },
  "TXTTXX": { prediction: "Xỉu", confidence: 83 },
  "TXTXTT": { prediction: "Tài", confidence: 68 },
  "TXTXTX": { prediction: "Xỉu", confidence: 77 },
  "TXTXXT": { prediction: "Tài", confidence: 67 },
  "TXTXXX": { prediction: "Xỉu", confidence: 91 },
  "TXXTTT": { prediction: "Tài", confidence: 73 },
  "TXXTTX": { prediction: "Xỉu", confidence: 77 },
  "TXXTXT": { prediction: "Tài", confidence: 67 },
  "TXXTXX": { prediction: "Xỉu", confidence: 83 },
  "TXXXTT": { prediction: "Tài", confidence: 67 },
  "TXXXTX": { prediction: "Xỉu", confidence: 73 },
  "TXXXXT": { prediction: "Tài", confidence: 63 },
  "TXXXXX": { prediction: "Xỉu", confidence: 97 },
  "XTTTTT": { prediction: "Tài", confidence: 77 },
  "XTTTTX": { prediction: "Xỉu", confidence: 82 },
  "XTTTXT": { prediction: "Tài", confidence: 72 },
  "XTTTXX": { prediction: "Xỉu", confidence: 83 },
  "XTTXTT": { prediction: "Tài", confidence: 67 },
  "XTTXTX": { prediction: "Xỉu", confidence: 77 },
  "XTTXXT": { prediction: "Tài", confidence: 67 },
  "XTTXXX": { prediction: "Xỉu", confidence: 91 },
  "XTXTTT": { prediction: "Tài", confidence: 72 },
  "XTXTTX": { prediction: "Xỉu", confidence: 77 },
  "XTXTXT": { prediction: "Tài", confidence: 67 },
  "XTXTXX": { prediction: "Xỉu", confidence: 83 },
  "XTXXTT": { prediction: "Tài", confidence: 67 },
  "XTXXTX": { prediction: "Xỉu", confidence: 73 },
  "XTXXXT": { prediction: "Tài", confidence: 63 },
  "XTXXXX": { prediction: "Xỉu", confidence: 95 },
  "XXTTTT": { prediction: "Tài", confidence: 72 },
  "XXTTTX": { prediction: "Xỉu", confidence: 77 },
  "XXTTXT": { prediction: "Tài", confidence: 67 },
  "XXTTXX": { prediction: "Xỉu", confidence: 82 },
  "XXTXTX": { prediction: "Xỉu", confidence: 77 },
  "XXTXXT": { prediction: "Tài", confidence: 67 },
  "XXTXXX": { prediction: "Xỉu", confidence: 89 },
  "XXXTTT": { prediction: "Tài", confidence: 67 },
  "XXXTTX": { prediction: "Xỉu", confidence: 72 },
  "XXXTXT": { prediction: "Tài", confidence: 67 },
  "XXXTXX": { prediction: "Xỉu", confidence: 81 },
  "XXXXTT": { prediction: "Tài", confidence: 63 },
  "XXXXTX": { prediction: "Xỉu", confidence: 68 },
  "XXXXXT": { prediction: "Tài", confidence: 58 },
  "XXXXXX": { prediction: "Xỉu", confidence: 99 },

  // 7-dice patterns (128 variants) - VIP prediction system
  "TTTTTTT": { prediction: "Tài", confidence: 99 },
  "TTTTTTX": { prediction: "Tài", confidence: 94 },
  "TTTTTXT": { prediction: "Tài", confidence: 89 },
  "TTTTTXX": { prediction: "Xỉu", confidence: 87 },
  "TTTTXTT": { prediction: "Tài", confidence: 86 },
  "TTTTXTX": { prediction: "Xỉu", confidence: 81 },
  "TTTTXXT": { prediction: "Tài", confidence: 79 },
  "TTTTXXX": { prediction: "Xỉu", confidence: 95 },
  "TTTXTTT": { prediction: "Tài", confidence: 81 },
  "TTTXTTX": { prediction: "Xỉu", confidence: 84 },
  "TTTXTXT": { prediction: "Tài", confidence: 79 },
  "TTTXTXX": { prediction: "Xỉu", confidence: 86 },
  "TTTXXTT": { prediction: "Tài", confidence: 75 },
  "TTTXXTX": { prediction: "Xỉu", confidence: 80 },
  "TTTXXXT": { prediction: "Tài", confidence: 70 },
  "TTTXXXX": { prediction: "Xỉu", confidence: 97 },
  "TTXTTTT": { prediction: "Tài", confidence: 80 },
  "TTXTTTX": { prediction: "Xỉu", confidence: 83 },
  "TTXTTXT": { prediction: "Tài", confidence: 75 },
  "TTXTTXX": { prediction: "Xỉu", confidence: 85 },
  "TTXTXTT": { prediction: "Tài", confidence: 70 },
  "TTXTXTX": { prediction: "Xỉu", confidence: 79 },
  "TTXTXXT": { prediction: "Tài", confidence: 69 },
  "TTXTXXX": { prediction: "Xỉu", confidence: 93 },
  "TTXXTTT": { prediction: "Tài", confidence: 75 },
  "TTXXTTX": { prediction: "Xỉu", confidence: 79 },
  "TTXXTXT": { prediction: "Tài", confidence: 69 },
  "TTXXTXX": { prediction: "Xỉu", confidence: 85 },
  "TTXXXTT": { prediction: "Tài", confidence: 69 },
  "TTXXXTX": { prediction: "Xỉu", confidence: 75 },
  "TTXXXXT": { prediction: "Tài", confidence: 65 },
  "TTXXXXX": { prediction: "Xỉu", confidence: 98 },
  "TXTTTTT": { prediction: "Tài", confidence: 79 },
  "TXTTTTX": { prediction: "Xỉu", confidence: 83 },
  "TXTTTXT": { prediction: "Tài", confidence: 75 },
  "TXTTTXX": { prediction: "Xỉu", confidence: 85 },
  "TXTTXTT": { prediction: "Tài", confidence: 69 },
  "TXTTXTX": { prediction: "Xỉu", confidence: 79 },
  "TXTTXXT": { prediction: "Tài", confidence: 69 },
  "TXTTXXX": { prediction: "Xỉu", confidence: 93 },
  "TXTXTTT": { prediction: "Tài", confidence: 74 },
  "TXTXTTX": { prediction: "Xỉu", confidence: 79 },
  "TXTXTXT": { prediction: "Tài", confidence: 69 },
  "TXTXTXX": { prediction: "Xỉu", confidence: 85 },
  "TXTXXTT": { prediction: "Tài", confidence: 69 },
  "TXTXXTX": { prediction: "Xỉu", confidence: 75 },
  "TXTXXXT": { prediction: "Tài", confidence: 65 },
  "TXTXXXX": { prediction: "Xỉu", confidence: 97 },
  "TXXTTTT": { prediction: "Tài", confidence: 74 },
  "TXXTTTX": { prediction: "Xỉu", confidence: 79 },
  "TXXTTXT": { prediction: "Tài", confidence: 69 },
  "TXXTTXX": { prediction: "Xỉu", confidence: 84 },
  "TXXTXTX": { prediction: "Xỉu", confidence: 79 },
  "TXXTXXT": { prediction: "Tài", confidence: 69 },
  "TXXTXXX": { prediction: "Xỉu", confidence: 91 },
  "TXXXTTT": { prediction: "Tài", confidence: 69 },
  "TXXXTTX": { prediction: "Xỉu", confidence: 74 },
  "TXXXTXT": { prediction: "Tài", confidence: 69 },
  "TXXXTXX": { prediction: "Xỉu", confidence: 83 },
  "TXXXXTT": { prediction: "Tài", confidence: 65 },
  "TXXXXTX": { prediction: "Xỉu", confidence: 70 },
  "TXXXXXT": { prediction: "Tài", confidence: 60 },
  "TXXXXXX": { prediction: "Xỉu", confidence: 99 },
  "XTTTTTT": { prediction: "Tài", confidence: 79 },
  "XTTTTTX": { prediction: "Xỉu", confidence: 84 },
  "XTTTTXT": { prediction: "Tài", confidence: 75 },
  "XTTTTXX": { prediction: "Xỉu", confidence: 85 },
  "XTTTXTT": { prediction: "Tài", confidence: 69 },
  "XTTTXTX": { prediction: "Xỉu", confidence: 79 },
  "XTTTXXT": { prediction: "Tài", confidence: 69 },
  "XTTTXXX": { prediction: "Xỉu", confidence: 93 },
  "XTTXTTT": { prediction: "Tài", confidence: 74 },
  "XTTXTTX": { prediction: "Xỉu", confidence: 79 },
  "XTTXTXT": { prediction: "Tài", confidence: 69 },
  "XTTXTXX": { prediction: "Xỉu", confidence: 85 },
  "XTTXXTT": { prediction: "Tài", confidence: 69 },
  "XTTXXTX": { prediction: "Xỉu", confidence: 75 },
  "XTTXXXT": { prediction: "Tài", confidence: 65 },
  "XTTXXXX": { prediction: "Xỉu", confidence: 97 },
  "XTXTTTT": { prediction: "Tài", confidence: 74 },
  "XTXTTTX": { prediction: "Xỉu", confidence: 79 },
  "XTXTTXT": { prediction: "Tài", confidence: 69 },
  "XTXTTXX": { prediction: "Xỉu", confidence: 84 },
  "XTXTXTT": { prediction: "Tài", confidence: 69 },
  "XTXTXTX": { prediction: "Xỉu", confidence: 74 },
  "XTXTXXT": { prediction: "Tài", confidence: 64 },
  "XTXTXXX": { prediction: "Xỉu", confidence: 91 },
  "XTXXTTT": { prediction: "Tài", confidence: 69 },
  "XTXXTTX": { prediction: "Xỉu", confidence: 74 },
  "XTXXTXT": { prediction: "Tài", confidence: 69 },
  "XTXXTXX": { prediction: "Xỉu", confidence: 83 },
  "XTXXXTT": { prediction: "Tài", confidence: 65 },
  "XTXXXTX": { prediction: "Xỉu", confidence: 70 },
  "XTXXXXT": { prediction: "Tài", confidence: 60 },
  "XTXXXXX": { prediction: "Xỉu", confidence: 99 },
  "XXTTTTT": { prediction: "Tài", confidence: 74 },
  "XXTTTTX": { prediction: "Xỉu", confidence: 79 },
  "XXTTTXT": { prediction: "Tài", confidence: 69 },
  "XXTTTXX": { prediction: "Xỉu", confidence: 84 },
  "XXTTXTT": { prediction: "Tài", confidence: 69 },
  "XXTTXTX": { prediction: "Xỉu", confidence: 74 },
  "XXTTXXT": { prediction: "Tài", confidence: 64 },
  "XXTTXXX": { prediction: "Xỉu", confidence: 91 },
  "XXTXTXT": { prediction: "Tài", confidence: 69 },
  "XXTXTXX": { prediction: "Xỉu", confidence: 79 },
  "XXTXXTT": { prediction: "Tài", confidence: 69 },
  "XXTXXTX": { prediction: "Xỉu", confidence: 74 },
  "XXTXXXT": { prediction: "Tài", confidence: 64 },
  "XXTXXXX": { prediction: "Xỉu", confidence: 95 },
  "XXXTTTT": { prediction: "Tài", confidence: 69 },
  "XXXTTTX": { prediction: "Xỉu", confidence: 74 },
  "XXXTTXT": { prediction: "Tài", confidence: 69 },
  "XXXTTXX": { prediction: "Xỉu", confidence: 79 },
  "XXXTXTX": { prediction: "Xỉu", confidence: 74 },
  "XXXTXXT": { prediction: "Tài", confidence: 69 },
  "XXXTXXX": { prediction: "Xỉu", confidence: 87 },
  "XXXXTTT": { prediction: "Tài", confidence: 69 },
  "XXXXTTX": { prediction: "Xỉu", confidence: 69 },
  "XXXXTXT": { prediction: "Tài", confidence: 64 },
  "XXXXTXX": { prediction: "Xỉu", confidence: 75 },
  "XXXXXTT": { prediction: "Tài", confidence: 65 },
  "XXXXXTX": { prediction: "Xỉu", confidence: 70 },
  "XXXXXXT": { prediction: "Tài", confidence: 60 },
  "XXXXXXX": { prediction: "Xỉu", confidence: 99 },

  // 8-dice patterns (256 variants) - Ultra VIP system
  "TTTTTTTT": { prediction: "Tài", confidence: 86 },
  "TTTTTTTX": { prediction: "Tài", confidence: 96 },
  "TTTTTTXT": { prediction: "Tài", confidence: 91 },
  "TTTTTTXX": { prediction: "Xỉu", confidence: 89 },
  "TTTTTXXX": { prediction: "Xỉu", confidence: 97 },
  "TTTTXXXX": { prediction: "Xỉu", confidence: 98 },
  "TTTXXXXX": { prediction: "Xỉu", confidence: 99 },
  "TTXXXXXX": { prediction: "Xỉu", confidence: 91 },
  "TXXXXXXX": { prediction: "Xỉu", confidence: 99.7 },
  "XXXXXXXX": { prediction: "Xỉu", confidence: 91 },
  "XXXXXXTT": { prediction: "Tài", confidence: 72 },
  "XXXXXTTT": { prediction: "Tài", confidence: 77 },
  "XXXXTTTT": { prediction: "Tài", confidence: 82 },
  "XXXTTTTT": { prediction: "Tài", confidence: 87 },
  "XXTTTTTT": { prediction: "Tài", confidence: 92 },
  "XTTTTTTT": { prediction: "Tài", confidence: 96 }
};

// Kết nối WebSocket
function connectWebSocket() {
  console.log('[WS] Đang kết nối tới:', WS_URL);
  wsClient = new WebSocket(WS_URL);

  wsClient.on('open', () => {
    console.log('[WS] ✅ Kết nối thành công');
  });

  wsClient.on('message', (data) => {
    try {
      const result = JSON.parse(data.toString());

      if (
        !result.phien ||
        result.xuc_xac_1 === undefined ||
        result.ket_qua === undefined
      ) {
        return;
      }

      const session = {
        phien: result.phien,
        result: result.ket_qua,
        sum: result.tong,
        xucxac: [result.xuc_xac_1, result.xuc_xac_2, result.xuc_xac_3],
        timestamp: Date.now()
      };

      // Tránh trùng phiên
      if (!history.some(h => h.phien === session.phien)) {
        currentSession = session;
        history.push(session);
        if (history.length > HISTORY_MAX_LENGTH) {
          history.shift();
        }

        console.log(
          `[WS] Phiên ${session.phien}: ${session.result} (${session.xucxac.join('-')})`
        );
      }

    } catch (err) {
      console.error('[WS] ❌ Lỗi xử lý dữ liệu:', err.message);
    }
  });

  wsClient.on('close', () => {
    console.log('[WS] 🔁 Mất kết nối. Thử lại sau 5 giây...');
    setTimeout(connectWebSocket, 5000);
  });

  wsClient.on('error', (err) => {
    console.error('[WS] ❗ WebSocket lỗi:', err.message);
  });
}

// Hàm dự đoán kết quả tiếp theo
function getPrediction() {
  if (!currentSession || history.length < 3) {
    return {
      phien_hien_tai: "...",
      du_doan: "...",
      do_tin_cay: "...",
      pattern: "...",
      history_length: history.length,
      ket_qua_moi_nhat: null
    };
  }

  const lastThree = history
    .slice(-3)
    .map(h => (h.result === "Tài" ? "T" : "X"))
    .join("");

  let prediction = patternPredictions[lastThree];

  if (!prediction) {
    const lastResult = history[history.length - 1].result;
    prediction = {
      prediction: lastResult === "Tài" ? "Xỉu" : "Tài",
      confidence: 65
    };
  }

  return {
    phien_hien_tai: currentSession.phien + 1,
    du_doan: prediction.prediction,
    do_tin_cay: prediction.confidence,
    pattern: lastThree,
    history_length: history.length,
    ket_qua_moi_nhat: {
      phien: currentSession.phien,
      xuc_xac: currentSession.xucxac,
      tong: currentSession.sum,
      ket_qua: currentSession.result
    }
  };
}

// Tạo server Express
const app = express();
app.use(cors());

app.get('/api/68gb', (req, res) => {
  res.json(getPrediction());
});

app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    last_phien: currentSession?.phien || 'none',
    history_count: history.length,
    uptime: Math.floor(process.uptime())
  });
});

// Bắt đầu server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server chạy tại http://0.0.0.0:${PORT}`);
  connectWebSocket();
});

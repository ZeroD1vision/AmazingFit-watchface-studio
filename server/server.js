const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { json } = require('stream/consumers');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const WATCHFACES_DIR = path.join(__dirname, 'watchfaces');
if (!fs.existsSync(WATCHFACES_DIR)) {
    fs.mkdirSync(WATCHFACES_DIR, { recursive: true });
}

// Пример watchface по умолчанию
const DEFAULT_WATCHFACE = `// AmazingFit Watchface Editor
// Ваш код здесь обновляется в реальном времени

// Функция инициализации
function onInit() {
  console.log('Watchface initialized');

  // Рисуем фон
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: 0,
    y: 0,
    w: 454,
    h: 454,
    color: 0x000000
  });

  // Рисуем круглые часы
  drawClock();

  // Запускаем обновление каждую секунду
  updateTime();
  setInterval(updateTime, 1000);
}

// Рисуем основу часов
function drawClock() {
  // Циферблат
  hmUI.createWidget(hmUI.widget.CIRCLE, {
    center_x: 227,
    center_y: 227,
    radius: 200,
    color: 0x333333,
    alpha: 100
  });

  // Метки часов
  for (let hour = 1; hour <= 12; hour++) {
    const angle = (hour - 3) * (Math.PI * 2) / 12;
    const x = 227 + Math.cos(angle) * 180;
    const y = 227 + Math.sin(angle) * 180;

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - 4,
      y: y - 4,
      w: 8,
      h: 8,
      color: 0xFFFFFF,
      radius: 4
    });
  }
}

// Обновляем время
function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Очищаем предыдущие стрелки
  clearHands();

  // Часовая стрелка
  drawHand(227, 227, 100, (hours % 12 + minutes / 60) * 30, 8, 0xFF0000);

  // Минутная стрелка
  drawHand(227, 227, 150, minutes * 6, 5, 0x00FF00);

  // Секундная стрелка
  drawHand(227, 227, 180, seconds * 6, 2, 0x0000FF);

  // Центральная точка
  hmUI.createWidget(hmUI.widget.CIRCLE, {
    center_x: 227,
    center_y: 227,
    radius: 6,
    color: 0xFFFFFF
  });
}

// Рисуем стрелку
function drawHand(cx, cy, length, angle, width, color) {
  const rad = angle * Math.PI / 180;
  const x = cx + Math.cos(rad) * length;
  const y = cy + Math.sin(rad) * length;

  hmUI.createWidget(hmUI.widget.LINE, {
    start_x: cx,
    start_y: cy,
    end_x: x,
    end_y: y,
    color: color,
    line_width: width
  });
}

// Очищаем стрелки
function clearHands() {
  // В реальных часах нужно удалять виджеты,
  // здесь для простоты перерисовываем весь циферблат
  drawClock();
}

// Запускаем при загрузке
onInit();`;

const defaultWatchfacePath = path.join(WATCHFACES_DIR, 'default.watchface.js');
if(!fs.existsSync(defaultWatchfacePath)) {
    fs.writeFileSync(defaultWatchfacePath, DEFAULT_WATCHFACE);
}

app.get('/api/watchfaces', (req, res) => {
    fs.readdir(WATCHFACES_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Cannot read watchfaces' });
        }
        res.json(files);
    });
});

app.get('/api/watchface/:name', (req, res) => {
    fs.readFile(path.join(WATCHFACES_DIR, req.params.name), 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'Watchface not found' });
        }
        res.json({ code: data });
    });
});

app.post('/api/watchface/:name', (req, res) => {
    fs.writeFile(path.join(WATCHFACES_DIR, req.params.name), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Cannot save wachface' });
        }
        res.json({ success: true });
    });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-watchface', (watchfaceName) => {
    socket.join(watchfaceName);
    console.log(`${socket.id} joined ${watchfaceName}`);
  });

  socket.on('code-change', ({ watchfaceName, code }) => {
    fs.writeFile(path.join(WATCHFACES_DIR, watchfaceName), code, (err) => {
      if (!err) {
        io.to(watchfaceName).emit('code-updated', code);
      }
    })
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected ', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
})

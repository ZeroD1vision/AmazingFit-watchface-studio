// AmazingFit Watchface Editor
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
onInit();
// 🎯 幸運大轉盤核心邏輯

// 預設選項列表
let options: string[] = ['壽司 🍣', '拉麵 🍜', '和牛燒肉 🥩', '珍珠奶茶 🧋', '義大利麵 🍝', '披薩 🍕', '芒果冰 🍧'];

// 質感漸層配色
const colors = [
  '#8B5CF6', // 羅蘭紫
  '#3B82F6', // 皇家藍
  '#10B981', // 翡翠綠
  '#F59E0B', // 琥珀黃
  '#EF4444', // 珊瑚紅
  '#EC4899', // 玫瑰粉
  '#06B6D4', // 天空藍
  '#84CC16', // 萊姆綠
  '#F43F5E', // 櫻桃紅
  '#14B8A6', // 薄荷綠
  '#F472B6', // 淺粉紅
  '#38BDF8'  // 晴空藍
];

// 取得 DOM 元素
const durationInput = document.getElementById('duration-input') as HTMLInputElement;
const newOptionInput = document.getElementById('new-option-input') as HTMLInputElement;
const addOptionBtn = document.getElementById('add-option-btn') as HTMLButtonElement;
const optionsListContainer = document.getElementById('options-list-container') as HTMLDivElement;
const clearAllBtn = document.getElementById('clear-all-btn') as HTMLButtonElement;
const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;
const wheelCanvas = document.getElementById('wheel-canvas') as HTMLCanvasElement;
const wheelPointer = document.getElementById('wheel-pointer') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLParagraphElement;

// 彈窗相關元素
const winnerModal = document.getElementById('winner-modal') as HTMLDivElement;
const winnerModalCard = document.getElementById('winner-modal-card') as HTMLDivElement;
const winnerName = document.getElementById('winner-name') as HTMLDivElement;
const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;
const optionCountSpan = document.getElementById('option-count') as HTMLSpanElement;

// 動態動畫變數
let isSpinning = false;
let currentAngle = 0; // 累計旋轉角度 (度)

// 緩和曲線函數 (Ease-In-Out Quintic)
// 提供極佳的物理旋轉感：由慢到快，再漸漸平滑減速至完全靜止
function easeInOutQuint(x: number): number {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

// 繪製轉盤
function drawWheel() {
  const ctx = wheelCanvas.getContext('2d');
  if (!ctx) return;

  const K = options.length;
  const cx = wheelCanvas.width / 2;
  const cy = wheelCanvas.height / 2;
  const radius = cx - 20; // 留白以防裁切

  // 清除畫布
  ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

  if (K === 0) {
    // 若無選項，畫一個灰色背景
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('請新增選項', cx, cy);
    return;
  }

  const arcAngle = (2 * Math.PI) / K;

  for (let i = 0; i < K; i++) {
    // 每個扇形的角度起點與終點 (以 12 點鐘方向為起點 -Math.PI / 2)
    const startAngle = i * arcAngle - Math.PI / 2;
    const endAngle = (i + 1) * arcAngle - Math.PI / 2;

    // 1. 繪製扇形區域
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // 2. 繪製扇形邊界白線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = K > 8 ? 2 : 4;
    ctx.stroke();

    // 3. 繪製文字
    ctx.save();
    ctx.translate(cx, cy);
    // 轉向該扇形的中央角度
    const midAngle = startAngle + arcAngle / 2;
    ctx.rotate(midAngle);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    // 根據選項數量動態調整字體大小與長度限制
    let fontSize = 26;
    if (K > 15) fontSize = 16;
    else if (K > 10) fontSize = 20;

    ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;

    // 限制文字字數，防長字溢出
    let text = options[i];
    if (text.length > 8 && K > 8) {
      text = text.substring(0, 6) + '...';
    }

    ctx.fillText(text, radius - 40, 0);
    ctx.restore();
  }

  // 4. 繪製中心圓框，讓轉盤更精緻立體
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 4;
  ctx.fill();
  ctx.stroke();
}

// 渲染 HTML 選項列表
function renderOptionsList() {
  optionsListContainer.innerHTML = '';
  optionCountSpan.textContent = options.length.toString();

  options.forEach((opt, idx) => {
    const color = colors[idx % colors.length];
    
    // 建立選項元素
    const li = document.createElement('div');
    li.className = 'flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 transition hover:border-slate-700/80';
    
    li.innerHTML = `
      <div class="flex items-center gap-3 overflow-hidden mr-2">
        <span class="w-4 h-4 rounded-full flex-shrink-0" style="background-color: ${color}"></span>
        <span class="text-sm font-medium text-slate-200 truncate">${opt}</span>
      </div>
      <button 
        type="button" 
        data-index="${idx}" 
        class="delete-opt-btn text-slate-500 hover:text-rose-400 p-1 transition-colors"
        title="刪除此選項"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
    optionsListContainer.appendChild(li);
  });

  // 綁定單個刪除按鈕事件
  const deleteButtons = optionsListContainer.querySelectorAll('.delete-opt-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (isSpinning) return;
      const target = e.currentTarget as HTMLButtonElement;
      const idx = parseInt(target.getAttribute('data-index') || '0');
      options.splice(idx, 1);
      renderOptionsList();
      drawWheel();
    });
  });
}

// 新增選項邏輯
function handleAddOption() {
  if (isSpinning) return;
  const value = newOptionInput.value.trim();
  if (!value) return;

  options.push(value);
  newOptionInput.value = '';
  renderOptionsList();
  drawWheel();
  newOptionInput.focus();
}

// 點擊開始旋轉邏輯
function startSpin() {
  if (isSpinning) return;
  const K = options.length;

  if (K < 2) {
    statusText.textContent = '⚠️ 請至少輸入兩個選項才能旋轉！';
    statusText.classList.remove('text-slate-400');
    statusText.classList.add('text-rose-400');
    return;
  }

  // 重設狀態訊息樣式
  statusText.classList.remove('text-rose-400');
  statusText.classList.add('text-slate-400');
  statusText.textContent = '✨ 命運旋轉中...';

  // 取得秒數
  let seconds = parseFloat(durationInput.value);
  if (isNaN(seconds) || seconds < 1) seconds = 5;
  if (seconds > 60) seconds = 60;
  durationInput.value = seconds.toString();

  isSpinning = true;

  // 禁用控制介面
  setControlsEnabled(false);

  // 隨機選擇得獎項目
  const winnerIndex = Math.floor(Math.random() * K);

  // 計算目標旋轉角度 (順時針旋轉)
  // 指針位在 12 點鐘方向 (-90 度)。
  // 第 i 個選項的中心初始角度是 (i + 0.5) * (360 / K) - 90
  // 要讓其正對指標，旋轉角度 theta 必須滿足：
  // theta ≡ - (winnerIndex + 0.5) * (360 / K) (mod 360)
  const targetOffset = -(winnerIndex + 0.5) * (360 / K);
  const currentNormalized = currentAngle % 360;
  const baseSpin = 360 * 8; // 預設多繞 8 圈，製造極速快感
  
  // 目標角度 = 目前累計角 - 目前餘角 + 多轉圈數 + 得獎點偏移量
  const targetAngle = currentAngle - currentNormalized + baseSpin + (((targetOffset % 360) + 360) % 360);

  // 動態動畫
  const startTime = performance.now();
  const startAngleVal = currentAngle;
  let lastSliceIndex = Math.floor((((360000 - currentAngle) % 360)) / (360 / K));
  let pointerTilt = 0;

  function animate(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / (seconds * 1000), 1);

    // 套用緩和曲線
    const ease = easeInOutQuint(progress);
    currentAngle = startAngleVal + (targetAngle - startAngleVal) * ease;

    // 旋轉轉盤
    wheelCanvas.style.transform = `rotate(${currentAngle}deg)`;

    // 計算指針碰撞動畫：每跨過一個區間，指針便會有一個輕微的物理彈回反應
    const activeSliceIndex = Math.floor((((360000 - currentAngle) % 360)) / (360 / K));
    if (activeSliceIndex !== lastSliceIndex) {
      pointerTilt = 22; // 指針順時針被撥動
      lastSliceIndex = activeSliceIndex;
    }
    
    // 指針彈簧彈回阻尼衰減
    pointerTilt *= 0.84;
    wheelPointer.style.transform = `rotate(${pointerTilt}deg)`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // 動畫結束
      isSpinning = false;
      setControlsEnabled(true);
      
      // 顯示結果
      const winner = options[winnerIndex];
      statusText.textContent = `🎉 命運的決定是：${winner}！`;
      
      // 開啟中獎彈窗
      showWinnerModal(winner);
    }
  }

  requestAnimationFrame(animate);
}

// 啟用/停用控制介面
function setControlsEnabled(enabled: boolean) {
  durationInput.disabled = !enabled;
  newOptionInput.disabled = !enabled;
  addOptionBtn.disabled = !enabled;
  clearAllBtn.disabled = !enabled;
  spinBtn.disabled = !enabled;
  
  if (enabled) {
    optionsListContainer.style.pointerEvents = 'auto';
    spinBtn.classList.remove('opacity-60', 'cursor-not-allowed');
  } else {
    optionsListContainer.style.pointerEvents = 'none';
    spinBtn.classList.add('opacity-60', 'cursor-not-allowed');
  }
}

// 顯示得獎彈窗
function showWinnerModal(name: string) {
  winnerName.textContent = name;
  winnerModal.classList.remove('hidden');
  
  // 微延遲以觸發 CSS Transition 動畫
  setTimeout(() => {
    winnerModal.classList.remove('opacity-0');
    winnerModalCard.classList.remove('scale-90');
  }, 20);
}

// 關閉得獎彈窗
function closeWinnerModal() {
  winnerModal.classList.add('opacity-0');
  winnerModalCard.classList.add('scale-90');
  
  // 等待 transition 完成後隱藏 DOM
  setTimeout(() => {
    winnerModal.classList.add('hidden');
  }, 300);
}

// 綁定事件監聽器
addOptionBtn.addEventListener('click', handleAddOption);
newOptionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAddOption();
});

clearAllBtn.addEventListener('click', () => {
  if (isSpinning) return;
  options = [];
  renderOptionsList();
  drawWheel();
});

spinBtn.addEventListener('click', startSpin);
closeModalBtn.addEventListener('click', closeWinnerModal);
winnerModal.addEventListener('click', (e) => {
  // 點擊彈窗外圍也可以關閉
  if (e.target === winnerModal) {
    closeWinnerModal();
  }
});

// 初始化頁面
renderOptionsList();
drawWheel();

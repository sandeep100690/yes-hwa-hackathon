const PRICE = 89.00;
const PRODUCT = { id: 'pupplay-1', name: 'PupPlay Auto Ball Launcher', price: PRICE };

let cart = [];
let qty = 1;
let timerInterval = null;
let throwInterval = null;

// DOM
const qtyInput = document.getElementById('qty');
const qtyDec = document.getElementById('qty-dec');
const qtyInc = document.getElementById('qty-inc');
const totalPriceEl = document.getElementById('total-price');
const addBtn = document.getElementById('add-to-cart');
const buyNowBtn = document.getElementById('buy-now');
const cartCountEl = document.getElementById('cart-count');
const cartLink = document.getElementById('cart-link');
const cartDrawer = document.getElementById('cart');
const cartOverlay = document.getElementById('cart-overlay');
const cartPanel = cartDrawer.querySelector('.cart-panel');
const cartClose = document.getElementById('cart-close');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalPriceEl = document.getElementById('cart-total-price');
const cartCheckout = document.getElementById('cart-checkout');

// Quantity
function updateTotalDisplay() {
  totalPriceEl.textContent = '$' + (PRICE * qty).toFixed(2);
}
qtyDec.addEventListener('click', () => { if (qty > 1) { qty--; qtyInput.value = qty; updateTotalDisplay(); } });
qtyInc.addEventListener('click', () => { if (qty < 99) { qty++; qtyInput.value = qty; updateTotalDisplay(); } });
qtyInput.addEventListener('change', () => {
  let v = parseInt(qtyInput.value, 10);
  if (!v || v < 1) v = 1;
  if (v > 99) v = 99;
  qty = v;
  qtyInput.value = qty;
  updateTotalDisplay();
});

// Cart
function saveCart() { try { localStorage.setItem('pupplay_cart', JSON.stringify(cart)); } catch (e) {} }
function renderCart() {
  cartCountEl.textContent = cart.reduce((s, i) => s + i.qty, 0);
  cartItemsEl.innerHTML = '';
  let total = 0;
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
  } else {
    cart.forEach((item, idx) => {
      total += item.price * item.qty;
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div class="item-img"><div class="preview-ball" style="width:100%;height:100%;position:relative;"></div></div>
        <div class="item-info">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-line">$${item.price.toFixed(2)} x ${item.qty}</div>
          <div class="item-remove" data-idx="${idx}">Remove</div>
        </div>
      `;
      cartItemsEl.appendChild(el);
    });
  }
  cartTotalPriceEl.textContent = '$' + total.toFixed(2);
  cartItemsEl.querySelectorAll('.item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      removeItem(idx);
    });
  });
}
function addToCart() {
  const existing = cart.find(i => i.id === PRODUCT.id);
  if (existing) existing.qty += qty;
  else cart.push({ ...PRODUCT, qty });
  saveCart();
  renderCart();
  openCart();
  addBtn.textContent = 'Added!';
  setTimeout(() => { addBtn.textContent = 'Add to Cart'; }, 1200);
}
function removeItem(idx) {
  cart.splice(idx, 1);
  saveCart();
  renderCart();
}
function openCart() { cartDrawer.setAttribute('aria-hidden', 'false'); cartOverlay.classList.add('open'); cartPanel.classList.add('open'); }
function closeCart() { cartDrawer.setAttribute('aria-hidden', 'true'); cartOverlay.classList.remove('open'); cartPanel.classList.remove('open'); }

addBtn.addEventListener('click', addToCart);
buyNowBtn.addEventListener('click', () => { addToCart(); setTimeout(() => { cartCheckout.click(); }, 150); });
cartLink.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
cartCheckout.addEventListener('click', () => {
  if (cart.length === 0) return;
  alert('Thank you for your order! Your PupPlay launcher will keep your dog happy while you are away.');
  cart = []; saveCart(); renderCart(); closeCart();
});

// Timer / ball simulation (hero screen)
const screenTimer = document.getElementById('screen-timer');
const screenStatus = document.querySelector('.screen-status');
const heroBall = document.getElementById('hero-ball');
const throwLine = document.getElementById('throw-line');
const timerStart = document.getElementById('timer-start');
const timerEnd = document.getElementById('timer-end');
const timerSet = document.getElementById('timer-set');

let state = 'idle'; // idle | throwing | returning | delay
let remaining = 0;
let throwDirection = 0;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}
function launchBall() {
  state = 'throwing';
  screenStatus.textContent = 'Throwing';
  screenTimer.textContent = formatTime(remaining);
  const angle = (Math.random() * 300) + 30;
  throwDirection = angle;
  throwLine.style.transform = `rotate(${angle}deg) scale(1.6)`;
  throwLine.style.opacity = '1';
  heroBall.style.transition = 'transform 0.6s ease';
  heroBall.style.transform = `translate(${Math.cos(angle * Math.PI / 180) * 90}px, ${Math.sin(angle * Math.PI / 180) * -90}px)`;
  setTimeout(() => {
    state = 'returning';
    screenStatus.textContent = 'Returning';
    heroBall.style.transform = 'translate(0,0)';
    throwLine.style.opacity = '0';
    setTimeout(() => {
      state = 'delay';
      screenStatus.textContent = 'Next throw in 10s';
      setTimeout(() => {
        if (state === 'delay') launchBall();
      }, 10000);
    }, 700);
  }, 700);
}
function tick() {
  if (remaining > 0) {
    remaining--;
    screenTimer.textContent = formatTime(remaining);
  }
  if (remaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    screenStatus.textContent = 'Play time ended';
    screenTimer.textContent = '00:00';
    clearInterval(throwInterval);
    throwInterval = null;
    heroBall.style.transform = 'translate(0,0)';
    throwLine.style.opacity = '0';
    state = 'idle';
  }
}
timerSet.addEventListener('click', () => {
  const s = timerStart.value;
  const e = timerEnd.value;
  if (!s || !e) { alert('Please set both start and end times.'); return; }
  const startMins = parseInt(s.slice(0,2),10)*60 + parseInt(s.slice(3,5),10);
  const endMins = parseInt(e.slice(0,2),10)*60 + parseInt(e.slice(3,5),10);
  if (endMins <= startMins) { alert('End time must be after start time.'); return; }
  clearInterval(timerInterval);
  clearInterval(throwInterval);
  remaining = endMins - startMins;
  screenStatus.textContent = 'Waiting for start';
  screenTimer.textContent = formatTime(remaining);
  // start countdown to launch
  const nowMins = new Date().getHours()*60 + new Date().getMinutes();
  const waitMs = (startMins - nowMins) * 60000;
  if (waitMs <= 0) {
    launchBall();
    throwInterval = setInterval(launchBall, 20000); // simulate ongoing cycle within window
  } else {
    setTimeout(() => { launchBall(); throwInterval = setInterval(launchBall, 20000); }, waitMs);
  }
  timerInterval = setInterval(tick, 1000);
});

// Preview ball subtle float
const previewBall = document.getElementById('preview-ball');
let dir = 1;
setInterval(() => {
  previewBall.style.transform = `translateY(${dir * 6}px)`;
  dir *= -1;
}, 900);

// Cart persistence on load
try { cart = JSON.parse(localStorage.getItem('pupplay_cart') || '[]'); } catch (e) { cart = []; }
renderCart();

// Escape html
function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => {
  navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  navLinks.style.flexDirection = 'column';
  navLinks.style.position = 'absolute';
  navLinks.style.top = '72px';
  navLinks.style.right = '0';
  navLinks.style.background = '#fff';
  navLinks.style.border = '1px solid var(--line)';
  navLinks.style.borderRadius = '0 0 12px 12px';
  navLinks.style.padding = '16px';
  navLinks.style.boxShadow = 'var(--shadow)';
  navLinks.style.gap = '16px';
  navLinks.style.width = '200px';
  navLinks.style.zIndex = '60';
});

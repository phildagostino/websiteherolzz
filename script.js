// ==============================
// GLOBAL HELPERS
// ==============================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function moneyEUR(n) {
  // // Formatiert Geld sauber als Euro (Deutsch)
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

// ==============================
// THEME (Dark/Light) mit localStorage
// ==============================
function applyTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") document.body.classList.add("light");
  else document.body.classList.remove("light");

  const btn = $("#themeToggle");
  if (btn) btn.querySelector(".icon").textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  applyTheme();
}

// ==============================
// MOBILE NAV
// ==============================
function setupMobileNav() {
  const burger = $("#burger");
  const mobileNav = $("#mobileNav");
  if (!burger || !mobileNav) return;

  burger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });
}

// ==============================
// CART (localStorage) - Fanshop
// ==============================
function getCart() {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
  catch { return []; }
}

function setCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = $("#cartBadge");
  if (!badge) return;

  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = String(count);
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(x => x.id === item.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  setCart(cart);
}

function cartTotal(cart) {
  return cart.reduce((sum, it) => sum + it.price * it.qty, 0);
}

function renderCart() {
  const itemsEl = $("#cartItems");
  const totalEl = $("#cartTotal");
  if (!itemsEl || !totalEl) return;

  const cart = getCart();
  itemsEl.innerHTML = "";

  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="card"><p class="muted">Warenkorb ist leer.</p></div>`;
    totalEl.textContent = moneyEUR(0);
    return;
  }

  cart.forEach(it => {
    const wrap = document.createElement("div");
    wrap.className = "cart-item";
    wrap.innerHTML = `
      <div class="cart-row">
        <strong>${it.name}</strong>
        <span class="muted">${moneyEUR(it.price)}</span>
      </div>
      <div class="cart-row">
        <div class="qty">
          <button type="button" data-dec="${it.id}">−</button>
          <span><strong>${it.qty}</strong></span>
          <button type="button" data-inc="${it.id}">+</button>
        </div>
        <button type="button" class="btn small" data-remove="${it.id}">Entfernen</button>
      </div>
    `;
    itemsEl.appendChild(wrap);
  });

  totalEl.textContent = moneyEUR(cartTotal(cart));

  // // Button-Events (Mengen ändern)
  itemsEl.addEventListener("click", (e) => {
    const incId = e.target.getAttribute("data-inc");
    const decId = e.target.getAttribute("data-dec");
    const remId = e.target.getAttribute("data-remove");

    let cartNow = getCart();

    if (incId) {
      cartNow = cartNow.map(x => x.id === incId ? { ...x, qty: x.qty + 1 } : x);
      setCart(cartNow);
      renderCart();
    }
    if (decId) {
      cartNow = cartNow.map(x => x.id === decId ? { ...x, qty: Math.max(1, x.qty - 1) } : x);
      setCart(cartNow);
      renderCart();
    }
    if (remId) {
      cartNow = cartNow.filter(x => x.id !== remId);
      setCart(cartNow);
      renderCart();
    }
  }, { once: true }); // // once, damit sich Listener nicht stapeln
}

function setupShop() {
  // // Add-to-cart Buttons
  $$(".addToCart").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price)
      };
      addToCart(item);

      // // kleines Feedback
      btn.textContent = "✓ Added";
      setTimeout(() => btn.textContent = "In den Warenkorb", 900);
    });
  });

  // // Drawer Open/Close
  const drawer = $("#cartDrawer");
  const openBtn = $("#cartOpen");
  const closeBtn = $("#cartClose");
  const backdrop = $("#cartBackdrop");
  if (!drawer) return;

  function openDrawer() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    renderCart();
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }

  if (openBtn) openBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  const clearBtn = $("#cartClear");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    setCart([]);
    renderCart();
  });

  const checkoutFake = $("#checkoutFake");
  if (checkoutFake) checkoutFake.addEventListener("click", () => {
    alert("Demo-Checkout: In einem echten Shop würdest du jetzt zu PayPal/Stripe wechseln.");
  });
}

// ==============================
// TEAMS: Filter + Suche
// ==============================
function setupTeams() {
  const search = $("#teamSearch");
  const chips = $$("#teamChips .chip");
  const cards = $$("#teamGrid .team-card");
  if (!cards.length) return; // // Nur auf teams.html relevant

  let filter = "all";

  function apply() {
    const q = (search?.value || "").trim().toLowerCase();

    cards.forEach(card => {
      const type = card.dataset.type;
      const txt = card.textContent.toLowerCase();

      const matchType = (filter === "all") || (filter === type);
      const matchText = !q || txt.includes(q);

      card.style.display = (matchType && matchText) ? "grid" : "none";
    });
  }

  chips.forEach(ch => {
    ch.addEventListener("click", () => {
      chips.forEach(x => x.classList.remove("active"));
      ch.classList.add("active");
      filter = ch.dataset.filter;
      apply();
    });
  });

  if (search) search.addEventListener("input", apply);

  apply();
}

// ==============================
// FAQ Accordion
// ==============================
function setupFAQ() {
  const items = $$("[data-acc]");
  if (!items.length) return;

  items.forEach(btn => {
    btn.addEventListener("click", () => {
      // // Panel ist direkt danach im DOM
      const panel = btn.nextElementSibling;
      const isOpen = btn.classList.contains("open");

      // // Optional: immer nur eins offen
      items.forEach(x => {
        x.classList.remove("open");
        const p = x.nextElementSibling;
        if (p) p.classList.remove("open");
      });

      if (!isOpen) {
        btn.classList.add("open");
        if (panel) panel.classList.add("open");
      }
    });
  });
}

// ==============================
// Anmeldung: Live-Summe berechnen + Demo Submit
// ==============================
function setupSignup() {
  const form = $("#signupForm");
  if (!form) return;

  const membership = $("#membership");
  const donation = $("#donation");
  const sumMembership = $("#sumMembership");
  const sumDonation = $("#sumDonation");
  const sumTotal = $("#sumTotal");

  function calc() {
    const mem = membership?.checked ? 50 : 0;
    const don = Math.max(0, Number(donation?.value || 0));
    sumMembership.textContent = moneyEUR(mem);
    sumDonation.textContent = moneyEUR(don);
    sumTotal.textContent = moneyEUR(mem + don);
  }

  membership?.addEventListener("change", calc);
  donation?.addEventListener("input", calc);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calc();

    // // Demo: Bestätigung
    const pay = $("#payment")?.value || "paypal";
    alert("Danke! Demo-Anmeldung gespeichert.\nZahlungsart: " + pay.toUpperCase());
    form.reset();
    // // Nach reset wieder Standard (Mitglied an)
    if (membership) membership.checked = true;
    calc();
  });

  calc();
}

// ==============================
// INIT
// ==============================
applyTheme();
updateCartBadge();
setupMobileNav();

const themeBtn = $("#themeToggle");
if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

setupShop();
setupTeams();
setupFAQ();
setupSignup();

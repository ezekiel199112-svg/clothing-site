let selectedSize = null;

// =========================
// SIZE SELECTION (PRODUCT PAGE)
// =========================
function selectSize(size, btn) {
  selectedSize = size;

  document.querySelectorAll(".size-btn").forEach(b => {
    b.classList.remove("active");
  });

  btn.classList.add("active");

  document.getElementById("addCartBtn").disabled = false;
  if (document.getElementById("buyNowStripe")) {
    document.getElementById("buyNowStripe").disabled = false;
  }
}
let selectedQty = 1;

function changeQty(amount) {
  selectedQty += amount;

  if (selectedQty < 1) {
    selectedQty = 1;
  }

  document.getElementById("qty-display").textContent = selectedQty;
}
// =========================
// ADD TO CART
// =========================
function addToCart() {
  if (!selectedSize) return;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const nameEl  = document.getElementById("product-name");
  const priceEl = document.querySelector(".product-price");

  const name  = nameEl  ? nameEl.innerText  : "Product";
  const price = priceEl ? parseInt(priceEl.innerText.replace("$", "")) : 0;

const existingItem = cart.find(
  item =>
    item.name === name &&
    item.size === selectedSize
);

if (existingItem) {
  existingItem.quantity =
    (existingItem.quantity || 1) + selectedQty;
} else {
  cart.push({
    id: Date.now(),
    name: name,
    price: price,
    quantity: selectedQty,
    size: selectedSize,
    selected: true,
    image: document.getElementById("main-img")?.src || "",
    page: window.location.pathname.split("/").pop()
  });
}
  localStorage.setItem("cart", JSON.stringify(cart));

  showCartPopup();
}

// =========================
// TOGGLE SELECT
// =========================
function toggleSelect(id) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart = cart.map(item => {
    if (item.id === id) {
      return { ...item, selected: !item.selected };
    }
    return item;
  });

  localStorage.setItem("cart", JSON.stringify(cart));
}

// =========================
// REMOVE ITEM
// =========================
function removeFromCart(id) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =========================
// CART POPUP / PANEL
// =========================
function showCartPopup() {
  if (typeof openCart === "function") {
    openCart();
    return;
  }

  let cart  = JSON.parse(localStorage.getItem("cart")) || [];
let popup = document.getElementById("cartPopup");
if (!popup) return;

let total = 0;

popup.innerHTML = "<h3>Cart</h3>";

  cart.forEach(item => {
    if (item.selected) {
  total += item.price * (item.quantity || 1);
}
    popup.innerHTML += `
      <div style="margin-bottom:10px;">
        <p>${item.name} - Size ${item.size} - $${item.price}</p>
      </div>
    `;
  });

  popup.innerHTML += `
    <hr>
    <strong>Total: $${total}</strong>
    <br><br>
    <button onclick="buySelected()">Buy Selected</button>
  `;

  popup.style.display = "block";

  setTimeout(() => popup.classList.add("fade-out"), 5000);
  setTimeout(() => {
    popup.style.display = "none";
    popup.classList.remove("fade-out");
  }, 6500);
}

// =========================
// BUY SELECTED
// =========================
function buySelected() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let selectedItems = cart.filter(item => item.selected);

  if (selectedItems.length === 0) {
    alert("No items selected");
    return;
  }

  let total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  alert(
    "Buying:\n\n" +
    selectedItems.map(i => `${i.name} (Size ${i.size})`).join("\n") +
    "\n\nTotal: $" + total
  );
}

// =========================
// CART PAGE RENDER
// =========================
function renderCartPage() {
let subtotal = 0;
let itemCount = 0;
  let cart      = JSON.parse(localStorage.getItem("cart")) || [];
  let container = document.getElementById("cartContainer");
  let totalEl   = document.getElementById("cartTotal");

  if (!container || !totalEl) return;

  container.innerHTML = "";

cart.forEach(item => {
  if (item.selected) {
    subtotal += item.price * (item.quantity || 1);
    itemCount += item.quantity || 1;
  }

  container.innerHTML += `
      <div class="cart-item">
        <div
          class="select-btn ${item.selected ? "selected" : ""}"
          onclick="toggleSelect(${item.id}); renderCartPage();"
        ></div>
        <a href="${item.page || '#'}" class="cart-product-link">
  <img
    src="${item.image || ''}"
    class="cart-product-img"
    alt="${item.name}"
  >

<div class="item-info">
  <p class="item-name">
    <strong>${item.name}</strong>
  </p>

<p style="margin:0;font-size:14px;color:#777;letter-spacing:1px;">
  Size ${item.size} · Qty ${item.quantity || 1}
</p>

  <div class="qty-controls">
    <button onclick="event.preventDefault(); event.stopPropagation(); decreaseQty(${item.id}); renderCartPage();">−</button>

<span>${item.quantity || 1}</span>

<button onclick="event.preventDefault(); event.stopPropagation(); increaseQty(${item.id}); renderCartPage();">+</button>
  </div>
</div>
</a>
        <div class="right-side">
  <span class="price">
  $${item.price * (item.quantity || 1)}
</span>

  <span class="remove-x"
        onclick="removeFromCart(${item.id}); renderCartPage();">
    ✕
  </span>
</div>
      </div>
    `;
  });

const shipping = subtotal >= 150 ? 0 : (subtotal === 0 ? 0 : 6);
const total = subtotal + shipping;

if (subtotal === 0) {
  totalEl.innerHTML = `<strong>Total: $0</strong>`;
} else {
  totalEl.innerHTML = `
    Subtotal: $${subtotal}<br>
    Shipping: ${shipping === 0 ? "FREE" : "$" + shipping}<br>
    <strong>Total: $${total}</strong>
  `;
}
}

// =========================
// BUY NOW (CART PAGE)
// =========================
function buyNowCart() {
  let cart          = JSON.parse(localStorage.getItem("cart")) || [];
  let selectedItems = cart.filter(item => item.selected);

  if (selectedItems.length === 0) {
    alert("No items selected");
    return;
  }

  let total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  alert(
    "Checkout Ready:\n\n" +
    selectedItems.map(i => `${i.name} (Size ${i.size})`).join("\n") +
    "\n\nTotal: $" + total +
    "\n\n(Stripe will be added next)"
  );
}
function openImageFullscreen(imgSrc) {
  document.getElementById('fullscreenImg').src = imgSrc;
  document.getElementById('imageFullscreen').classList.add('active');
}

function closeImageFullscreen() {
  document.getElementById('imageFullscreen').classList.remove('active');
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-main-img').forEach(img => {
    img.style.cursor = 'zoom-in';

    img.addEventListener('click', () => {
      openImageFullscreen(img.src);
    });
  });
});
function increaseQty(id) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart = cart.map(item => {
    if (item.id === id) {
      item.quantity++;
    }
    return item;
  });

  localStorage.setItem("cart", JSON.stringify(cart));
}

function decreaseQty(id) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart = cart.map(item => {
    if (item.id === id && item.quantity > 1) {
      item.quantity--;
    }
    return item;
  });

  localStorage.setItem("cart", JSON.stringify(cart));
}
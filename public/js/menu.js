// CafeLive - Menu Module (js/menu.js)
// Real-time listener for Firestore collection "menu", smart image fallbacks (.jpg -> .svg -> placeholder),
// skeleton shimmer loaders, and toast notifications

import {
  db,
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  serverTimestamp
} from "./firebase.js?v=20261113b";

// Helper to format Indian Rupee (INR) currency
export function formatPrice(price) {
  const num = Number(price);
  if (isNaN(num)) return "₹0";
  return "₹" + Math.round(num);
}

// Generate animated skeleton placeholder cards while Firestore is loading
export function createSkeletonGrid(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-image"></div>
      <div class="skeleton-body">
        <div>
          <div class="skeleton-line title"></div>
          <div class="skeleton-line sub"></div>
        </div>
        <div class="skeleton-bottom-row">
          <div class="skeleton-line price"></div>
          <div class="skeleton-line btn"></div>
        </div>
      </div>
    </div>
  `).join("");
}

// Lightweight Toast Notification system
export function showToast(message, icon = "☕") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";

  const iconSpan = document.createElement("span");
  iconSpan.textContent = icon;
  const textSpan = document.createElement("span");
  textSpan.textContent = message;

  toast.appendChild(iconSpan);
  toast.appendChild(textSpan);
  container.appendChild(toast);

  // Auto-dismiss after 3s
  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => {
      toast.remove();
    }, 280);
  }, 3000);
}

// Subscribe to real-time menu updates via Firestore onSnapshot
export function subscribeToMenu(onUpdate, onError) {
  const menuColRef = collection(db, "menu");

  return onSnapshot(
    menuColRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        items.push({
          id: docSnapshot.id,
          name: data.name || "Untitled Item",
          price: Number(data.price) || 0,
          discountPercent: Number(data.discountPercent) || 0,
          priceUpdatedAt: data.priceUpdatedAt || null,
          category: data.category || "General",
          image: data.image || "",
          available: data.available !== false // defaults to true
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error("Error listening to menu changes:", error);
      if (onError) onError(error);
    }
  );
}

// Helper to get matching local real photo (.jpg) for menu items
export function getLocalJpgFor(item) {
  const name = (item.name || "").toLowerCase();
  if (name.includes("khari")) return "images/khari.jpg";
  if (name.includes("samosa")) return "images/samosa.jpg";
  if (name.includes("zafrani")) return "images/zafrani-chai.jpg";
  if (name.includes("chai") || name.includes("tea")) return "images/irani-chai.jpg";
  if (name.includes("cold coffee") || name.includes("iced") || name.includes("hazelnut")) return "images/cold-coffee.jpg";
  if (name.includes("coffee")) return "images/filter-coffee.jpg";
  if (name.includes("badam") || name.includes("kesar") || name.includes("milk")) return "images/badam-milk.jpg";
  if (name.includes("osmania") || name.includes("biscuit") || name.includes("cookie")) return "images/osmania.jpg";
  if (name.includes("bun") || name.includes("maska")) return "images/bun-maska.jpg";
  if (name.includes("dilkhush")) return "images/dilkhush.jpg";
  if (name.includes("cake") || name.includes("plum")) return "images/plum-cake.jpg";
  if (name.includes("luqmi")) return "images/luqmi.jpg";
  if (name.includes("sandwich") || name.includes("paneer")) return "images/sandwich.jpg";
  if (name.includes("fries") || name.includes("peri")) return "images/french-fries.jpg";
  return "images/irani-chai.jpg";
}

// Helper to get matching local SVG fallback for offline / broken image protection
export function getLocalFallbackFor(item) {
  const name = (item.name || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();
  if (name.includes("samosa")) return "images/samosa.svg";
  if (name.includes("khari")) return "images/osmania.svg";
  if (name.includes("chai") || name.includes("tea")) return "images/irani-chai.svg";
  if (name.includes("coffee")) return "images/filter-coffee.svg";
  if (name.includes("osmania") || name.includes("biscuit") || name.includes("cookie")) return "images/osmania.svg";
  if (name.includes("bun") || name.includes("maska")) return "images/bun-maska.svg";
  if (name.includes("luqmi")) return "images/luqmi.svg";
  return "images/placeholder.svg";
}

// Calculate effective customer price taking optional discountPercent (0-90) into account
export function getEffectivePrice(item) {
  const price = Number(item.price) || 0;
  const discount = Number(item.discountPercent) || 0;
  if (discount > 0 && discount <= 90) {
    return Math.max(1, Math.round(price * (1 - discount / 100)));
  }
  return Math.max(0, Math.round(price));
}

// Format Firestore serverTimestamp or Date for Price History display
export function formatPriceUpdatedAt(timestamp) {
  if (!timestamp) return "Initial";
  const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
  if (isNaN(date.getTime())) return "Recently";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " • " + date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Authentic Hyderabad Cafe Menu: High-Resolution Authentic Cafe Food Photography (.jpg)
export const SAMPLE_MENU = [
  // Beverages (Chai & Coffee)
  {
    name: "Special Hyderabadi Irani Chai",
    price: 30,
    category: "Beverages",
    image: "images/irani-chai.jpg",
    available: true
  },
  {
    name: "Zafrani (Saffron) Dum Chai",
    price: 50,
    category: "Beverages",
    image: "images/zafrani-chai.jpg",
    available: true
  },
  {
    name: "South Indian Filter Coffee",
    price: 45,
    category: "Beverages",
    image: "images/filter-coffee.jpg",
    available: true
  },
  {
    name: "Iced Hazelnut Cold Coffee",
    price: 130,
    category: "Beverages",
    image: "images/cold-coffee.jpg",
    available: true
  },
  {
    name: "Chilled Badam Kesar Milk",
    price: 90,
    category: "Beverages",
    image: "images/badam-milk.jpg",
    available: true
  },

  // Bakery & Breakfast Classics
  {
    name: "Famous Osmania Biscuits (4 pcs)",
    price: 40,
    category: "Bakery",
    image: "images/osmania.jpg",
    available: true
  },
  {
    name: "Warm Bun Maska (Cream Butter)",
    price: 60,
    category: "Bakery",
    image: "images/bun-maska.jpg",
    available: true
  },
  {
    name: "Bun Maska with Fruit Jam",
    price: 70,
    category: "Bakery",
    image: "images/bun-maska.jpg",
    available: true
  },
  {
    name: "Old City Sweet Dilkhush",
    price: 80,
    category: "Bakery",
    image: "images/dilkhush.jpg",
    available: true
  },
  {
    name: "Crispy Khari Puff Biscuit (3 pcs)",
    price: 45,
    category: "Bakery",
    image: "images/khari.jpg",
    available: true
  },
  {
    name: "Traditional Rich Plum Cake",
    price: 75,
    category: "Bakery",
    image: "images/plum-cake.jpg",
    available: false // Sold out demo
  },

  // Savory Snacks & Street Eats
  {
    name: "Hyderabadi Mutton Keema Luqmi (2 pcs)",
    price: 130,
    category: "Snacks",
    image: "images/luqmi.jpg",
    available: true
  },
  {
    name: "Crispy Chicken Keema Samosa (2 pcs)",
    price: 110,
    category: "Snacks",
    image: "images/samosa.jpg",
    available: true
  },
  {
    name: "Hot Aloo Samosa with Mint Chutney (2 pcs)",
    price: 50,
    category: "Snacks",
    image: "images/samosa.jpg",
    available: true
  },
  {
    name: "Paneer Tikka Grilled Sandwich",
    price: 150,
    category: "Snacks",
    image: "images/sandwich.jpg",
    available: true
  },
  {
    name: "Peri-Peri Masala French Fries",
    price: 110,
    category: "Snacks",
    image: "images/french-fries.jpg",
    available: true
  }
];

// Helper to seed sample items into Firestore
export async function seedSampleMenu() {
  const menuColRef = collection(db, "menu");
  const promises = SAMPLE_MENU.map((item) => addDoc(menuColRef, item));
  return Promise.all(promises);
}

// Non-destructive: Add or update the 16 authentic items by name, never delete existing items
export async function resetToHyderabadMenu() {
  const menuColRef = collection(db, "menu");
  const existingDocs = await getDocs(menuColRef);

  // Map existing items by name
  const existingByName = new Map();
  existingDocs.docs.forEach((d) => {
    const data = d.data();
    if (data && data.name) {
      existingByName.set(data.name.trim(), d);
    }
  });

  const promises = SAMPLE_MENU.map(async (item) => {
    const existingDoc = existingByName.get(item.name.trim());
    if (existingDoc) {
      // Update existing item
      const itemRef = doc(db, "menu", existingDoc.id);
      return updateDoc(itemRef, {
        price: Number(item.price),
        category: item.category,
        image: item.image,
        available: item.available !== false
      });
    } else {
      // Add new item
      return addDoc(menuColRef, item);
    }
  });

  return Promise.all(promises);
}

// Safely render a single menu item card with top image, fallback handling, and staggered animation
export function createMenuItemElement(item, onAddToCart, index = 0) {
  const card = document.createElement("article");
  card.className = "menu-item-card" + (item.available ? "" : " is-unavailable");
  card.dataset.id = item.id;
  card.style.setProperty("--item-index", index);

  // 1. Image Container on Top with Multi-tier Fallback
  const imageWrap = document.createElement("div");
  imageWrap.className = "menu-item-image-wrap";

  const img = document.createElement("img");
  img.className = "menu-item-image";
  img.alt = item.name;
  img.loading = "lazy";
  img.width = 400;
  img.height = 260;

  // Multi-tier Fallback sequence:
  // Step 1: Attempt to load real photo (.jpg) first
  // Step 2: If .jpg fails or is missing, fall back to matching SVG (e.g. images/irani-chai.svg)
  // Step 3: If .svg fails, fall back to images/placeholder.svg
  const svgFallback = getLocalFallbackFor(item);
  let primarySrc = item.image;
  if (!primarySrc || primarySrc.endsWith(".svg")) {
    primarySrc = getLocalJpgFor(item);
  }
  img.src = primarySrc;

  img.onerror = () => {
    // If .jpg or remote photo fails, try local SVG illustration
    if (img.src !== svgFallback && !img.src.endsWith(svgFallback)) {
      img.onerror = () => {
        // If SVG illustration also fails, fall back to placeholder.svg
        img.onerror = null;
        img.src = "images/placeholder.svg";
      };
      img.src = svgFallback;
    } else if (!img.src.endsWith("placeholder.svg")) {
      img.onerror = null;
      img.src = "images/placeholder.svg";
    }
  };

  imageWrap.appendChild(img);
  card.appendChild(imageWrap);

  // 2. Card Body Container
  const body = document.createElement("div");
  body.className = "menu-item-body";

  // Top Section: Title & Category / Sold Out Badge
  const topDiv = document.createElement("div");
  topDiv.className = "menu-item-top";

  const title = document.createElement("h3");
  title.className = "menu-item-title";
  title.textContent = item.name;
  topDiv.appendChild(title);

  if (item.available) {
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge-category";
    categoryBadge.textContent = item.category;
    topDiv.appendChild(categoryBadge);
  } else {
    const soldOutBadge = document.createElement("span");
    soldOutBadge.className = "badge-soldout";
    soldOutBadge.textContent = "Sold Out";
    topDiv.appendChild(soldOutBadge);
  }

  body.appendChild(topDiv);

  // Bottom Section: Price & Action Button
  const bottomDiv = document.createElement("div");
  bottomDiv.className = "menu-item-bottom";

  const priceContainer = document.createElement("div");
  priceContainer.className = "menu-item-price-container";

  const effPrice = getEffectivePrice(item);
  const discount = Number(item.discountPercent) || 0;

  if (discount > 0 && discount <= 90) {
    const newPriceSpan = document.createElement("span");
    newPriceSpan.className = "menu-item-price";
    newPriceSpan.textContent = formatPrice(effPrice);

    const oldPriceSpan = document.createElement("span");
    oldPriceSpan.className = "menu-item-old-price";
    oldPriceSpan.textContent = formatPrice(item.price);

    const discountBadge = document.createElement("span");
    discountBadge.className = "badge-discount";
    discountBadge.textContent = `${discount}% OFF`;

    priceContainer.appendChild(newPriceSpan);
    priceContainer.appendChild(oldPriceSpan);
    priceContainer.appendChild(discountBadge);
  } else {
    const price = document.createElement("span");
    price.className = "menu-item-price";
    price.textContent = formatPrice(item.price);
    priceContainer.appendChild(price);
  }
  bottomDiv.appendChild(priceContainer);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn btn-secondary btn-sm";

  if (item.available) {
    addBtn.textContent = "+ Add to Cart";
    addBtn.addEventListener("click", () => {
      if (onAddToCart) onAddToCart(item);
    });
  } else {
    addBtn.textContent = "Unavailable";
    addBtn.disabled = true;
  }

  bottomDiv.appendChild(addBtn);
  body.appendChild(bottomDiv);

  card.appendChild(body);
  return card;
}

// Alias for convenience
export const renderMenuItemCard = createMenuItemElement;

// -------------------------------------------------------------
// OWNER MENU MANAGEMENT (Add & Toggle items)
// -------------------------------------------------------------

// Add a brand new item to the Firestore menu collection (Owner only)
export async function addMenuItem(itemData) {
  if (!itemData.name || !itemData.name.trim()) {
    return { success: false, error: "Please enter an item name." };
  }
  const price = Number(itemData.price);
  if (isNaN(price) || price <= 0) {
    return { success: false, error: "Please enter a valid price in INR (₹ greater than 0)." };
  }

  try {
    const payload = {
      name: itemData.name.trim(),
      price: Math.round(price),
      category: itemData.category || "Beverages",
      image: (itemData.image || "").trim() || "images/placeholder.svg",
      available: itemData.available !== false
    };

    const docRef = await addDoc(collection(db, "menu"), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding menu item:", error);
    return { success: false, error: error.message };
  }
}

// Update an existing menu item in Firestore (Owner only)
export async function updateMenuItem(itemId, itemData) {
  if (!itemId) {
    return { success: false, error: "Missing item ID." };
  }
  if (!itemData.name || !itemData.name.trim()) {
    return { success: false, error: "Item name cannot be empty." };
  }
  const price = Number(itemData.price);
  if (isNaN(price) || price <= 0) {
    return { success: false, error: "Price must be a number greater than 0." };
  }

  try {
    const payload = {
      name: itemData.name.trim(),
      price: Math.round(price),
      category: itemData.category || "Beverages",
      image: (itemData.image || "").trim() || "images/placeholder.svg",
      available: itemData.available !== false,
      priceUpdatedAt: serverTimestamp()
    };
    if (itemData.discountPercent !== undefined) {
      payload.discountPercent = Math.min(90, Math.max(0, Number(itemData.discountPercent) || 0));
    }

    const itemRef = doc(db, "menu", itemId);
    await updateDoc(itemRef, payload);
    return { success: true };
  } catch (error) {
    console.error("Error updating menu item:", error);
    return { success: false, error: error.message };
  }
}

// Quick price adjustment / set exact price for a menu item (Owner only)
export async function updateItemPrice(itemId, newPrice) {
  const price = Number(newPrice);
  if (isNaN(price) || price <= 0) {
    return { success: false, error: "Price must be a number greater than 0." };
  }
  try {
    const itemRef = doc(db, "menu", itemId);
    await updateDoc(itemRef, {
      price: Math.round(price),
      priceUpdatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating price:", error);
    return { success: false, error: error.message };
  }
}

// Update or turn off discount percent (0 - 90) (Owner only)
export async function updateItemDiscount(itemId, discountPercent) {
  const discount = Number(discountPercent);
  if (isNaN(discount) || discount < 0 || discount > 90) {
    return { success: false, error: "Discount must be a number between 0% and 90%." };
  }
  try {
    const itemRef = doc(db, "menu", itemId);
    await updateDoc(itemRef, {
      discountPercent: Math.round(discount),
      priceUpdatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating discount:", error);
    return { success: false, error: error.message };
  }
}

// Bulk action: Apply discount to an entire category (Owner only)
export async function bulkApplyCategoryDiscount(items, category, discountPercent) {
  const discount = Number(discountPercent);
  if (isNaN(discount) || discount < 0 || discount > 90) {
    return { success: false, error: "Discount must be between 0% and 90%." };
  }
  const targets = items.filter(
    (item) => category === "All" || item.category === category
  );
  if (targets.length === 0) {
    return { success: true, count: 0 };
  }
  try {
    const promises = targets.map((item) => {
      const itemRef = doc(db, "menu", item.id);
      return updateDoc(itemRef, {
        discountPercent: Math.round(discount),
        priceUpdatedAt: serverTimestamp()
      });
    });
    await Promise.all(promises);
    return { success: true, count: targets.length };
  } catch (error) {
    console.error("Bulk apply discount failed:", error);
    return { success: false, error: error.message };
  }
}

// Bulk action: Clear all discounts across all items (Owner only)
export async function bulkClearAllDiscounts(items) {
  const targets = items.filter((item) => Number(item.discountPercent) > 0);
  if (targets.length === 0) {
    return { success: true, count: 0 };
  }
  try {
    const promises = targets.map((item) => {
      const itemRef = doc(db, "menu", item.id);
      return updateDoc(itemRef, {
        discountPercent: 0,
        priceUpdatedAt: serverTimestamp()
      });
    });
    await Promise.all(promises);
    return { success: true, count: targets.length };
  } catch (error) {
    console.error("Bulk clear discounts failed:", error);
    return { success: false, error: error.message };
  }
}

// Toggle an existing item's availability (Available <-> Sold Out) (Owner only)
export async function toggleMenuItemAvailability(itemId, currentStatus) {
  try {
    const itemRef = doc(db, "menu", itemId);
    await updateDoc(itemRef, { available: !currentStatus });
    return { success: true };
  } catch (error) {
    console.error("Error toggling item availability:", error);
    return { success: false, error: error.message };
  }
}

// Delete a menu item permanently from Firestore (Owner only)
export async function deleteMenuItem(itemId) {
  try {
    const itemRef = doc(db, "menu", itemId);
    await deleteDoc(itemRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return { success: false, error: error.message };
  }
}

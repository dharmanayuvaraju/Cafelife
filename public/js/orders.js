// CafeLive - Orders Module (js/orders.js)
// Handles order placement with customer nickname and real-time order tracking

import {
  db,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "./firebase.js?v=20261113b";

// Helper to format timestamps safely
export function formatOrderDate(timestamp) {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date());
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " • " + date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// 1. Place a new order into Firestore with customer nickname
export async function placeOrder(user, cartItems, customerName = "") {
  if (!user || !user.uid) {
    return { success: false, error: "Please sign in to place your order." };
  }

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: "Your cart is empty. Add items from the menu first." };
  }

  try {
    // Sanitize and shape item list
    const items = cartItems.map((item) => ({
      name: String(item.name || "Item"),
      qty: Math.max(1, Number(item.qty) || 1),
      price: Math.max(0, Number(item.price) || 0)
    }));

    // Calculate total in client (Honest disclaimer in README)
    const total = items.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);

    // Pick customer name from input, or fallback to user displayName or email prefix
    const trimmedName = String(customerName || "").trim();
    const finalCustomerName = trimmedName || user.displayName || (user.email ? user.email.split("@")[0] : "Customer");

    const orderPayload = {
      userId: user.uid,
      userEmail: user.email || "Customer",
      customerName: finalCustomerName, // Nickname for the barista to call out
      items: items,
      total: total,
      status: "received", // Strict requirement: must start with "received"
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "orders"), orderPayload);
    return { success: true, orderId: docRef.id, customerName: finalCustomerName };
  } catch (error) {
    console.error("Order creation failed:", error);
    return { success: false, error: error.message };
  }
}

// 2. Real-time listener for current user's orders (My Orders)
// Note: We sort in JavaScript to avoid requiring composite indexes in Firestore
export function subscribeToUserOrders(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = [];
      snapshot.forEach((docSnapshot) => {
        orders.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      // Sort in JavaScript by createdAt descending (newest first)
      orders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      onUpdate(orders);
    },
    (error) => {
      console.error("Error listening to user orders:", error);
      if (onError) onError(error);
    }
  );
}

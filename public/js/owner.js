// CafeLive - Owner Board Module (js/owner.js)
// Real-time Kanban order board for cafe owners with status updates

import {
  db,
  doc,
  getDoc,
  collection,
  updateDoc,
  onSnapshot,
  query,
  where
} from "./firebase.js?v=20261113b";

// Check if the currently signed-in user is an authorized owner
// Rule: Look up document owners/{uid}
export async function checkIfOwner(uid) {
  if (!uid) return false;
  try {
    const ownerDocRef = doc(db, "owners", uid);
    const docSnap = await getDoc(ownerDocRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error verifying owner privileges:", error);
    return false;
  }
}

// Update order status in Firestore (Only owners allowed by security rules)
export async function updateOrderStatus(orderId, nextStatus) {
  const allowedStatuses = ["received", "preparing", "ready", "completed", "cancelled"];
  if (!allowedStatuses.includes(nextStatus)) {
    return { success: false, error: "Invalid status transition: " + nextStatus };
  }

  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: nextStatus });
    return { success: true };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: error.message };
  }
}

// Subscribe to active orders only (status in [received, preparing, ready])
// Note: We use where("status", "in", [...]) without orderBy so no composite index is needed.
// Orders are sorted by createdAt descending in JavaScript.
export function subscribeToActiveOrders(onUpdate, onError) {
  const q = query(
    collection(db, "orders"),
    where("status", "in", ["received", "preparing", "ready"])
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
      console.error("Error listening to active orders:", error);
      if (onError) onError(error);
    }
  );
}

// Backward-compatible alias for existing callers
export const subscribeToAllOrders = subscribeToActiveOrders;

// Subscribe to past order history (status in [completed, cancelled])
// Returns latest 50 orders sorted in JavaScript by createdAt descending. No index needed.
export function subscribeToOrderHistory(onUpdate, onError) {
  const q = query(
    collection(db, "orders"),
    where("status", "in", ["completed", "cancelled"])
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

      // Keep latest 50
      const latest50 = orders.slice(0, 50);
      onUpdate(latest50);
    },
    (error) => {
      console.error("Error listening to order history:", error);
      if (onError) onError(error);
    }
  );
}


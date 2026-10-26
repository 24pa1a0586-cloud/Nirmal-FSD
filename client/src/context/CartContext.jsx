import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'shopeasy_cart';
const MAX_ITEM_QUANTITY = 15; // Realistic maximum per item for demo catalog

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Synchronize cart with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  /**
   * Add a product to the cart or increase its quantity.
   * Works seamlessly with Fake Store API product IDs (e.g., product.id).
   */
  const addToCart = (product, quantityToAdd = 1) => {
    const qty = parseInt(quantityToAdd, 10) || 1;
    if (qty <= 0) return { success: false, message: 'Quantity must be at least 1' };

    const productId = String(product.id ?? product._id);
    const productTitle = product.title || product.name || 'Product';
    const productPrice = Number(product.price) || 0;

    let addedSuccessfully = false;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => String(item.id) === productId);

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const newTotalQty = existingItem.quantity + qty;

        if (newTotalQty > MAX_ITEM_QUANTITY) {
          showToast(`Limit reached: maximum ${MAX_ITEM_QUANTITY} units per product.`, 'warning');
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...existingItem,
          quantity: newTotalQty,
          price: productPrice,
        };
        addedSuccessfully = true;
        showToast(`Updated "${productTitle.slice(0, 30)}..." quantity to ${newTotalQty}`, 'success');
        return updated;
      } else {
        if (qty > MAX_ITEM_QUANTITY) {
          showToast(`Limit reached: maximum ${MAX_ITEM_QUANTITY} units per product.`, 'warning');
          return prevItems;
        }

        addedSuccessfully = true;
        showToast(`Added "${productTitle.slice(0, 30)}..." to cart`, 'success');
        return [
          ...prevItems,
          {
            id: productId,
            title: productTitle,
            name: productTitle, // Fallback compatibility
            price: productPrice,
            image: product.image || '',
            category: product.category || 'General',
            quantity: qty,
          },
        ];
      }
    });

    return { success: addedSuccessfully };
  };

  /**
   * Update quantity of an item in the cart
   */
  const updateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 1) return;

    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        if (String(item.id) === String(productId)) {
          if (qty > MAX_ITEM_QUANTITY) {
            showToast(`Maximum ${MAX_ITEM_QUANTITY} units allowed per item`, 'warning');
            return { ...item, quantity: MAX_ITEM_QUANTITY };
          }
          return { ...item, quantity: qty };
        }
        return item;
      });
    });
  };

  /**
   * Remove an item from the cart
   */
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const itemToRemove = prevItems.find((i) => String(i.id) === String(productId));
      if (itemToRemove) {
        showToast(`Removed "${itemToRemove.title.slice(0, 25)}..." from cart`, 'info');
      }
      return prevItems.filter((item) => String(item.id) !== String(productId));
    });
  };

  /**
   * Clear the cart (invoked only after successful order placement)
   */
  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Total count of individual units in cart
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Cart total in USD
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        notification,
        showToast,
      }}
    >
      {children}

      {/* Global Toast Notification */}
      {notification && (
        <div
          role="alert"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border flex items-center gap-2 transition-all duration-300 ${
            notification.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : notification.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

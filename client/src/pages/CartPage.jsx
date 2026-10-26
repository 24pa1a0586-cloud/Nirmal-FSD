import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🛒
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Shopping Cart is Empty</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Looks like you haven't added any products yet. Explore our Fake Store API catalog to find what you need.
          </p>
          <Link
            to="/products"
            id="empty-cart-browse-btn"
            className="inline-block px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          >
            Browse Products Catalog
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckoutClick = () => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login?redirect=/checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your selected products from Fake Store API and proceed to checkout.
          </p>
        </div>
        <Link
          to="/products"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          &larr; Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Unit Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* Cart Items Rows */}
            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => {
                const itemId = String(item.id ?? item._id);
                const title = item.title || item.name || 'Product';
                const price = Number(item.price) || 0;
                const subtotal = price * item.quantity;

                return (
                  <div
                    key={itemId}
                    className="p-4 sm:px-6 sm:py-4 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center"
                  >
                    {/* Product Info & Thumbnail */}
                    <div className="sm:col-span-6 flex items-center gap-4 w-full">
                      <div className="w-16 h-16 bg-white p-1 rounded-md overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={title}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${itemId}`}
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-1"
                        >
                          {title}
                        </Link>
                        <span className="text-xs text-gray-500 block capitalize">{item.category}</span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(itemId)}
                          className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2 text-left sm:text-center w-full sm:w-auto flex justify-between sm:block">
                      <span className="sm:hidden text-xs text-gray-500 font-medium">Unit Price:</span>
                      <span className="text-sm text-gray-700 font-medium">
                        ${price.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="sm:col-span-2 flex justify-between sm:justify-center items-center w-full sm:w-auto">
                      <span className="sm:hidden text-xs text-gray-500 font-medium">Quantity:</span>
                      <div className="flex items-center border border-gray-300 rounded bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          disabled={item.quantity >= 15}
                          className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="sm:col-span-2 text-right w-full sm:w-auto flex justify-between sm:block border-t sm:border-0 pt-2 sm:pt-0">
                      <span className="sm:hidden text-xs text-gray-500 font-medium">Subtotal:</span>
                      <span className="text-sm font-bold text-gray-900">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total Units</span>
              <span className="font-semibold text-gray-900">{cartCount}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Standard Shipping</span>
              <span className="font-semibold text-green-700">FREE</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Catalog Source</span>
              <span className="font-medium text-gray-700">Fake Store API</span>
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
              <span className="text-base font-bold text-gray-900">Cart Total</span>
              <span className="text-xl font-extrabold text-blue-600">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckoutClick}
              id="proceed-to-checkout-btn"
              className="w-full text-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-sm transition-colors"
            >
              {isAuthenticated ? 'Proceed to Checkout →' : 'Sign in to Checkout →'}
            </button>

            {!isAuthenticated && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200 text-center">
                User authentication is required to place an order.
              </p>
            )}

            <Link
              to="/products"
              className="w-full block text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-md transition-colors"
            >
              Continue Shopping
            </Link>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
            <p className="font-medium text-gray-700 mb-1">Academic Project Demonstration:</p>
            <p>
              Product prices are verified on the Express backend against Fake Store API prior to saving order records into MongoDB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

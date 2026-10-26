import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiRequest } from '../utils/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    deliveryAddress: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/checkout', { replace: true });
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Items to Checkout</h2>
          <p className="text-sm text-gray-600 mb-6">
            Your shopping cart is currently empty. Please add items before proceeding to checkout.
          </p>
          <Link
            to="/products"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) {
      errors.customerName = 'Full name is required';
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'A valid email address is required';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      errors.phone = 'Valid phone number is required (min. 10 digits)';
    }
    if (!formData.deliveryAddress.trim() || formData.deliveryAddress.trim().length < 5) {
      errors.deliveryAddress = 'Complete delivery address is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Build order payload
      // Backend validates product IDs and calculates authoritative prices from Fake Store API
      const orderPayload = {
        customerName: formData.customerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        items: cartItems.map((item) => ({
          productId: String(item.id),
          quantity: item.quantity,
        })),
      };

      const data = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to place order. Please review your cart.');
      }

      // Clear cart ONLY after confirmed database insertion
      clearCart();

      // Navigate to order confirmation page
      navigate(`/order-confirmation/${data.orderId}`, {
        state: { order: data.order },
      });
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-1 text-sm text-gray-500">
          Authenticated checkout for {user?.name} ({user?.email}).
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-3">
          <span className="font-bold text-red-600">!</span>
          <div className="flex-1">
            <p className="font-semibold">Checkout Failed</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Customer Information & Shipping Address
          </h2>

          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* Customer Name */}
            <div>
              <label
                htmlFor="customerName"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Rahul Sharma"
                className={`mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.customerName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {formErrors.customerName && (
                <p className="text-xs text-red-600 mt-1">{formErrors.customerName}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="rahul@example.com"
                className={`mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {formErrors.email && (
                <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide"
              >
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 9876543210"
                className={`mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {formErrors.phone && (
                <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
              )}
            </div>

            {/* Delivery Address */}
            <div>
              <label
                htmlFor="deliveryAddress"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide"
              >
                Delivery Address *
              </label>
              <textarea
                id="deliveryAddress"
                name="deliveryAddress"
                rows="3"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                placeholder="Apartment/Flat No, Street, City, State, PIN Code"
                className={`mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.deliveryAddress ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              ></textarea>
              {formErrors.deliveryAddress && (
                <p className="text-xs text-red-600 mt-1">{formErrors.deliveryAddress}</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                id="submit-order-btn"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-md font-semibold text-sm transition-colors text-white ${
                  isSubmitting
                    ? 'bg-blue-400 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                }`}
              >
                {isSubmitting ? 'Verifying with Fake Store API & Saving to MongoDB...' : 'Confirm & Place Order'}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
            Order Items ({cartItems.length})
          </h2>

          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
            {cartItems.map((item) => {
              const title = item.title || item.name || 'Product';
              const price = Number(item.price) || 0;
              return (
                <div key={item.id} className="py-2.5 flex justify-between items-center text-sm">
                  <div className="pr-2 min-w-0 flex-1">
                    <p className="font-medium text-gray-800 line-clamp-1">{title}</p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity} × ${price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 whitespace-nowrap ml-2">
                    ${(price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Standard Shipping</span>
              <span className="font-medium text-green-700">FREE</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Payment Mode</span>
              <span className="font-medium text-gray-700">Simulated Lab Checkout</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
              <span className="text-base font-bold text-gray-900">Estimated Total</span>
              <span className="text-xl font-extrabold text-blue-600">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
            <span className="font-semibold block mb-0.5">Data Integrity Notice:</span>
            The Express backend validates each product and its current price against Fake Store API before recording the order in MongoDB.
          </div>
        </div>
      </div>
    </div>
  );
}

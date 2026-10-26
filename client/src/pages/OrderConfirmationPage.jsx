import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { apiRequest } from '../utils/api';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!order && id) {
      const fetchOrder = async () => {
        setLoading(true);
        try {
          const data = await apiRequest(`/api/orders/${id}`);
          if (!data.success || !data.order) {
            throw new Error(data.message || 'Order could not be found or you are not authorized.');
          }
          setOrder(data.order);
        } catch (err) {
          console.error('Error fetching order details:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, order]);

  if (loading) {
    return <LoadingSpinner message="Retrieving order receipt from MongoDB..." />;
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ErrorMessage
          message={error || 'Could not retrieve confirmation for the specified Order ID.'}
        />
        <div className="mt-4 flex justify-center gap-3">
          <Link
            to="/orders"
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Success Badge & Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          ✓
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3 py-1 rounded-full">
          Status: {order.status || 'Placed'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-3">
          Order Successfully Placed!
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          Your order has been recorded into MongoDB and associated with your user account.
        </p>

        {/* Order ID Box */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg inline-block text-left">
          <span className="text-xs text-gray-500 uppercase font-semibold block">MongoDB Order ID:</span>
          <span className="text-base sm:text-lg font-mono font-bold text-blue-700 select-all" id="order-id-display">
            {order._id}
          </span>
          <span className="text-xs text-gray-400 block mt-1">
            Recorded: {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Delivery Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
          Customer & Shipping Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <span className="text-xs text-gray-500 block uppercase font-medium">Customer Name</span>
            <span className="font-semibold text-gray-800">{order.customerName}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block uppercase font-medium">Contact Phone</span>
            <span className="font-semibold text-gray-800">{order.phone}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block uppercase font-medium">Email Address</span>
            <span className="font-semibold text-gray-800">{order.email}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block uppercase font-medium">Shipping Address</span>
            <span className="font-semibold text-gray-800">{order.deliveryAddress}</span>
          </div>
        </div>
      </div>

      {/* Snapshot Line Items */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
          Purchased Items Snapshot ({order.items.length})
        </h2>
        <div className="divide-y divide-gray-100 mt-2">
          {order.items.map((item, index) => (
            <div key={index} className="py-3 flex justify-between items-center text-sm gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.image && (
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded p-1 flex-shrink-0 flex items-center justify-center">
                    <img src={item.image} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    Product #{item.productId} · Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                  </p>
                </div>
              </div>
              <span className="font-bold text-gray-900 whitespace-nowrap">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200 flex justify-between items-baseline">
          <span className="text-base font-bold text-gray-900">Total Charged</span>
          <span className="text-2xl font-extrabold text-blue-600">
            ${Number(order.totalAmount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
        <Link
          to="/orders"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-sm text-center transition-colors"
        >
          View All My Orders
        </Link>
        <Link
          to="/products"
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm rounded-md text-center transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

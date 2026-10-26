import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { apiRequest } from '../utils/api';

export default function MyOrdersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/orders', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/orders');

      if (!data.success) {
        throw new Error(data.message || 'Failed to retrieve order history');
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (authLoading || (loading && isAuthenticated)) {
    return <LoadingSpinner message="Retrieving your orders from MongoDB..." />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ErrorMessage message={error} onRetry={fetchOrders} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-xs text-gray-500 mt-1">
            Order history for {user?.name} ({user?.email}) stored in MongoDB
          </p>
        </div>
        <Link
          to="/products"
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          &larr; Browse Catalog
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            📦
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Orders Placed Yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            You haven't placed any orders yet. Discover items from our Fake Store API catalog and experience checkout.
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-sm transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-5 space-y-4"
            >
              {/* Order Bar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                <div>
                  <span className="font-semibold text-gray-500 uppercase block">Order ID</span>
                  <span className="font-mono font-bold text-gray-900 select-all">{order._id}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase block">Date Placed</span>
                  <span className="text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase block">Total Amount</span>
                  <span className="font-bold text-blue-600 text-sm">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase block">Status</span>
                  <span className="inline-block px-2 py-0.5 rounded-full font-semibold bg-green-50 text-green-700 border border-green-200">
                    {order.status || 'Placed'}
                  </span>
                </div>
                <div className="sm:self-center">
                  <Link
                    to={`/order-confirmation/${order._id}`}
                    state={{ order }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded transition-colors"
                  >
                    View Receipt &rarr;
                  </Link>
                </div>
              </div>

              {/* Items in this order */}
              <div className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      {item.image && (
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded p-1 flex-shrink-0 flex items-center justify-center">
                          <img src={item.image} alt="" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-800 whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Address snippet */}
              <div className="pt-2 text-xs text-gray-500 border-t border-gray-100 flex justify-between">
                <span>Shipping to: {order.deliveryAddress}</span>
                <span>Phone: {order.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

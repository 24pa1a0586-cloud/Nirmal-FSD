import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const FAKE_STORE_URL = 'https://fakestoreapi.com/products?limit=4';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Primary: Fetch directly from Fake Store API
      let res = await fetch(FAKE_STORE_URL);

      // Fallback: If external direct fetch fails, try backend proxy
      if (!res.ok) {
        res = await fetch('/api/products?limit=4');
      }

      if (!res.ok) {
        throw new Error(`Catalog service returned status ${res.status}`);
      }

      const data = await res.json();
      const products = Array.isArray(data) ? data : data.products || [];
      setFeaturedProducts(products);
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setError('Unable to load featured products from Fake Store API. Please check internet connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Welcome Banner */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 rounded-full mb-4">
            MERN Stack + Fake Store API
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Welcome to <span className="text-blue-600">ShopEasy</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed">
            Browse live products powered by Fake Store API, enjoy seamless shopping cart persistence, and experience real MongoDB user authentication and order processing.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/products"
              id="hero-browse-products-btn"
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
            >
              Browse Products Catalog
            </Link>
            <Link
              to="/cart"
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              View Cart
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-semibold text-gray-900">Fake Store API Catalog</h3>
            <p className="mt-1 text-xs text-gray-600">
              Real-world product catalog dynamically fetched across electronics, jewelery, and clothing.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-semibold text-gray-900">JWT Authentication</h3>
            <p className="mt-1 text-xs text-gray-600">
              Secure registration and login with bcrypt hashed passwords and HttpOnly cookies in MongoDB.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-semibold text-gray-900">MongoDB Order History</h3>
            <p className="mt-1 text-xs text-gray-600">
              Orders and snapshot line items persisted in MongoDB associated with the authenticated user.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-xs text-gray-500 mt-1">Live trending items from Fake Store API</p>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All Products &rarr;
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching featured products from Fake Store API..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchFeaturedProducts} />
        ) : featuredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500 text-sm">
            No products returned from catalog.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

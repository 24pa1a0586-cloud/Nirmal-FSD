import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/api';

const FAKE_STORE_BASE = 'https://fakestoreapi.com';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product categories from Fake Store API
  const fetchCategories = async () => {
    try {
      let res = await fetch(`${FAKE_STORE_BASE}/products/categories`);
      if (!res.ok) {
        res = await fetch(getApiUrl('/api/categories'));
      }
      if (res.ok) {
        const data = await res.json();
        const catList = Array.isArray(data) ? data : data.categories || [];
        setCategories(catList);
      }
    } catch (err) {
      console.error('Error fetching categories from Fake Store API:', err);
    }
  };

  // Fetch products from Fake Store API based on category
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${FAKE_STORE_BASE}/products`;
      if (selectedCategory && selectedCategory !== 'All') {
        url = `${FAKE_STORE_BASE}/products/category/${encodeURIComponent(selectedCategory)}`;
      }

      let res = await fetch(url);

      // Fallback to server proxy if external direct request fails
      if (!res.ok) {
        const query = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
        res = await fetch(getApiUrl(`/api/products${query}`));
      }

      if (!res.ok) {
        throw new Error(`Failed to load products from catalog (Status ${res.status})`);
      }

      const data = await res.json();
      const productList = Array.isArray(data) ? data : data.products || [];
      setProducts(productList);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Unable to load products from Fake Store API. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  // Client-side search filtering across title and description
  const filteredProducts = products.filter((product) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    const titleMatch = (product.title || '').toLowerCase().includes(term);
    const descMatch = (product.description || '').toLowerCase().includes(term);
    return titleMatch || descMatch;
  });

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products Catalog</h1>
        <p className="mt-1 text-sm text-gray-500">
          Explore real-world demo products loaded directly from the Fake Store API.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            id="product-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title or description..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="category-select" className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            Category:
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filters */}
        {(searchTerm || selectedCategory !== 'All') && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium py-2 px-3 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Status Bar */}
      <div className="text-xs text-gray-500">
        Showing {!loading ? filteredProducts.length : '...'} product{filteredProducts.length === 1 ? '' : 's'}
        {selectedCategory !== 'All' ? ` in "${selectedCategory}"` : ''}
        {searchTerm ? ` matching "${searchTerm}"` : ''}
      </div>

      {/* Catalog Display */}
      {loading ? (
        <LoadingSpinner message="Fetching products from Fake Store API..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchProducts} />
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
            ?
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No products found</h3>
          <p className="text-sm text-gray-500 mb-4">
            No products match your search criteria. Try a different keyword or reset category filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

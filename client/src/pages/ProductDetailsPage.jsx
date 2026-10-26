import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const FAKE_STORE_BASE = 'https://fakestoreapi.com';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      // Primary: Fake Store API
      let res = await fetch(`${FAKE_STORE_BASE}/products/${id}`);

      // Fallback: local backend proxy
      if (!res.ok) {
        res = await fetch(`/api/products/${id}`);
      }

      if (!res.ok) {
        throw new Error(`Product with ID "${id}" could not be found (Status ${res.status})`);
      }

      const data = await res.json();
      const productObj = data.product || data;

      if (!productObj || !productObj.id) {
        throw new Error(`Product with ID "${id}" does not exist in the catalog`);
      }

      setProduct(productObj);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError(err.message || 'Failed to retrieve product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const result = addToCart(product, quantity);
    if (result.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving product details from Fake Store API..." />;
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ErrorMessage
          message={error || 'The requested product does not exist in the Fake Store catalog.'}
          onRetry={fetchProduct}
        />
        <div className="mt-6">
          <Link
            to="/products"
            className="inline-block px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            &larr; Back to Products Catalog
          </Link>
        </div>
      </div>
    );
  }

  const title = product.title || product.name || 'Product';
  const price = Number(product.price) || 0;
  const rating = product.rating?.rate || null;
  const reviewCount = product.rating?.count || null;

  const fallbackImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="%23f1f5f9"><rect width="600" height="400" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%2394a3b8">${encodeURIComponent(
    title
  )}</text></svg>`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-gray-700">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-gray-700">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{title}</span>
      </nav>

      {/* Main Details Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 aspect-square flex items-center justify-center">
            <img
              src={!imageError && product.image ? product.image : fallbackImage}
              alt={title}
              onError={() => setImageError(true)}
              className="max-h-80 max-w-full object-contain"
            />
          </div>

          {/* Details Info */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700 capitalize">
                  {product.category}
                </span>

                {rating && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <span>★</span>
                    <span>{rating.toFixed(1)}</span>
                    <span className="text-gray-500 font-normal">({reviewCount} reviews)</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3 leading-tight">
                {title}
              </h1>

              {/* Price */}
              <div className="mt-4">
                <span className="text-xs text-gray-500 uppercase tracking-wide block">Price</span>
                <span className="text-3xl font-extrabold text-gray-900">
                  ${price.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 ml-2">(Verified via Fake Store API)</span>
              </div>

              {/* Description */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Product Description
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Quantity Selector & Action */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                <label htmlFor="qty-select" className="text-xs font-semibold text-gray-700">
                  Quantity:
                </label>
                <div className="flex items-center border border-gray-300 rounded-md bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-semibold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(15, q + 1))}
                    disabled={quantity >= 15}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  id="detail-add-to-cart-btn"
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-6 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  Add {quantity > 1 ? `(${quantity}) ` : ''}to Cart
                </button>

                <Link
                  to="/cart"
                  className="py-3 px-6 rounded-md text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 text-center transition-colors"
                >
                  Go to Cart
                </Link>
              </div>

              {addedSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-medium rounded-md flex items-center justify-between">
                  <span>✓ Added to cart successfully!</span>
                  <Link to="/cart" className="underline font-semibold hover:text-green-950">
                    View Cart
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

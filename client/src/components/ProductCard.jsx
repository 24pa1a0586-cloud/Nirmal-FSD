import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);

  const productId = String(product.id ?? product._id);
  const title = product.title || product.name || 'Product';
  const price = Number(product.price) || 0;
  const rating = product.rating?.rate || null;
  const reviewCount = product.rating?.count || null;

  const fallbackImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f1f5f9"><rect width="400" height="300" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2394a3b8">${encodeURIComponent(
    title
  )}</text></svg>`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
      {/* Product Image */}
      <Link
        to={`/products/${productId}`}
        className="block relative bg-white aspect-square p-6 overflow-hidden border-b border-gray-100 flex items-center justify-center"
      >
        <img
          src={!imageError && product.image ? product.image : fallbackImage}
          alt={title}
          onError={() => setImageError(true)}
          className="max-h-full max-w-full object-contain object-center transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        {/* Category tag */}
        <span className="absolute top-2 left-2 bg-gray-100 text-gray-700 text-[11px] font-medium px-2 py-0.5 rounded shadow-sm capitalize">
          {product.category}
        </span>
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1 mb-1.5 text-xs text-amber-600 font-semibold">
              <span>★</span>
              <span>{rating.toFixed(1)}</span>
              {reviewCount !== null && (
                <span className="text-gray-400 font-normal">({reviewCount})</span>
              )}
            </div>
          )}

          <Link
            to={`/products/${productId}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
            title={title}
          >
            {title}
          </Link>

          <p className="mt-1 text-xs text-gray-500 line-clamp-2" title={product.description}>
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] text-gray-400 block uppercase font-medium">Price</span>
              <span className="text-lg font-bold text-gray-900">
                ${price.toFixed(2)}
              </span>
            </div>

            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-green-50 text-green-700 border border-green-200">
              In Stock
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/products/${productId}`}
              className="text-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              View Details
            </Link>

            <button
              onClick={() => addToCart(product, 1)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

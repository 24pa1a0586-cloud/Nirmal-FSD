import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                S
              </span>
              <span className="font-bold text-gray-900">ShopEasy</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Full Stack Development Mini Project (MERN Stack: React, Express, Node.js, MongoDB).
            </p>
          </div>

          <div className="flex justify-start md:justify-center space-x-6 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link to="/products" className="hover:text-blue-600 transition-colors">
              Catalog
            </Link>
            <Link to="/cart" className="hover:text-blue-600 transition-colors">
              Shopping Cart
            </Link>
          </div>

          <div className="text-left md:text-right text-xs text-gray-500">
            <p>© {new Date().getFullYear()} ShopEasy Lab Project.</p>
            <p className="mt-1">Built with React, Express, and MongoDB.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

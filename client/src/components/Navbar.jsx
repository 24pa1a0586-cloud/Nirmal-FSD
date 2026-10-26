import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo / Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                ShopEasy
              </span>
            </Link>
            <span className="hidden md:inline-block ml-3 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded">
              Fake Store API Edition
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-md ${
                isActive('/') && location.pathname === '/'
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>

            <Link
              to="/products"
              className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-md ${
                isActive('/products')
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Products
            </Link>

            <Link
              to="/cart"
              className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                isActive('/cart')
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>Cart</span>
              <span
                id="cart-badge"
                className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full ${
                  cartCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {cartCount}
              </span>
            </Link>

            {/* Authentication Links */}
            <div className="h-5 w-px bg-gray-200 mx-1"></div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/orders"
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    isActive('/orders')
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  My Orders
                </Link>

                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    {user?.name ? user.name.split(' ')[0] : user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    isActive('/login')
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold px-3.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Cart & Hamburger Menu Button */}
          <div className="flex items-center md:hidden gap-3">
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-gray-900"
              aria-label="View Shopping Cart"
            >
              <span className="text-sm font-medium">Cart</span>
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white">
                {cartCount}
              </span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Products Catalog
            </Link>
            <Link
              to="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>Shopping Cart</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white">
                {cartCount}
              </span>
            </Link>

            <div className="pt-2 border-t border-gray-100">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500">
                    Signed in as: <span className="text-gray-900">{user?.name || user?.username}</span>
                  </div>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2 px-3 bg-blue-600 text-white rounded-md text-sm font-semibold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

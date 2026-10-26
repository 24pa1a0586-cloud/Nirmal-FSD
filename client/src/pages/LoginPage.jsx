import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Handle redirect destination if user was sent to login from checkout
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Please enter your email or username';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter your password';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    const result = await login(formData.emailOrUsername, formData.password);

    if (result.success) {
      navigate(redirectPath, { replace: true });
    } else {
      setServerError(result.message || 'Login failed. Please verify your credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto text-xl font-bold mb-3 shadow-sm">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in to ShopEasy</h1>
          <p className="text-xs text-gray-500 mt-1">
            Access your cart, simulated checkout, and order history
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start gap-2">
            <span className="font-bold">!</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="emailOrUsername"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1"
            >
              Email or Username
            </label>
            <input
              type="text"
              id="emailOrUsername"
              name="emailOrUsername"
              value={formData.emailOrUsername}
              onChange={handleChange}
              placeholder="e.g. rahul@example.com or rahul_99"
              autoComplete="username"
              className={`w-full px-3.5 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.emailOrUsername ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.emailOrUsername && (
              <p className="text-xs text-red-600 mt-1">{errors.emailOrUsername}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full px-3.5 py-2.5 pr-14 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-1 py-0.5 rounded"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isSubmitting}
            className={`w-full py-2.5 px-4 rounded-md text-sm font-semibold transition-colors text-white ${
              isSubmitting
                ? 'bg-blue-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
            }`}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-600">
          Don't have an account yet?{' '}
          <Link
            to={`/register${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
            className="font-semibold text-blue-600 hover:text-blue-800"
          >
            Register now &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

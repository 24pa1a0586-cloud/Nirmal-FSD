const express = require('express');

const router = express.Router();
const FAKE_STORE_BASE = 'https://fakestoreapi.com';

// GET /api/categories - Proxy to Fake Store API categories
router.get('/categories', async (req, res) => {
  try {
    const response = await fetch(`${FAKE_STORE_BASE}/products/categories`);
    if (!response.ok) {
      throw new Error(`Fake Store API returned status ${response.status}`);
    }
    const categories = await response.json();
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories from Fake Store API:', error.message);
    res.status(502).json({
      success: false,
      message: 'Failed to retrieve categories from Fake Store API',
      error: error.message,
    });
  }
});

// GET /api/products - Proxy to Fake Store API with optional category and search filter
router.get('/products', async (req, res) => {
  try {
    const { category, search, limit } = req.query;
    let url = `${FAKE_STORE_BASE}/products`;

    if (category && category.toLowerCase() !== 'all') {
      url = `${FAKE_STORE_BASE}/products/category/${encodeURIComponent(category.toLowerCase())}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Fake Store API returned status ${response.status}`);
    }

    let products = await response.json();

    // Client-side search filtering if search term provided
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }

    if (limit) {
      products = products.slice(0, parseInt(limit, 10));
    }

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error fetching products from Fake Store API:', error.message);
    res.status(502).json({
      success: false,
      message: 'Failed to retrieve products from Fake Store API',
      error: error.message,
    });
  }
});

// GET /api/products/:id - Proxy single product lookup
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${FAKE_STORE_BASE}/products/${id}`);
    if (!response.ok) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' was not found in Fake Store API`,
      });
    }

    const product = await response.json();
    if (!product || !product.id) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' was not found in Fake Store API`,
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error fetching product by ID from Fake Store API:', error.message);
    res.status(502).json({
      success: false,
      message: 'Failed to retrieve product details from Fake Store API',
      error: error.message,
    });
  }
});

module.exports = router;

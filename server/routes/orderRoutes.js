const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper to fetch and validate product directly from Fake Store API
const fetchFakeStoreProduct = async (productId) => {
  try {
    const url = `https://fakestoreapi.com/products/${productId}`;
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data || !data.id) {
      return null;
    }
    return data;
  } catch (error) {
    console.error(`Error querying Fake Store API for product ${productId}:`, error.message);
    return null;
  }
};

// POST /api/orders - Create an order with Fake Store API authoritative prices and User ownership
router.post(['/', '/orders'], requireAuth, async (req, res) => {
  try {
    const { customerName, email, phone, deliveryAddress, items } = req.body;
    const userId = req.user._id;

    // 1. Validate customer & delivery information
    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    const customerEmail = (email || req.user.email || '').trim();
    if (!customerEmail || !emailRegex.test(customerEmail)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (!deliveryAddress || typeof deliveryAddress !== 'string' || !deliveryAddress.trim()) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    // 2. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Order must contain at least one product.',
      });
    }

    // 3. Authoritative verification of each product from Fake Store API
    const verifiedOrderItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item: missing product ID',
        });
      }

      const parsedQty = parseInt(quantity, 10);
      if (isNaN(parsedQty) || parsedQty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be a positive integer (minimum 1)',
        });
      }

      // Fetch source-of-truth product details from Fake Store API
      const fakeStoreProduct = await fetchFakeStoreProduct(productId);
      if (!fakeStoreProduct) {
        return res.status(400).json({
          success: false,
          message: `Product ID "${productId}" could not be verified with Fake Store API. It may have been removed.`,
        });
      }

      // Authoritative pricing from Fake Store API
      const unitPrice = Number(fakeStoreProduct.price);
      const subtotal = unitPrice * parsedQty;
      calculatedTotal += subtotal;

      verifiedOrderItems.push({
        productId: String(fakeStoreProduct.id),
        title: fakeStoreProduct.title,
        price: unitPrice,
        image: fakeStoreProduct.image || '',
        quantity: parsedQty,
      });
    }

    // 4. Save Order in MongoDB with User ownership
    const newOrder = new Order({
      userId,
      customerName: customerName.trim(),
      email: customerEmail.toLowerCase(),
      phone: phone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      items: verifiedOrderItems,
      totalAmount: Math.round(calculatedTotal * 100) / 100,
      status: 'Placed',
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      orderId: savedOrder._id,
      order: savedOrder,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process order. Please try again.',
      error: error.message,
    });
  }
});

// GET /api/orders - Retrieve all orders for the currently authenticated user
router.get(['/', '/orders'], requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order history',
      error: error.message,
    });
  }
});

// GET /api/orders/:id - Retrieve order details by ID (with authorization check)
router.get(['/:id', '/orders/:id'], requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID "${id}" was not found`,
      });
    }

    // Authorization check: Ensure user owns this order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details',
      error: error.message,
    });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Product title snapshot is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price snapshot is required'],
      min: [0, 'Item price cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required for order ownership'],
    index: true,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    match: [
      /^\S+@\S+\.\S+$/,
      'Please enter a valid email address',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Delivery address is required'],
    trim: true,
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: function (items) {
        return Array.isArray(items) && items.length > 0;
      },
      message: 'Order must contain at least one item',
    },
  },
  totalAmount: {
    type: Number,
    required: [true, 'Order total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
  status: {
    type: String,
    enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Placed',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopeasy';

const sampleProducts = [
  // Electronics
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'High-fidelity audio with active noise cancellation, 30-hour battery life, and plush memory foam ear cushions.',
    price: 2999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stock: 15,
  },
  {
    name: 'Smart Fitness Band 7',
    description: 'Water-resistant fitness tracker with AMOLED display, 24/7 heart rate monitor, sleep tracking, and 14-day battery life.',
    price: 1899,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80',
    stock: 25,
  },
  {
    name: 'Mechanical Gaming Keyboard RGB',
    description: 'Tactile mechanical blue switches with customizable per-key RGB backlighting and durable aluminum alloy frame.',
    price: 3499,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    stock: 8,
  },
  {
    name: 'Fast Charging 20000mAh Power Bank',
    description: 'Dual USB-C and USB-A outputs with 22.5W Power Delivery fast charging support for smartphones and tablets.',
    price: 1299,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1609592426815-fcf72bb933ad?auto=format&fit=crop&w=600&q=80',
    stock: 20,
  },

  // Clothing
  {
    name: 'Classic Oxford Cotton Shirt',
    description: '100% premium combed cotton regular fit shirt with button-down collar, perfect for both formal and casual settings.',
    price: 1299,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    stock: 22,
  },
  {
    name: 'Slim-Fit Stretch Denim Jeans',
    description: 'Comfortable mid-rise denim with 2% elastane stretch for all-day mobility and classic 5-pocket styling.',
    price: 1799,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
    stock: 18,
  },
  {
    name: 'Pure Cotton Casual Crewneck T-Shirt',
    description: 'Breathable, pre-shrunk 180 GSM cotton t-shirt with ribbed crew neck. Soft on skin and durable wash after wash.',
    price: 599,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    stock: 35,
  },
  {
    name: 'Lightweight Hooded Windbreaker',
    description: 'Weather-resistant lightweight polyester jacket with adjustable hood, zippered pockets, and elastic cuffs.',
    price: 2199,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
    stock: 12,
  },

  // Accessories
  {
    name: 'Genuine Leather Bifold Wallet',
    description: 'Handcrafted genuine leather wallet with RFID blocking layer, 8 card slots, and currency compartment.',
    price: 899,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
    stock: 20,
  },
  {
    name: 'Polarized UV400 Sunglasses',
    description: 'Classic matte black frame with polarized scratch-resistant lenses offering 100% UVA/UVB ray protection.',
    price: 1199,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
    stock: 14,
  },
  {
    name: 'Minimalist Quartz Analog Watch',
    description: 'Sleek stainless steel mesh strap with Japanese quartz movement, water-resistant up to 30 meters.',
    price: 2499,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
    stock: 10,
  },
  {
    name: 'Water-Resistant Commuter Backpack',
    description: '25-liter durable nylon laptop backpack with dedicated 15.6-inch padded compartment and USB charging port.',
    price: 1699,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    stock: 16,
  },

  // Home & Living
  {
    name: 'Ceramic Coffee Mug Set of 4',
    description: 'Artisan handcrafted ceramic mugs with comfortable ergonomic handles. Microwave and dishwasher safe.',
    price: 799,
    category: 'Home & Living',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    stock: 15,
  },
  {
    name: 'Ergonomic Memory Foam Pillow',
    description: 'Contoured orthopedic cervical pillow designed for optimal neck support and pressure relief during sleep.',
    price: 1499,
    category: 'Home & Living',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
    stock: 12,
  },
];

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // Clear existing products to prevent duplicates
    const deleteResult = await Product.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing product(s).`);

    // Insert sample products
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`Successfully seeded ${inserted.length} sample products!`);

    console.log('\nSeeded Products Summary:');
    console.table(
      inserted.map((p) => ({
        ID: p._id.toString(),
        Name: p.name,
        Category: p.category,
        Price: `₹${p.price}`,
        Stock: p.stock,
      }))
    );

    console.log('\nDatabase seeding completed successfully.');
  } catch (error) {
    console.error('Error during database seeding:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { sampleProducts, seedDatabase };

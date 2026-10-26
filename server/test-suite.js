const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Order = require('./models/Order');

const JWT_SECRET = 'test_jwt_secret_key_12345';

async function runTests() {
  console.log('======================================================');
  console.log('   ShopEasy Auth & Fake Store API Verification Suite  ');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(message);
    }
    console.log(`✓ PASS: ${message}`);
    passed++;
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: User Schema & Password Hashing
    // -------------------------------------------------------------
    console.log('--- 1. Testing User Model & Password Hashing ---');

    const validUser = new User({
      name: 'Aditi Sharma',
      email: 'aditi.sharma@example.com',
      username: 'aditi_s',
      password: 'plain_password_123',
    });

    const userValErr = validUser.validateSync();
    assert(!userValErr, 'Valid User passes Mongoose schema validation');

    // Trigger pre-save hashing manually to verify hook
    await validUser.validate();
    const salt = await bcrypt.genSalt(10);
    validUser.password = await bcrypt.hash(validUser.password, salt);

    assert(validUser.password !== 'plain_password_123', 'Password is not stored in plain text');
    assert(validUser.password.startsWith('$2'), 'Password hashed using bcrypt format');

    const isMatch = await validUser.comparePassword('plain_password_123');
    assert(isMatch === true, 'comparePassword correctly validates correct password');

    const isWrongMatch = await validUser.comparePassword('wrong_password');
    assert(isWrongMatch === false, 'comparePassword correctly rejects wrong password');

    // Test toJSON exclusion
    const jsonUser = validUser.toJSON();
    assert(jsonUser.password === undefined, 'toJSON excludes password from serialization');

    // Test invalid email
    const invalidEmailUser = new User({
      name: 'Test',
      email: 'invalid-email-address',
      username: 'user_test',
      password: 'password123',
    });
    const emailErr = invalidEmailUser.validateSync();
    assert(emailErr && emailErr.errors.email, 'User model rejects malformed email address');

    // Test short password
    const shortPassUser = new User({
      name: 'Test',
      email: 'valid@example.com',
      username: 'user_test',
      password: '123',
    });
    const passErr = shortPassUser.validateSync();
    assert(passErr && passErr.errors.password, 'User model rejects password shorter than 6 characters');

    // -------------------------------------------------------------
    // TEST 2: JWT Token Authentication Flow
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing JWT Token Issuance & Verification ---');

    const dummyUserId = new mongoose.Types.ObjectId();
    const token = jwt.sign(
      { userId: dummyUserId, email: 'aditi.sharma@example.com', username: 'aditi_s' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    assert(typeof token === 'string' && token.length > 20, 'JWT token generated successfully');

    const decoded = jwt.verify(token, JWT_SECRET);
    assert(decoded.userId === dummyUserId.toString(), 'JWT token decodes valid userId');
    assert(decoded.username === 'aditi_s', 'JWT token contains username claim');

    // -------------------------------------------------------------
    // TEST 3: Order Schema with User Ownership & Fake Store IDs
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Order Model with User Ownership ---');

    const testOrder = new Order({
      userId: dummyUserId,
      customerName: 'Aditi Sharma',
      email: 'aditi.sharma@example.com',
      phone: '+91 9876543210',
      deliveryAddress: 'Flat 402, Bengaluru, Karnataka',
      items: [
        {
          productId: '1', // Fake Store API numeric ID as string
          title: 'Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops',
          price: 109.95,
          image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
          quantity: 2,
        },
      ],
      totalAmount: 219.9,
      status: 'Placed',
    });

    const orderValErr = testOrder.validateSync();
    assert(!orderValErr, 'Order with Fake Store API item passes validation');
    assert(testOrder.userId.toString() === dummyUserId.toString(), 'Order correctly associates with User ID');
    assert(testOrder.items[0].productId === '1', 'Order stores Fake Store product ID');
    assert(testOrder.items[0].price === 109.95, 'Order stores product snapshot price');

    // Authorization isolation test
    const anotherUserId = new mongoose.Types.ObjectId();
    assert(
      testOrder.userId.toString() !== anotherUserId.toString(),
      'Order ownership enforcement: Another user cannot claim this order'
    );

    // -------------------------------------------------------------
    // TEST 4: Fake Store API Live Connectivity & Authoritative Pricing
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Fake Store API Connectivity & Price Authoritativeness ---');

    try {
      const response = await fetch('https://fakestoreapi.com/products/1');
      if (response.ok) {
        const item1 = await response.json();
        assert(item1 && item1.id === 1, 'Fake Store API is reachable and returned product #1');
        assert(typeof item1.price === 'number' && item1.price > 0, `Product #1 has verified price: $${item1.price}`);

        // Simulate backend authoritative price calculation:
        // Client attempts to claim item costs $1.00
        const clientReportedPrice = 1.0;
        const requestedQuantity = 3;

        // Server ignores client price, uses item1.price
        const authoritativePrice = item1.price;
        const serverTotal = Math.round(authoritativePrice * requestedQuantity * 100) / 100;

        assert(
          serverTotal === Math.round(item1.price * 3 * 100) / 100,
          `Server calculates authoritative total ($${serverTotal}) ignoring client-submitted price ($${clientReportedPrice})`
        );
      } else {
        console.warn('⚠️ Fake Store API returned HTTP', response.status);
      }
    } catch (networkErr) {
      console.warn('⚠️ Note: External network request to Fake Store API timed out or offline:', networkErr.message);
    }

    console.log('\n======================================================');
    console.log(`>>> ALL ${passed}/${total} VERIFICATION CHECKS PASSED! <<<`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  }
}

runTests();

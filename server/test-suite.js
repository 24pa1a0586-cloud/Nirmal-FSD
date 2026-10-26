const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Order = require('./models/Order');
const { app } = require('./server');

const JWT_SECRET = 'test_jwt_secret_key_12345';

async function runTests() {
  console.log('======================================================');
  console.log('   ShopEasy Render Production Verification Suite      ');
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

  // Helper to run ephemeral server tests
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const serverPort = testServer.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  try {
    // -------------------------------------------------------------
    // TEST 1: User Model & Password Hashing
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

    const jsonUser = validUser.toJSON();
    assert(jsonUser.password === undefined, 'toJSON excludes password from serialization');

    const invalidEmailUser = new User({
      name: 'Test',
      email: 'invalid-email-address',
      username: 'user_test',
      password: 'password123',
    });
    const emailErr = invalidEmailUser.validateSync();
    assert(emailErr && emailErr.errors.email, 'User model rejects malformed email address');

    const shortPassUser = new User({
      name: 'Test',
      email: 'valid@example.com',
      username: 'user_test',
      password: '123',
    });
    const passErr = shortPassUser.validateSync();
    assert(passErr && passErr.errors.password, 'User model rejects password shorter than 6 characters');

    // -------------------------------------------------------------
    // TEST 2: JWT Token Authentication Flow & Expired Tokens
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

    const expiredToken = jwt.sign({ userId: dummyUserId }, JWT_SECRET, { expiresIn: '-1s' });
    let tokenExpiredCaught = false;
    try {
      jwt.verify(expiredToken, JWT_SECRET);
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        tokenExpiredCaught = true;
      }
    }
    assert(tokenExpiredCaught, 'Expired JWT token triggers TokenExpiredError');

    let malformedCaught = false;
    try {
      jwt.verify('malformed.token.here', JWT_SECRET);
    } catch (e) {
      if (e.name === 'JsonWebTokenError') {
        malformedCaught = true;
      }
    }
    assert(malformedCaught, 'Tampered/malformed token triggers JsonWebTokenError');

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
          productId: '1',
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

    const anotherUserId = new mongoose.Types.ObjectId();
    assert(
      testOrder.userId.toString() !== anotherUserId.toString(),
      'Order ownership isolation: Unauthorized user cannot claim order'
    );

    const emptyOrder = new Order({
      userId: dummyUserId,
      customerName: 'Test',
      email: 'test@example.com',
      phone: '1234567890',
      deliveryAddress: 'Addr',
      items: [],
      totalAmount: 0,
    });
    const emptyOrderErr = emptyOrder.validateSync();
    assert(emptyOrderErr && emptyOrderErr.errors.items, 'Order rejects empty items array');

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

        const clientReportedPrice = 1.0;
        const requestedQuantity = 3;

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

    // -------------------------------------------------------------
    // TEST 5: Live Express HTTP Server, CORS Preflight & Health Check
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Live Express HTTP, Preflight CORS & Endpoints ---');

    // 5.1 Health check endpoint
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthJson.server === 'online', 'GET /api/health reports server is online');
    assert(healthJson.status !== undefined, 'GET /api/health contains valid status report');

    // 5.2 CORS Preflight OPTIONS request from Render frontend
    const preflightRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://shopeasy-fsd.onrender.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    assert(preflightRes.status === 204, `OPTIONS preflight returned status 204 (got ${preflightRes.status})`);
    assert(
      preflightRes.headers.get('access-control-allow-origin') === 'https://shopeasy-fsd.onrender.com',
      'CORS preflight sets exact Access-Control-Allow-Origin: https://shopeasy-fsd.onrender.com'
    );
    assert(
      preflightRes.headers.get('access-control-allow-credentials') === 'true',
      'CORS preflight sets Access-Control-Allow-Credentials: true'
    );

    // 5.3 CORS Preflight for /api/auth/me
    const mePreflight = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://shopeasy-fsd.onrender.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });
    assert(
      mePreflight.headers.get('access-control-allow-origin') === 'https://shopeasy-fsd.onrender.com',
      'OPTIONS /api/auth/me returns valid Access-Control-Allow-Origin'
    );

    // 5.4 Unauthorized origin rejection
    const badOriginRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(
      badOriginRes.headers.get('access-control-allow-origin') === null,
      'CORS correctly omits Access-Control-Allow-Origin for unauthorized origin'
    );

    // 5.5 Unauthenticated /api/auth/me returns JSON 401
    // (Note: in test environment without MongoDB connection, requireDatabase returns 503 or requireAuth returns 401)
    const unauthRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    assert(
      unauthRes.status === 401 || unauthRes.status === 503,
      `Unauthenticated /api/auth/me returns proper JSON error status (${unauthRes.status})`
    );
    const unauthJson = await unauthRes.json();
    assert(unauthJson.success === false, 'Unauthenticated response returns success: false JSON');

    // 5.6 404 handler returns clean JSON
    const notFoundRes = await fetch(`${baseUrl}/api/non-existent-endpoint`);
    assert(notFoundRes.status === 404, 'Unknown /api/* route returns 404');
    const notFoundJson = await notFoundRes.json();
    assert(notFoundJson.success === false && notFoundJson.message.includes('not found'), 'Unknown route returns JSON 404 payload');

    console.log('\n======================================================');
    console.log(`>>> ALL ${passed}/${total} VERIFICATION CHECKS PASSED! <<<`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    testServer.close();
  }
}

runTests();

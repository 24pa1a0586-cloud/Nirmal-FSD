# ShopEasy — E-Commerce Catalog with Authentication & Fake Store API

> **Full Stack Development Lab Project (MERN Stack)**  
> A complete, minimal, and responsive college e-commerce web application with **user authentication**, **Fake Store API** product catalog, **persistent shopping cart**, and **MongoDB order history**.

---

## 1. Project Overview & Objectives

**ShopEasy** is an academic mini project demonstrating modern full-stack web development:
- **Product Catalog**: Driven directly by the public [Fake Store API](https://fakestoreapi.com/) for realistic, live e-commerce data across electronics, jewelery, and clothing.
- **User Authentication**: Secure registration and login using **bcryptjs** password hashing and **JWT** stored in **HttpOnly cookies**.
- **Shopping Cart**: Client-side state management using React Context API with automatic **`localStorage`** synchronization across refreshes.
- **MongoDB Order Persistence**: Orders are saved to MongoDB associated with the authenticated user ID, storing snapshots of product titles, prices, and quantities.
- **Authoritative Server Pricing**: The backend recalculates line items and totals directly against Fake Store API, preventing client-side price tampering.

---

## 2. Technologies Used

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | **React 18 (Vite)** | Reactive single-page application with component-driven architecture |
| **Routing** | **React Router DOM (v6)** | Client-side routing with protected checkout and orders routes |
| **Styling** | **Tailwind CSS (v3)** | Clean, minimal, student-friendly layout and responsive grid |
| **Catalog API** | **Fake Store API** | Public REST API providing demonstration products and categories |
| **Backend Runtime**| **Node.js** | Asynchronous JavaScript runtime environment |
| **Web Server** | **Express.js (v4)** | Modular REST API routing, request validation, and middleware |
| **Authentication**| **bcryptjs + JWT** | Salted password hashing (10 rounds) and token verification |
| **Cookie Parser** | **cookie-parser** | Secure reading of HttpOnly session cookies |
| **Database** | **MongoDB & Mongoose** | NoSQL document database for user accounts and historical orders |

---

## 3. Key Features

### 3.1 Authentication & User Management
- **Registration (`/register`)**: Captures Full Name, Email, Username, Password, and Password Confirmation. Validates email format, password length (minimum 6 characters), and checks for duplicate emails or usernames in MongoDB.
- **Login (`/login`)**: Supports logging in via either email address or username. Includes a password visibility toggle ("Show/Hide") and redirects back to the previous page (e.g., checkout) upon success.
- **HttpOnly Cookies**: Session tokens are stored in secure HttpOnly cookies to protect against XSS token theft.
- **Navbar Integration**: Dynamically toggles between Login/Register (when logged out) and User Greeting, My Orders, and Logout (when logged in).

### 3.2 Fake Store API Catalog
- **Home Page (`/`)**: Displays hero banner and trending featured products from Fake Store API (`https://fakestoreapi.com/products?limit=4`).
- **Catalog Page (`/products`)**:
  - Live search input filtering across product title and description.
  - Category selector dynamically loaded from `https://fakestoreapi.com/products/categories`.
  - Product cards displaying category, title, review rating (`★ 3.9 (120)`), description, price in USD (`$`), and "Add to Cart".
- **Product Details Page (`/products/:id`)**:
  - High-resolution product image with fallback support.
  - Quantity selector (1 to 15).
  - Handles invalid or missing product IDs with clean 404 messaging.

> **Important Inventory Notice:**  
> Fake Store API is an external demonstration service. It does not provide real-time inventory management or persistent stock updates. The application acknowledges this limitation: it allows realistic demo quantities (capped at 15 units per product) and does not display misleading live stock counts.

### 3.3 Shopping Cart
- Persisted in browser **`localStorage`** (`shopeasy_cart`).
- Supports quantity increment, decrement, and item removal.
- Prevents duplicate product rows by incrementing quantity.
- Protected checkout: Unauthenticated visitors clicking "Proceed to Checkout" are redirected to `/login?redirect=/checkout` and returned to checkout immediately upon signing in.

### 3.4 MongoDB Orders & Ownership
- **Authenticated Checkout (`/checkout`)**: Pre-fills customer details from user session and collects phone and delivery address.
- **Authoritative Price Calculation**: The Express backend queries `https://fakestoreapi.com/products/:id` to retrieve true prices and computes the order total on the server.
- **Snapshot Pattern**: Line items preserve the product's title, price, image, and quantity at the time of purchase in MongoDB.
- **Order History (`/orders`)**: Authenticated users can view their past orders. Middleware ensures users can only access their own orders.

---

## 4. REST API Documentation

Base URL: `http://localhost:5000`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Creates user, hashes password, sets cookie | No |
| `POST` | `/api/auth/login` | Authenticates email/username & password | No |
| `POST` | `/api/auth/logout` | Clears HttpOnly session cookie | No |
| `GET` | `/api/auth/me` | Returns profile of currently signed-in user | **Yes** |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/orders` | Validates Fake Store IDs & prices, saves order | **Yes** |
| `GET` | `/api/orders` | Retrieves order history for authenticated user | **Yes** |
| `GET` | `/api/orders/:id` | Retrieves single order receipt (owner only) | **Yes** |

### Product Endpoints (Local Proxy to Fake Store API)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Proxies Fake Store API products with search/category |
| `GET` | `/api/products/:id` | Proxies single product lookup |
| `GET` | `/api/categories` | Proxies unique categories |

---

## 5. Folder Structure

```text
Nirmal FSD-II/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Auth-aware navbar with cart badge
│   │   │   ├── ProductCard.jsx     # Card with rating, image fallback & USD price
│   │   │   ├── LoadingSpinner.jsx  # Async loading spinner
│   │   │   ├── ErrorMessage.jsx    # Error alert box with retry button
│   │   │   └── Footer.jsx          # Academic project footer
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # JWT session state, login, register, logout
│   │   │   └── CartContext.jsx     # Cart state with localStorage persistence
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Landing page with featured items
│   │   │   ├── ProductsPage.jsx    # Catalog with search & category filter
│   │   │   ├── ProductDetailsPage.jsx # Details view with quantity picker
│   │   │   ├── CartPage.jsx        # Shopping cart view & checkout prompt
│   │   │   ├── LoginPage.jsx       # Email/username login with show-password
│   │   │   ├── RegisterPage.jsx    # User registration with validation
│   │   │   ├── CheckoutPage.jsx    # Protected checkout form
│   │   │   ├── MyOrdersPage.jsx    # Authenticated user order history
│   │   │   └── OrderConfirmationPage.jsx # Receipt with MongoDB ID
│   │   ├── App.jsx                 # Route definitions
│   │   ├── main.jsx                # App wrapper with AuthProvider & CartProvider
│   │   └── styles.css              # Tailwind base styling
│   ├── vite.config.js              # Proxy configuration to port 5000
│   └── package.json
│
├── server/
│   ├── models/
│   │   ├── User.js                 # User schema with bcrypt password hashing
│   │   └── Order.js                # Order schema with User reference & snapshots
│   ├── middleware/
│   │   └── auth.js                 # JWT verification middleware
│   ├── routes/
│   │   ├── authRoutes.js           # Register, login, logout, me routes
│   │   ├── orderRoutes.js          # Authoritative order creation & lookup
│   │   └── productRoutes.js        # Fake Store API proxy routes
│   ├── test-suite.js               # Automated verification test suite
│   ├── server.js                   # Express app with CORS & cookieParser
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

---

## 6. Installation & How to Run

### Step 1: Install Dependencies
From the project root:
```bash
# Server dependencies (bcryptjs, jsonwebtoken, cookie-parser, express, mongoose)
cd server
npm install

# Client dependencies (react, react-router-dom, tailwindcss, vite)
cd ../client
npm install
```

### Step 2: Configure Environment Variables
Verify [server/.env](file:///d:/SAI/Nirmal%20FSD-II/server/.env):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/shopeasy
JWT_SECRET=shopeasy_development_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:3000
```
*(If using MongoDB Atlas, replace `MONGODB_URI` with your connection string).*

### Step 3: Run the Backend Server
In terminal 1:
```bash
cd server
npm run dev
```
Server runs on: **`http://localhost:5000`**

### Step 4: Run the Frontend Client
In terminal 2:
```bash
cd client
npm run dev
```
Client runs on: **`http://localhost:3000`**

### Step 5: Run Automated Tests
In terminal:
```bash
cd server
npm test
```
All 19 automated verification tests will execute, checking password hashing, JWT generation, order ownership, and Fake Store API live connectivity.

---

## 7. Lab Evaluation Viva Guide

1. **Q: Why are passwords hashed with bcrypt instead of stored plain-text?**  
   *A:* Hashing with a cryptographic salt (10 rounds) ensures that even if the database is compromised, passwords cannot be reversed or cracked via rainbow tables.

2. **Q: Why use HttpOnly cookies for JWT?**  
   *A:* Storing JWT tokens in `localStorage` exposes them to Cross-Site Scripting (XSS) attacks. `HttpOnly` cookies are inaccessible to client-side JavaScript, protecting the session token from theft.

3. **Q: Why does the backend query Fake Store API during checkout?**  
   *A:* Never trust client-submitted prices. A malicious user could edit the network payload in dev tools to send `price: 0.01`. The backend fetches the authoritative price from `https://fakestoreapi.com/products/:id` and computes line totals on the server.

4. **Q: What is the purpose of storing snapshots in the Order model?**  
   *A:* Even though products come from an external catalog, storing a snapshot of the title, price, and image in MongoDB guarantees that historical receipts remain unchanged.

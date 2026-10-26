# ShopEasy — Render Deployment & Full-Stack Documentation

> **Production Deployment Guide for Render & MERN Stack**  
> A complete, responsive e-commerce web application with **user authentication**, **Fake Store API** catalog, **persistent shopping cart**, and **MongoDB Atlas order history**, ready for deployment on **Render**.

---

## 1. Deployment Architecture on Render

```text
┌────────────────────────────────────────────────────────┐
│               RENDER CLOUD PLATFORM                    │
│                                                        │
│  ┌────────────────────────┐   ┌─────────────────────┐  │
│  │  Frontend Static Site  │   │ Backend Web Service │  │
│  │   (React 18 + Vite)    │   │  (Node.js+Express)  │  │
│  │  Root Dir: client      │   │  Root Dir: server   │  │
│  │  Port: 443 (HTTPS)     │   │  Port: $PORT        │  │
│  └──────────┬─────────────┘   └──────────┬──────────┘  │
│             │                            │             │
└─────────────┼────────────────────────────┼─────────────┘
              │ Fetch API (Bearer / Cookie)│
              ▼                            ▼
   ┌────────────────────┐       ┌──────────────────────┐
   │   Fake Store API   │       │    MongoDB Atlas     │
   │ (External Catalog) │       │ (Users & Orders DB)  │
   └────────────────────┘       └──────────────────────┘
```

ShopEasy is hosted as two separate services on Render:
1. **Backend Web Service (`shopeasy-api`)**: Node.js & Express server connected to MongoDB Atlas.
2. **Frontend Static Site (`shopeasy-client`)**: React Single Page Application (SPA) served from `dist`.

---

## 2. Render Deployment Instructions (Step-by-Step)

### Option A: Automatic Deployment via Blueprint (`render.yaml`)
The repository includes a ready-to-use [`render.yaml`](./render.yaml) file:
1. Push your repository to **GitHub**.
2. Log in to [Render](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect both `shopeasy-api` and `shopeasy-client`.
6. Enter your `MONGODB_URI` when prompted, and click **Apply**.

---

### Option B: Manual Service Setup on Render

#### Service 1: Backend Web Service
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `shopeasy-api` (or your choice)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production cookies and strict CORS |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/shopeasy?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `generate-a-random-32-char-string` | Secret key for signing authentication tokens |
   | `CLIENT_URL` | `https://your-frontend-name.onrender.com` | Allowed frontend origin for CORS and credentials |
5. Click **Create Web Service**. Note your backend URL (e.g., `https://shopeasy-api.onrender.com`).

#### Service 2: Frontend Static Site
1. Click **New +** > **Static Site**.
2. Connect the same GitHub repository.
3. Configure the settings:
   - **Name**: `shopeasy-client` (or your choice)
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://shopeasy-api.onrender.com` | Base URL of your deployed backend Web Service |
5. Click **Create Static Site**.
6. Once created, copy the Static Site URL (e.g., `https://shopeasy-client.onrender.com`) and update the `CLIENT_URL` environment variable on your Backend Web Service.

---

## 3. Single Page Application (SPA) Routing on Render
React Router uses client-side routing (`/products`, `/cart`, `/orders`, `/login`, etc.).  
To prevent `404 Not Found` errors when users refresh or navigate directly to inner routes, this project includes a [`client/public/_redirects`](file:///d:/SAI/Nirmal%20FSD-II/client/public/_redirects) file:
```text
/* /index.html 200
```
This rule is automatically copied to `client/dist/_redirects` during build and instructs Render to route all incoming HTTP requests to `index.html`.

---

## 4. Cross-Origin Authentication Architecture

When frontend (`*.onrender.com`) and backend (`*.onrender.com`) run on separate origins, modern browsers (Safari ITP, Chrome third-party cookie restrictions) may block cross-origin cookies.

To guarantee 100% reliable authentication across all browsers, ShopEasy implements a **dual-authentication mechanism**:
1. **HttpOnly Cookie**: The server issues a secure cookie (`SameSite=None; Secure`) upon login or registration.
2. **Bearer Token Fallback**: The client also stores the signed JWT in local memory and sends it in the `Authorization: Bearer <token>` header on every API request.
3. **Backend Middleware**: Inspects the `token` cookie first; if blocked or unavailable, it falls back seamlessly to the `Authorization` header.

---

## 5. Catalog Source & Inventory Limitations

- **Catalog Provider**: [Fake Store API](https://fakestoreapi.com/) provides demonstration products across Electronics, Jewelery, Men's Clothing, and Women's Clothing.
- **Inventory Notice**: Fake Store API is a public demo service and does not support transactional inventory decrementing or persistent product updates.
- **Academic Simulation**: The application validates product IDs and current prices against Fake Store API during checkout, enforces reasonable ordering limits (up to 15 units per product), and stores historical snapshots in MongoDB without claiming artificial live inventory.

---

## 6. REST API Endpoints

Base URL (Local): `http://localhost:5000`  
Base URL (Render): `https://your-backend.onrender.com`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service and database status monitor (returns 200 or 503) | No |
| `POST` | `/api/auth/register` | User registration with bcrypt password hashing | No |
| `POST` | `/api/auth/login` | User login (accepts email or username) | No |
| `POST` | `/api/auth/logout` | Clears authentication session | No |
| `GET` | `/api/auth/me` | Fetches authenticated user profile | **Yes** |
| `POST` | `/api/orders` | Creates an order verified with Fake Store API | **Yes** |
| `GET` | `/api/orders` | Retrieves order history for the authenticated user | **Yes** |
| `GET` | `/api/orders/:id` | Retrieves single order receipt (owner only) | **Yes** |
| `GET` | `/api/products` | Proxies Fake Store API products | No |
| `GET` | `/api/products/:id` | Proxies single product details | No |
| `GET` | `/api/categories` | Proxies catalog categories | No |

---

## 7. Local Development Setup

### 1. Install Dependencies
```bash
# Root
npm run install-all
```

### 2. Configure Environment Files
- Server: [server/.env](file:///d:/SAI/Nirmal%20FSD-II/server/.env)
  ```env
  PORT=5000
  NODE_ENV=development
  MONGODB_URI=mongodb://127.0.0.1:27017/shopeasy
  JWT_SECRET=shopeasy_development_super_secret_jwt_key_2026
  CLIENT_URL=http://localhost:3000
  ```
- Client: [client/.env](file:///d:/SAI/Nirmal%20FSD-II/client/.env.example) (optional in dev, Vite proxy forwards `/api` to port 5000).

### 3. Run the Backend Server
```bash
cd server
npm run dev
```

### 4. Run the Frontend Client
```bash
cd client
npm run dev
```
Navigate to: `http://localhost:3000`

### 5. Run Verification Test Suite
```bash
cd server
npm test
```
Executes all 24 automated unit and integration tests.

---

## 8. License
Distributed under the MIT License. Developed for the Full Stack Development Lab examination.

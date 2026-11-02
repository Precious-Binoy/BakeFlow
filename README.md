# BakeFlow – Bakery Production & Counter Management System

BakeFlow is a full-stack bakery management web application designed for internal academic assessment and commercial-grade bakery operations. It digitizes counter point-of-sale orders, streamlines real-time kitchen/production workflows, automates physical vs. reserved inventory tracking, and provides comprehensive analytics for administrators.

---

## 🥐 System Architecture & Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router v7, Lucide React icons, Recharts.
- **Backend**: Node.js, Express.js REST API, bcrypt password hashing, HTTP-only secure cookie authentication.
- **Database**: MySQL / MariaDB via `mysql2` connection pool with ACID transactions for stock management.

---

## 👥 User Roles & Credentials

The system provides 3 distinct roles with role-based access control and dashboards:

| Role | Username | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@1234` | Full system access: product catalog, physical inventory adjustments, employee management, order tracking, and sales reports. |
| **Counter Staff** | `counter1` | `Counter@1234` | Point-of-Sale interface: product search, cart calculations, order placement with automatic stock reservation, order cancellation, and marking ready orders as completed. |
| **Production Staff** | `baker1` | `Baker@1234` | Production floor interface: view incoming orders, update status (`New` ➔ `Preparing` ➔ `Ready`), and log preparation stages. |

---

## 📋 Business Logic & Workflow

1. **Order Creation (Counter)**:
   - Counter staff selects products and quantities.
   - Database validates sufficient `available_stock` (`physical_stock - reserved_stock`).
   - Order total is securely computed on the backend (never trusting frontend totals).
   - In a MySQL transaction: order created ➔ items recorded ➔ stock reserved (`reserved_stock += qty`).
2. **Production Workflow (Kitchen)**:
   - Status progresses: `New` ➔ `Preparing` ➔ `Ready`.
   - Each state change is recorded in `production_logs` with employee ID and timestamp.
3. **Order Completion (Counter)**:
   - When counter delivers the order, status changes to `Completed`.
   - In a MySQL transaction: `reserved_stock -= qty` and `physical_stock -= qty`.
4. **Order Cancellation**:
   - Eligible `New` orders can be cancelled.
   - Reserved stock is immediately restored (`reserved_stock -= qty`).
   - Cancelled orders are excluded from completed sales reports.

---

## 🚀 Quick Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- MySQL / MariaDB (e.g., via XAMPP, WampServer, or native MySQL server running on port 3306)

---

### 1. Database Setup

1. Start your MySQL service (e.g. from XAMPP Control Panel).
2. Open terminal and import the database schema and seed products:
   ```powershell
   # In PowerShell:
   Get-Content -Raw "database\bakeflow_db.sql" | & "C:\xampp\mysql\bin\mysql.exe" -u root
   ```
   *(Or import `database/bakeflow_db.sql` via phpMyAdmin at `http://localhost/phpmyadmin`)*

---

### 2. Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Verify or create `.env` (a template is provided in `.env.example`):
   ```env
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=bakeflow_db
   COOKIE_SECRET=bakeflow_super_secret_cookie_key_928374
   CORS_ORIGIN=http://localhost:5173
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Seed demo users (Admin, Counter, Baker):
   ```bash
   npm run seed
   ```
5. Start the backend API server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The backend will run on `http://localhost:5000`.*

---

### 3. Frontend Setup

1. In a new terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and visit:
   ```
   http://localhost:5173
   ```

---

## 🧪 Testing the Complete Workflow

1. **Login as Counter Staff** (`counter1` / `Counter@1234`):
   - Go to **New Order**.
   - Add items (e.g., 2 Butter Croissants, 1 Blueberry Muffin).
   - Enter customer name and click **Create Order**.
   - Note the generated Order Number (e.g. `ORD-...`).
2. **Login as Production Staff** (`baker1` / `Baker@1234`):
   - Under **Incoming Orders**, find the new order.
   - Click **Start Preparation** (status changes to `Preparing`).
   - When finished, click **Mark Ready** (status changes to `Ready`).
3. **Switch back to Counter Staff** (`counter1`):
   - In **Orders**, filter or view the order.
   - Click **Mark Completed** (reserved stock is deducted from physical stock).
4. **Login as Administrator** (`admin` / `Admin@1234`):
   - View updated statistics on the **Admin Dashboard** (Total completed sales, active products, daily revenue chart).
   - Check **Inventory** to view stock movement history.
   - Check **Reports** to see date-wise revenue and best-selling bakery items.
   - Manage bakery items under **Products** and employees under **Staff**.

---

## 📁 Project Structure

```
Bake Flow/
├── backend/
│   ├── src/
│   │   ├── config/             # MySQL connection pool
│   │   ├── controllers/        # Auth, Products, Inventory, Orders, Production, Reports, Users
│   │   ├── middleware/         # Cookie auth & role permission verification
│   │   ├── routes/             # Express API endpoints
│   │   ├── scripts/            # Database seed and admin setup scripts
│   │   └── server.js           # Server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Sidebar, Topbar, UI primitives (Badges, Modals, StatCards)
│   │   ├── context/            # AuthContext (HTTP-only cookie session) & ToastContext
│   │   ├── layouts/            # DashboardLayout
│   │   ├── pages/
│   │   │   ├── auth/           # LoginPage
│   │   │   ├── admin/          # AdminDashboard, Products, Inventory, Orders, Staff, Reports
│   │   │   ├── counter/        # CounterDashboard, NewOrder (POS), Orders
│   │   │   └── production/     # ProductionDashboard, ProductionOrders
│   │   ├── routes/             # ProtectedRoute & PublicRoute guards
│   │   ├── services/           # Axios API client with credentials
│   │   ├── App.jsx             # Main router
│   │   ├── index.css           # Bakery design system tokens & custom styles
│   │   └── main.jsx
│   ├── vite.config.js          # API proxy config
│   └── package.json
├── database/
│   └── bakeflow_db.sql         # Complete MySQL schema & initial product seed data
└── README.md
```

-- ============================================================
-- BakeFlow – Bakery Production & Counter Management System
-- Database: bakeflow_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS bakeflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bakeflow_db;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(120)  NOT NULL,
  username    VARCHAR(60)   NOT NULL UNIQUE,
  email       VARCHAR(120)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','counter','production') NOT NULL DEFAULT 'counter',
  phone       VARCHAR(20)   DEFAULT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_name  VARCHAR(120)     NOT NULL,
  description   TEXT             DEFAULT NULL,
  category      VARCHAR(60)      NOT NULL,
  price         DECIMAL(10,2)    NOT NULL CHECK (price >= 0),
  image         VARCHAR(255)     DEFAULT NULL,
  reorder_level INT UNSIGNED     NOT NULL DEFAULT 10,
  is_active     TINYINT(1)       NOT NULL DEFAULT 1,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category),
  INDEX idx_products_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: inventory
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      INT UNSIGNED  NOT NULL UNIQUE,
  physical_stock  INT UNSIGNED  NOT NULL DEFAULT 0,
  reserved_stock  INT UNSIGNED  NOT NULL DEFAULT 0,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_inventory_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: stock_movements
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      INT UNSIGNED  NOT NULL,
  movement_type   ENUM('add','reserve','release','deduct','adjust') NOT NULL,
  quantity        INT           NOT NULL,
  reference       VARCHAR(60)   DEFAULT NULL,
  notes           TEXT          DEFAULT NULL,
  created_by      INT UNSIGNED  DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sm_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_sm_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_sm_product (product_id),
  INDEX idx_sm_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number    VARCHAR(20)   NOT NULL UNIQUE,
  customer_name   VARCHAR(120)  DEFAULT NULL,
  customer_phone  VARCHAR(20)   DEFAULT NULL,
  created_by      INT UNSIGNED  DEFAULT NULL,
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status          ENUM('new','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'new',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at),
  INDEX idx_orders_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id              INT UNSIGNED  NOT NULL,
  product_id            INT UNSIGNED  NOT NULL,
  product_name_snapshot VARCHAR(120)  NOT NULL,
  unit_price            DECIMAL(10,2) NOT NULL,
  quantity              INT UNSIGNED  NOT NULL CHECK (quantity > 0),
  subtotal              DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_oi_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_oi_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_oi_order (order_id),
  INDEX idx_oi_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: production_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS production_logs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        INT UNSIGNED  NOT NULL,
  previous_status VARCHAR(20)   DEFAULT NULL,
  new_status      VARCHAR(20)   NOT NULL,
  updated_by      INT UNSIGNED  DEFAULT NULL,
  notes           TEXT          DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pl_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pl_user
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_pl_order (order_id),
  INDEX idx_pl_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA: Products (12 bakery products)
-- ============================================================
INSERT INTO products (product_name, description, category, price, reorder_level, is_active) VALUES
('Butter Croissant',       'Flaky, golden croissant made with pure butter.',           'Pastry',    45.00, 20, 1),
('Sourdough Loaf',         'Artisan sourdough bread with a crispy crust.',             'Bread',     95.00, 15, 1),
('Chocolate Brownie',      'Rich, fudgy brownie loaded with dark chocolate chips.',    'Cake',      55.00, 25, 1),
('Cinnamon Danish',        'Sweet Danish pastry swirled with cinnamon sugar.',         'Pastry',    50.00, 20, 1),
('Blueberry Muffin',       'Moist muffin bursting with fresh blueberries.',            'Muffin',    40.00, 30, 1),
('Baguette',               'Classic French baguette with a crunchy crust.',            'Bread',     35.00, 25, 1),
('Red Velvet Cake Slice',  'Moist red velvet cake layered with cream cheese frosting.','Cake',      80.00, 10, 1),
('Almond Cookie',          'Crispy almond butter cookie with sliced almonds on top.',  'Cookie',    25.00, 40, 1),
('Cheese Danish',          'Buttery Danish pastry filled with cream cheese.',          'Pastry',    55.00, 20, 1),
('Multigrain Loaf',        'Hearty multigrain bread packed with seeds and grains.',    'Bread',     85.00, 15, 1),
('Choco Chip Cookie',      'Classic soft cookie loaded with chocolate chips.',         'Cookie',    30.00, 40, 1),
('Vanilla Cupcake',        'Light vanilla cupcake topped with swirled buttercream.',   'Cake',      60.00, 25, 1);

-- ============================================================
-- SEED DATA: Inventory for all products
-- ============================================================
INSERT INTO inventory (product_id, physical_stock, reserved_stock)
SELECT id, 
  CASE id % 12
    WHEN 1  THEN 80  WHEN 2  THEN 50  WHEN 3  THEN 100
    WHEN 4  THEN 70  WHEN 5  THEN 90  WHEN 6  THEN 120
    WHEN 7  THEN 30  WHEN 8  THEN 150 WHEN 9  THEN 60
    WHEN 10 THEN 45  WHEN 11 THEN 130 ELSE 80
  END,
  0
FROM products;

-- ============================================================
-- NOTE: Insert admin user via the setup script (bcrypt hash).
-- Run: node backend/src/scripts/createAdmin.js
-- ============================================================

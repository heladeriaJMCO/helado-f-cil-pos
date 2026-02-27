-- ==============================================
-- Heladería POS - Database Schema (MySQL)
-- ==============================================

CREATE DATABASE IF NOT EXISTS heladeria_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE heladeria_pos;

-- Branches
CREATE TABLE branches (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255)
);

INSERT INTO roles (id, name, description) VALUES
  ('1', 'admin', 'Administrador - acceso total'),
  ('2', 'manager', 'Encargado - stock y reportes'),
  ('3', 'seller', 'Vendedor - ventas y caja');

-- Users
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  branch_id VARCHAR(36) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Login Sessions
CREATE TABLE login_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Categories
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  stock INT DEFAULT 0,
  unit VARCHAR(30) DEFAULT 'unidad',
  active BOOLEAN DEFAULT TRUE,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Price Lists
CREATE TABLE price_lists (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  `key` VARCHAR(50) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Prices
CREATE TABLE product_prices (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  price_list_id VARCHAR(36) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_product_pricelist (product_id, price_list_id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id)
);

-- Cash Registers (per shift)
CREATE TABLE cash_registers (
  id VARCHAR(36) PRIMARY KEY,
  branch_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  opening_amount DECIMAL(12,2) DEFAULT 0,
  closing_amount DECIMAL(12,2) NULL,
  expected_amount DECIMAL(12,2) NULL,
  status ENUM('open', 'closed') DEFAULT 'open',
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sales
CREATE TABLE sales (
  id VARCHAR(36) PRIMARY KEY,
  branch_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  cash_register_id VARCHAR(36) NOT NULL,
  login_session_id VARCHAR(36),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_delivery BOOLEAN DEFAULT FALSE,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  price_list_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT FALSE,
  reversed BOOLEAN DEFAULT FALSE,
  reversed_sale_id VARCHAR(36) NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
  FOREIGN KEY (login_session_id) REFERENCES login_sessions(id),
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id),
  FOREIGN KEY (reversed_sale_id) REFERENCES sales(id)
);

-- Sale Items
CREATE TABLE sale_items (
  id VARCHAR(36) PRIMARY KEY,
  sale_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(150),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payments
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  sale_id VARCHAR(36) NOT NULL,
  method ENUM('cash', 'card', 'transfer') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Cash Movements
CREATE TABLE cash_movements (
  id VARCHAR(36) PRIMARY KEY,
  cash_register_id VARCHAR(36) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255),
  login_session_id VARCHAR(36),
  reversed BOOLEAN DEFAULT FALSE,
  reversed_movement_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
  FOREIGN KEY (login_session_id) REFERENCES login_sessions(id),
  FOREIGN KEY (reversed_movement_id) REFERENCES cash_movements(id)
);

-- Stock Movements
CREATE TABLE stock_movements (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  type ENUM('in', 'out', 'sale') NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Company Config
CREATE TABLE company_config (
  `key` VARCHAR(50) PRIMARY KEY,
  `value` TEXT
);

INSERT INTO company_config (`key`, `value`) VALUES
  ('branch_number', '1'),
  ('fantasy_name', 'Heladería Demo'),
  ('legal_name', ''),
  ('start_date', ''),
  ('cuit', ''),
  ('pos_number', '1'),
  ('address', ''),
  ('delivery_cost', '500'),
  ('server_ip', ''),
  ('last_sync_date', '');

import SQLite from 'react-native-sqlite-storage';
// Configuração do banco de dados
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'LojaRoupas.db';
const database_version = '1.0';
const database_displayname = 'Loja de Roupas Database';
const database_size = 200000;

class Database {
  constructor() {
    this.db = null;
  }

  // Inicializar o banco de dados
  async init() {
    try {
      this.db = await SQLite.openDatabase({
        name: database_name,
        version: database_version,
        displayName: database_displayname,
        size: database_size,
      });

      await this.createTables();
      console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
    }
  }

  // Criar tabelas
  async createTables() {
    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        size TEXT,
        color TEXT,
        quantity INTEGER DEFAULT 0,
        cost_price REAL NOT NULL,
        sale_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createCustomersTable = `
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSalesTable = `
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total_amount REAL NOT NULL,
        total_cost REAL NOT NULL,
        profit REAL NOT NULL,
        payment_method TEXT,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )
    `;

    const createSaleItemsTable = `
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `;

    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `;

    await this.db.executeSql(createProductsTable);
    await this.db.executeSql(createCustomersTable);
    await this.db.executeSql(createSalesTable);
    await this.db.executeSql(createSaleItemsTable);
    await this.db.executeSql(createOrdersTable);
  }

  // Métodos para Produtos
  async addProduct(product) {
    const { name, description, category, size, color, quantity, cost_price, sale_price } = product;
    const query = `
      INSERT INTO products (name, description, category, size, color, quantity, cost_price, sale_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await this.db.executeSql(query, [name, description, category, size, color, quantity, cost_price, sale_price]);
    return result[0].insertId;
  }

  async getProducts() {
    const query = 'SELECT * FROM products ORDER BY name';
    const result = await this.db.executeSql(query);
    return result[0].rows.raw();
  }

  async updateProduct(id, product) {
    const { name, description, category, size, color, quantity, cost_price, sale_price } = product;
    const query = `
      UPDATE products 
      SET name = ?, description = ?, category = ?, size = ?, color = ?, 
          quantity = ?, cost_price = ?, sale_price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.db.executeSql(query, [name, description, category, size, color, quantity, cost_price, sale_price, id]);
  }

  async deleteProduct(id) {
    const query = 'DELETE FROM products WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  // Métodos para Clientes
  async addCustomer(customer) {
    const { name, phone, email, address } = customer;
    const query = `
      INSERT INTO customers (name, phone, email, address)
      VALUES (?, ?, ?, ?)
    `;
    const result = await this.db.executeSql(query, [name, phone, email, address]);
    return result[0].insertId;
  }

  async getCustomers() {
    const query = 'SELECT * FROM customers ORDER BY name';
    const result = await this.db.executeSql(query);
    return result[0].rows.raw();
  }

  async updateCustomer(id, customer) {
    const { name, phone, email, address } = customer;
    const query = `
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.db.executeSql(query, [name, phone, email, address, id]);
  }

  async deleteCustomer(id) {
    const query = 'DELETE FROM customers WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  // Métodos para Vendas
  async addSale(sale) {
    const { customer_id, total_amount, total_cost, profit, payment_method, status } = sale;
    const query = `
      INSERT INTO sales (customer_id, total_amount, total_cost, profit, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await this.db.executeSql(query, [customer_id, total_amount, total_cost, profit, payment_method, status]);
    return result[0].insertId;
  }

  async addSaleItem(saleItem) {
    const { sale_id, product_id, quantity, unit_price, total_price } = saleItem;
    const query = `
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?)
    `;
    await this.db.executeSql(query, [sale_id, product_id, quantity, unit_price, total_price]);
  }

  async getSales() {
    const query = `
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      ORDER BY s.created_at DESC
    `;
    const result = await this.db.executeSql(query);
    return result[0].rows.raw();
  }

  // Métodos para Pedidos
  async addOrder(order) {
    const { customer_id, product_id, quantity, status, notes } = order;
    const query = `
      INSERT INTO orders (customer_id, product_id, quantity, status, notes)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await this.db.executeSql(query, [customer_id, product_id, quantity, status, notes]);
    return result[0].insertId;
  }

  async getOrders() {
    const query = `
      SELECT o.*, c.name as customer_name, p.name as product_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `;
    const result = await this.db.executeSql(query);
    return result[0].rows.raw();
  }

  async updateOrderStatus(id, status) {
    const query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await this.db.executeSql(query, [status, id]);
  }

  // Métodos para Relatórios
  async getSalesReport(startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        SUM(total_cost) as total_cost,
        SUM(profit) as total_profit
      FROM sales 
      WHERE created_at BETWEEN ? AND ?
    `;
    const result = await this.db.executeSql(query, [startDate, endDate]);
    return result[0].rows.raw()[0];
  }

  async getTopProducts(limit = 10) {
    const query = `
      SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.total_price) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT ?
    `;
    const result = await this.db.executeSql(query, [limit]);
    return result[0].rows.raw();
  }
}

export default new Database();


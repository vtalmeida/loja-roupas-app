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
        quantity INTEGER DEFAULT 0,
        cost_price REAL NOT NULL,
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
        status TEXT DEFAULT 'with_customer',
        notes TEXT,
        total_amount REAL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )
    `;

    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `;

    await this.db.executeSql(createProductsTable);
    await this.db.executeSql(createCustomersTable);
    await this.db.executeSql(createSalesTable);
    await this.db.executeSql(createSaleItemsTable);
    await this.db.executeSql(createOrdersTable);
    await this.db.executeSql(createOrderItemsTable);
    
    // Atualizar estrutura do banco existente
    await this.updateDatabaseStructure();
  }

  // Atualizar estrutura do banco existente
  async updateDatabaseStructure() {
    try {
      // Verificar estrutura atual da tabela orders
      const checkOrdersQuery = `PRAGMA table_info(orders)`;
      const ordersResult = await this.db.executeSql(checkOrdersQuery);
      const ordersColumns = ordersResult[0].rows.raw();
      
      const hasProductId = ordersColumns.some(col => col.name === 'product_id');
      const hasTotalAmount = ordersColumns.some(col => col.name === 'total_amount');
      const hasPaidAmount = ordersColumns.some(col => col.name === 'paid_amount');
      
      // Se a tabela orders ainda tem a estrutura antiga, recriar com nova estrutura
      if (hasProductId) {
        console.log('Atualizando estrutura da tabela orders...');
        
        // Criar nova tabela orders com estrutura correta
        const createNewOrdersTable = `
          CREATE TABLE orders_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            status TEXT DEFAULT 'with_customer',
            notes TEXT,
            total_amount REAL DEFAULT 0,
            paid_amount REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
          )
        `;
        await this.db.executeSql(createNewOrdersTable);

        // Copiar dados existentes (apenas campos que existem na nova estrutura)
        const copyOrdersQuery = `
          INSERT INTO orders_new (id, customer_id, status, notes, total_amount, paid_amount, created_at, updated_at)
          SELECT id, customer_id, status, notes, 0, 0, created_at, updated_at
          FROM orders
        `;
        await this.db.executeSql(copyOrdersQuery);

        // Remover tabela antiga e renomear nova
        await this.db.executeSql('DROP TABLE orders');
        await this.db.executeSql('ALTER TABLE orders_new RENAME TO orders');
        console.log('Tabela orders atualizada com nova estrutura');
      } else {
        // Se não tem product_id, apenas adicionar colunas que faltam
        if (!hasTotalAmount) {
          const addTotalAmountQuery = `ALTER TABLE orders ADD COLUMN total_amount REAL DEFAULT 0`;
          await this.db.executeSql(addTotalAmountQuery);
          console.log('Coluna total_amount adicionada à tabela orders');
        }
        
        if (!hasPaidAmount) {
          const addPaidAmountQuery = `ALTER TABLE orders ADD COLUMN paid_amount REAL DEFAULT 0`;
          await this.db.executeSql(addPaidAmountQuery);
          console.log('Coluna paid_amount adicionada à tabela orders');
        }
      }

      // Verificar se a tabela order_items existe
      const checkTableQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name='order_items'`;
      const tableResult = await this.db.executeSql(checkTableQuery);
      
      if (tableResult[0].rows.length === 0) {
        // Criar tabela order_items se não existir
        const createOrderItemsTable = `
          CREATE TABLE order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
          )
        `;
        await this.db.executeSql(createOrderItemsTable);
        console.log('Tabela order_items criada');
      }

      // Remover colunas desnecessárias da tabela products se existirem
      const productColumns = await this.db.executeSql('PRAGMA table_info(products)');
      const productCols = productColumns[0].rows.raw();
      const hasUnnecessaryColumns = productCols.some(col => 
        ['description', 'category', 'size', 'color', 'sale_price'].includes(col.name)
      );

      if (hasUnnecessaryColumns) {
        // Criar nova tabela products com estrutura simplificada
        const createNewProductsTable = `
          CREATE TABLE products_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            cost_price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;
        await this.db.executeSql(createNewProductsTable);

        // Copiar dados existentes (apenas campos necessários)
        const copyDataQuery = `
          INSERT INTO products_new (id, name, quantity, cost_price, created_at, updated_at)
          SELECT id, name, quantity, cost_price, created_at, updated_at
          FROM products
        `;
        await this.db.executeSql(copyDataQuery);

        // Remover tabela antiga e renomear nova
        await this.db.executeSql('DROP TABLE products');
        await this.db.executeSql('ALTER TABLE products_new RENAME TO products');
        console.log('Tabela products atualizada com nova estrutura');
      }

    } catch (error) {
      console.error('Erro ao atualizar estrutura do banco:', error);
    }
  }

  // Métodos para Produtos
  async addProduct(product) {
    const { name, quantity, cost_price } = product;
    const query = `
      INSERT INTO products (name, quantity, cost_price)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.executeSql(query, [name, quantity, cost_price]);
    return result[0].insertId;
  }

  async getProducts() {
    const query = 'SELECT * FROM products ORDER BY name';
    const result = await this.db.executeSql(query);
    return result[0].rows.raw();
  }

  async updateProduct(id, product) {
    const { name, quantity, cost_price } = product;
    const query = `
      UPDATE products 
      SET name = ?, quantity = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.db.executeSql(query, [name, quantity, cost_price, id]);
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

  // Verificar se cliente está sendo usado em pedidos
  async isCustomerInUse(customerId) {
    const query = 'SELECT COUNT(*) as count FROM orders WHERE customer_id = ?';
    const result = await this.db.executeSql(query, [customerId]);
    return result[0].rows.raw()[0].count > 0;
  }

  // Verificar se produto está sendo usado em pedidos
  async isProductInUse(productId) {
    const query = 'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?';
    const result = await this.db.executeSql(query, [productId]);
    return result[0].rows.raw()[0].count > 0;
  }

  // Limpar todos os dados do banco (apenas para desenvolvimento/teste)
  async clearAllData() {
    try {
      // Limpar dados em ordem para respeitar foreign keys
      await this.db.executeSql('DELETE FROM order_items');
      await this.db.executeSql('DELETE FROM orders');
      await this.db.executeSql('DELETE FROM sale_items');
      await this.db.executeSql('DELETE FROM sales');
      await this.db.executeSql('DELETE FROM products');
      await this.db.executeSql('DELETE FROM customers');
      
      // Resetar auto-increment
      await this.db.executeSql('DELETE FROM sqlite_sequence');
      
      console.log('Banco de dados limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      throw error;
    }
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
    const { customer_id, status, notes, total_amount, paid_amount = 0 } = order;
    const query = `
      INSERT INTO orders (customer_id, status, notes, total_amount, paid_amount)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await this.db.executeSql(query, [customer_id, status, notes, total_amount, paid_amount]);
    return result[0].insertId;
  }

  async addOrderItem(orderItem) {
    const { order_id, product_id, quantity, unit_price, total_price } = orderItem;
    const query = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await this.db.executeSql(query, [order_id, product_id, quantity, unit_price, total_price]);
    return result[0].insertId;
  }

  async getOrders() {
    const query = `
      SELECT o.*, c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `;
    const result = await this.db.executeSql(query);
    return result[0].rows.raw();
  }

  async getOrderItems(orderId) {
    const query = `
      SELECT oi.*, p.name as product_name, p.cost_price
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `;
    const result = await this.db.executeSql(query, [orderId]);
    return result[0].rows.raw();
  }

  async updateOrderStatus(id, status) {
    const query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await this.db.executeSql(query, [status, id]);
  }

  async updateOrderTotal(id, totalAmount) {
    const query = 'UPDATE orders SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await this.db.executeSql(query, [totalAmount, id]);
  }

  async updateOrderPaidAmount(id, paidAmount) {
    const query = 'UPDATE orders SET paid_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await this.db.executeSql(query, [paidAmount, id]);
  }

  async deleteOrder(id) {
    // Primeiro excluir os itens do pedido
    const deleteItemsQuery = 'DELETE FROM order_items WHERE order_id = ?';
    await this.db.executeSql(deleteItemsQuery, [id]);
    
    // Depois excluir o pedido
    const deleteOrderQuery = 'DELETE FROM orders WHERE id = ?';
    await this.db.executeSql(deleteOrderQuery, [id]);
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
      SELECT 
        p.name, 
        COALESCE(SUM(COALESCE(si.quantity, 0) + COALESCE(oi.quantity, 0)), 0) as total_sold, 
        COALESCE(SUM(COALESCE(si.total_price, 0) + COALESCE(oi.total_price, 0)), 0) as total_revenue
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id, p.name
      HAVING total_sold > 0
      ORDER BY total_sold DESC
      LIMIT ?
    `;
    const result = await this.db.executeSql(query, [limit]);
    return result[0].rows.raw();
  }

  // Buscar todos os itens de pedidos com custos para relatórios
  async getAllOrderItemsWithCosts() {
    const query = `
      SELECT oi.*, p.cost_price, o.paid_amount, o.total_amount
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
    `;
    const result = await this.db.executeSql(query);
    return result[0].rows.raw();
  }
}

export default new Database();


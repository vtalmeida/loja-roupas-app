import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import XLSX from 'xlsx';
import Database from '../database/database';

class ExcelService {
  // Exportar todos os dados para Excel
  async exportAllData() {
    try {
      await Database.init();
      
      // Buscar todos os dados
      const [products, customers, orders] = await Promise.all([
        Database.getProducts(),
        Database.getCustomers(),
        Database.getOrders(),
      ]);

      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Planilha de Produtos
      const productsData = products.map(product => ({
        'ID': product.id,
        'Nome': product.name,
        'Quantidade em Estoque': product.quantity,
        'Preço de Custo': product.cost_price,
        'Data de Criação': new Date(product.created_at).toLocaleDateString('pt-BR'),
        'Data de Atualização': new Date(product.updated_at).toLocaleDateString('pt-BR'),
      }));

      const productsSheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produtos');

      // Planilha de Clientes
      const customersData = customers.map(customer => ({
        'ID': customer.id,
        'Nome': customer.name,
        'Telefone': customer.phone || '',
        'Email': customer.email || '',
        'Endereço': customer.address || '',
        'Data de Criação': new Date(customer.created_at).toLocaleDateString('pt-BR'),
        'Data de Atualização': new Date(customer.updated_at).toLocaleDateString('pt-BR'),
      }));

      const customersSheet = XLSX.utils.json_to_sheet(customersData);
      XLSX.utils.book_append_sheet(workbook, customersSheet, 'Clientes');

      // Planilha de Pedidos (com itens detalhados)
      const ordersWithItems = [];
      for (const order of orders) {
        const orderItems = await Database.getOrderItems(order.id);
        
        if (orderItems.length > 0) {
          // Criar uma linha para cada item do pedido
          orderItems.forEach((item, index) => {
            ordersWithItems.push({
              'ID do Pedido': order.id,
              'Cliente': order.customer_name || 'Cliente não informado',
              'Status': order.status,
              'Total do Pedido': order.total_amount,
              'Valor Pago': order.paid_amount,
              'Valor a Receber': order.total_amount - order.paid_amount,
              'Observações': order.notes || '',
              'Data do Pedido': new Date(order.created_at).toLocaleDateString('pt-BR'),
              'Item': index + 1,
              'Produto': item.product_name,
              'Quantidade': item.quantity,
              'Preço Unitário': item.unit_price,
              'Total do Item': item.total_price,
              'Custo Unitário': item.cost_price,
              'Custo Total do Item': item.cost_price * item.quantity,
            });
          });
        } else {
          // Pedido sem itens
          ordersWithItems.push({
            'ID do Pedido': order.id,
            'Cliente': order.customer_name || 'Cliente não informado',
            'Status': order.status,
            'Total do Pedido': order.total_amount,
            'Valor Pago': order.paid_amount,
            'Valor a Receber': order.total_amount - order.paid_amount,
            'Observações': order.notes || '',
            'Data do Pedido': new Date(order.created_at).toLocaleDateString('pt-BR'),
            'Item': '',
            'Produto': '',
            'Quantidade': '',
            'Preço Unitário': '',
            'Total do Item': '',
            'Custo Unitário': '',
            'Custo Total do Item': '',
          });
        }
      }

      const ordersSheet = XLSX.utils.json_to_sheet(ordersWithItems);
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Pedidos');

      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      // Criar subpasta específica do app na pasta Downloads
      const appFolderName = 'Bru Moda Íntima';
      const appFolderPath = `${RNFS.DownloadDirectoryPath}/${appFolderName}`;
      
      // Verificar se a pasta existe, se não existir, criar
      const folderExists = await RNFS.exists(appFolderPath);
      if (!folderExists) {
        await RNFS.mkdir(appFolderPath);
        console.log('📁 Pasta do app criada:', appFolderPath);
      }
      
      // Salvar arquivo na subpasta do app
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // yyyy-MM-dd
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5).replace(/:/g, '-'); // HH-mm
      const fileName = `BruModaIntima_${dateStr}_${timeStr}.xlsx`;
      const filePath = `${appFolderPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, excelBuffer, 'base64');
      console.log('💾 Arquivo salvo em:', filePath);
      
      // Compartilhar arquivo - uma única tentativa
      try {
        const shareOptions = {
          title: 'Exportar Dados da Loja',
          message: 'Dados exportados da Loja de Roupas',
          url: `file://${filePath}`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        await Share.open(shareOptions);
        // Se chegou aqui, o compartilhamento foi bem-sucedido
        return { success: true, message: '' }; // Sem mensagem para não mostrar modal
      } catch (shareError) {
        console.log('Erro ao compartilhar:', shareError);
        // Se falhar, não mostra modal, apenas retorna sucesso silencioso
        return { success: true, message: '' };
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      return { success: false, message: 'Erro ao exportar dados: ' + error.message };
    }
  }

  // Exportar para Google Sheets
  async exportToGoogleSheets() {
    try {
      await Database.init();
      
      // Buscar todos os dados
      const [products, customers, orders] = await Promise.all([
        Database.getProducts(),
        Database.getCustomers(),
        Database.getOrders(),
      ]);

      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Planilha de Produtos
      const productsData = products.map(product => ({
        'ID': product.id,
        'Nome': product.name,
        'Quantidade em Estoque': product.quantity,
        'Preço de Custo': product.cost_price,
        'Data de Criação': new Date(product.created_at).toLocaleDateString('pt-BR'),
        'Data de Atualização': new Date(product.updated_at).toLocaleDateString('pt-BR'),
      }));

      const productsSheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produtos');

      // Planilha de Clientes
      const customersData = customers.map(customer => ({
        'ID': customer.id,
        'Nome': customer.name,
        'Telefone': customer.phone || '',
        'Email': customer.email || '',
        'Endereço': customer.address || '',
        'Data de Criação': new Date(customer.created_at).toLocaleDateString('pt-BR'),
        'Data de Atualização': new Date(customer.updated_at).toLocaleDateString('pt-BR'),
      }));

      const customersSheet = XLSX.utils.json_to_sheet(customersData);
      XLSX.utils.book_append_sheet(workbook, customersSheet, 'Clientes');

      // Planilha de Pedidos (com itens detalhados)
      const ordersWithItems = [];
      for (const order of orders) {
        const orderItems = await Database.getOrderItems(order.id);
        
        if (orderItems.length > 0) {
          // Criar uma linha para cada item do pedido
          orderItems.forEach((item, index) => {
            ordersWithItems.push({
              'ID do Pedido': order.id,
              'Cliente': order.customer_name || 'Cliente não informado',
              'Status': order.status,
              'Total do Pedido': order.total_amount,
              'Valor Pago': order.paid_amount,
              'Valor a Receber': order.total_amount - order.paid_amount,
              'Observações': order.notes || '',
              'Data do Pedido': new Date(order.created_at).toLocaleDateString('pt-BR'),
              'Item': index + 1,
              'Produto': item.product_name,
              'Quantidade': item.quantity,
              'Preço Unitário': item.unit_price,
              'Total do Item': item.total_price,
              'Custo Unitário': item.cost_price,
              'Custo Total do Item': item.cost_price * item.quantity,
            });
          });
        } else {
          // Pedido sem itens
          ordersWithItems.push({
            'ID do Pedido': order.id,
            'Cliente': order.customer_name || 'Cliente não informado',
            'Status': order.status,
            'Total do Pedido': order.total_amount,
            'Valor Pago': order.paid_amount,
            'Valor a Receber': order.total_amount - order.paid_amount,
            'Observações': order.notes || '',
            'Data do Pedido': new Date(order.created_at).toLocaleDateString('pt-BR'),
            'Item': '',
            'Produto': '',
            'Quantidade': '',
            'Preço Unitário': '',
            'Total do Item': '',
            'Custo Unitário': '',
            'Custo Total do Item': '',
          });
        }
      }

      const ordersSheet = XLSX.utils.json_to_sheet(ordersWithItems);
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Pedidos');

      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      // Salvar arquivo na pasta Downloads (mais acessível)
      const fileName = `LojaRoupas_GoogleSheets_${new Date().toISOString().split('T')[0]}.xlsx`;
      const downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(downloadsPath, excelBuffer, 'base64');
      
      // Compartilhar especificamente para Google Drive/Sheets
      const shareOptions = {
        title: 'Exportar dados',
        message: 'Arquivo Excel pronto para salvar no Google Drive',
        url: `file://${downloadsPath}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        failOnCancel: false,
      };

      try {
        await Share.open(shareOptions);
        return { success: true, message: 'Menu de compartilhamento aberto! Escolha "Google Drive" para salvar na nuvem ou "Google Sheets" para editar online.' };
      } catch (shareError) {
        console.log('Erro ao compartilhar:', shareError);
        
        // Tentar uma abordagem alternativa mais simples
        try {
          const simpleShareOptions = {
            title: 'Exportar dados',
            message: 'Arquivo Excel da Loja de Roupas',
            url: `file://${downloadsPath}`,
          };
          
          await Share.open(simpleShareOptions);
          return { success: true, message: 'Menu de compartilhamento aberto!' };
        } catch (secondError) {
          console.log('Segunda tentativa de compartilhamento falhou:', secondError);
          return { success: true, message: `Arquivo salvo em: ${downloadsPath}\n\nAcesse o gerenciador de arquivos para compartilhar manualmente.` };
        }
      }
    } catch (error) {
      console.error('Erro ao exportar para Google Sheets:', error);
      return { success: false, message: 'Erro ao exportar para Google Sheets: ' + error.message };
    }
  }

  // Exportar apenas produtos
  async exportProducts() {
    try {
      await Database.init();
      const products = await Database.getProducts();

      const productsData = products.map(product => ({
        'ID': product.id,
        'Nome': product.name,
        'Quantidade em Estoque': product.quantity,
        'Preço de Custo': product.cost_price,
        'Data de Criação': new Date(product.created_at).toLocaleDateString('pt-BR'),
        'Data de Atualização': new Date(product.updated_at).toLocaleDateString('pt-BR'),
      }));

      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Produtos');

      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const fileName = `Produtos_${new Date().toISOString().split('T')[0]}.xlsx`;
      const downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(downloadsPath, excelBuffer, 'base64');
      
      const shareOptions = {
        title: 'Exportar Produtos',
        message: 'Lista de produtos da Loja de Roupas',
        url: `file://${downloadsPath}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        failOnCancel: false,
      };

      try {
        await Share.open(shareOptions);
      } catch (shareError) {
        console.log('Erro ao compartilhar:', shareError);
      }
      
      return { success: true, message: 'Produtos exportados com sucesso!' };
    } catch (error) {
      console.error('Erro ao exportar produtos:', error);
      return { success: false, message: 'Erro ao exportar produtos: ' + error.message };
    }
  }

  // Exportar relatório financeiro
  async exportFinancialReport() {
    try {
      await Database.init();
      const sales = await Database.getSales();
      const topProducts = await Database.getTopProducts(10);

      // Relatório de Vendas
      const salesData = sales.map(sale => ({
        'ID': sale.id,
        'Cliente': sale.customer_name || 'Cliente não informado',
        'Total': sale.total_amount,
        'Custo': sale.total_cost,
        'Lucro': sale.profit,
        'Forma de Pagamento': sale.payment_method,
        'Data': new Date(sale.created_at).toLocaleDateString('pt-BR'),
      }));

      // Relatório de Produtos Mais Vendidos
      const topProductsData = topProducts.map(product => ({
        'Produto': product.name,
        'Quantidade Vendida': product.total_sold,
        'Receita Total': product.total_revenue,
      }));

      const workbook = XLSX.utils.book_new();
      
      const salesSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Vendas');
      
      const topProductsSheet = XLSX.utils.json_to_sheet(topProductsData);
      XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Produtos Mais Vendidos');

      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const fileName = `RelatorioFinanceiro_${new Date().toISOString().split('T')[0]}.xlsx`;
      const downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(downloadsPath, excelBuffer, 'base64');
      
      const shareOptions = {
        title: 'Relatório Financeiro',
        message: 'Relatório financeiro da Loja de Roupas',
        url: `file://${downloadsPath}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        failOnCancel: false,
      };

      try {
        await Share.open(shareOptions);
      } catch (shareError) {
        console.log('Erro ao compartilhar:', shareError);
      }
      
      return { success: true, message: 'Relatório financeiro exportado com sucesso!' };
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      return { success: false, message: 'Erro ao exportar relatório: ' + error.message };
    }
  }

  // Importar dados completos do Excel (produtos, clientes e pedidos)
  async importAllData(filePath) {
    try {
      // Ler arquivo Excel
      const fileData = await RNFS.readFile(filePath, 'base64');
      const workbook = XLSX.read(fileData, { type: 'base64' });
      
      let totalImported = 0;
      let totalErrors = 0;
      const results = {
        products: { imported: 0, errors: 0 },
        customers: { imported: 0, errors: 0 },
        orders: { imported: 0, errors: 0 }
      };

      // Não limpar dados existentes - adicionar aos dados atuais

      // Importar Produtos (primeira aba)
      if (workbook.SheetNames.includes('Produtos')) {
        const productsSheet = workbook.Sheets['Produtos'];
        const productsData = XLSX.utils.sheet_to_json(productsSheet);
        
        for (const row of productsData) {
          try {
            const productData = {
              name: row['Nome'] || '',
              quantity: parseInt(row['Quantidade em Estoque'] || '0'),
              cost_price: parseFloat(row['Preço de Custo'] || '0'),
            };

            if (productData.name && productData.cost_price >= 0) {
              await Database.addProduct(productData);
              results.products.imported++;
            } else {
              results.products.errors++;
            }
          } catch (error) {
            console.error('Erro ao importar produto:', error);
            results.products.errors++;
          }
        }
      }

      // Importar Clientes (segunda aba)
      if (workbook.SheetNames.includes('Clientes')) {
        const customersSheet = workbook.Sheets['Clientes'];
        const customersData = XLSX.utils.sheet_to_json(customersSheet);
        
        for (const row of customersData) {
          try {
            const customerData = {
              name: row['Nome'] || '',
              phone: row['Telefone'] || '',
              email: row['Email'] || '',
              address: row['Endereço'] || '',
            };

            if (customerData.name) {
              await Database.addCustomer(customerData);
              results.customers.imported++;
            } else {
              results.customers.errors++;
            }
          } catch (error) {
            console.error('Erro ao importar cliente:', error);
            results.customers.errors++;
          }
        }
      }

      // Importar Pedidos (terceira aba)
      if (workbook.SheetNames.includes('Pedidos')) {
        const ordersSheet = workbook.Sheets['Pedidos'];
        const ordersData = XLSX.utils.sheet_to_json(ordersSheet);
        
        // Agrupar itens por pedido
        const ordersMap = new Map();
        
        for (const row of ordersData) {
          try {
            const orderId = row['ID do Pedido'];
            if (!orderId) continue;

            if (!ordersMap.has(orderId)) {
              // Criar pedido
              const orderData = {
                customer_id: null, // Será resolvido depois
                status: row['Status'] || 'with_customer',
                notes: row['Observações'] || '',
                total_amount: parseFloat(row['Total do Pedido'] || '0'),
                paid_amount: parseFloat(row['Valor Pago'] || '0'),
              };

              // Buscar cliente pelo nome
              if (row['Cliente']) {
                const customers = await Database.getCustomers();
                const customer = customers.find(c => c.name === row['Cliente']);
                if (customer) {
                  orderData.customer_id = customer.id;
                }
              }

              const orderIdCreated = await Database.addOrder(orderData);
              ordersMap.set(orderId, {
                id: orderIdCreated,
                items: []
              });
              results.orders.imported++;
            }

            // Adicionar item ao pedido
            if (row['Produto'] && row['Quantidade']) {
              const products = await Database.getProducts();
              const product = products.find(p => p.name === row['Produto']);
              
              if (product) {
                const orderItem = {
                  order_id: ordersMap.get(orderId).id,
                  product_id: product.id,
                  quantity: parseInt(row['Quantidade'] || '0'),
                  unit_price: parseFloat(row['Preço Unitário'] || '0'),
                  total_price: parseFloat(row['Total do Item'] || '0'),
                };

                await Database.addOrderItem(orderItem);
                ordersMap.get(orderId).items.push(orderItem);
              }
            }
          } catch (error) {
            console.error('Erro ao importar pedido:', error);
            results.orders.errors++;
          }
        }
      }

      totalImported = results.products.imported + results.customers.imported + results.orders.imported;
      totalErrors = results.products.errors + results.customers.errors + results.orders.errors;

      return {
        success: true,
        message: `Importação concluída!\n\nProdutos: ${results.products.imported} importados, ${results.products.errors} erros\nClientes: ${results.customers.imported} importados, ${results.customers.errors} erros\nPedidos: ${results.orders.imported} importados, ${results.orders.errors} erros`,
        totalImported,
        totalErrors,
        details: results
      };
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return { success: false, message: 'Erro ao importar dados: ' + error.message };
    }
  }

  // Importar dados do Excel (apenas produtos por enquanto)
  async importProducts(filePath) {
    try {
      // Ler arquivo Excel
      const fileData = await RNFS.readFile(filePath, 'base64');
      const workbook = XLSX.read(fileData, { type: 'base64' });
      
      // Obter primeira planilha
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      let importedCount = 0;
      let errorCount = 0;
      
      for (const row of jsonData) {
        try {
          // Mapear colunas (ajustar conforme necessário)
          const productData = {
            name: row['Nome'] || row['nome'] || '',
            quantity: parseInt(row['Quantidade em Estoque'] || row['Quantidade'] || row['quantidade'] || '0'),
            cost_price: parseFloat(row['Preço de Custo'] || row['preço de custo'] || '0'),
          };

          if (productData.name && productData.cost_price >= 0) {
            await Database.addProduct(productData);
            importedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Erro ao importar produto:', error);
          errorCount++;
        }
      }
      
      return {
        success: true,
        message: `Importação concluída! ${importedCount} produtos importados, ${errorCount} erros.`,
        importedCount,
        errorCount
      };
    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      return { success: false, message: 'Erro ao importar produtos: ' + error.message };
    }
  }
}

export default new ExcelService();


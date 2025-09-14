import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import Database from '../database/database';

class ExcelServiceImproved {
  // Importar dados completos do Excel com melhor tratamento de erros
  async importAllData(filePath) {
    try {
      console.log('🔍 Iniciando importação melhorada...');
      console.log('📁 Caminho do arquivo:', filePath);
      
      // Verificar se o arquivo existe
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        return { 
          success: false, 
          message: 'Arquivo não encontrado. Verifique se o arquivo está na pasta Downloads.' 
        };
      }
      
      // Obter informações do arquivo
      const fileStats = await RNFS.stat(filePath);
      console.log('📊 Tamanho do arquivo:', fileStats.size, 'bytes');
      
      // Verificar se o arquivo não está vazio
      if (fileStats.size === 0) {
        return { 
          success: false, 
          message: 'Arquivo está vazio. Verifique se o arquivo foi exportado corretamente.' 
        };
      }
      
      // Ler arquivo
      console.log('📖 Lendo arquivo...');
      const fileData = await RNFS.readFile(filePath, 'base64');
      
      // Processar com XLSX
      console.log('📊 Processando com XLSX...');
      const workbook = XLSX.read(fileData, { type: 'base64' });
      console.log('📋 Abas disponíveis:', workbook.SheetNames);
      
      // Verificar se tem as abas necessárias
      const requiredSheets = ['Produtos', 'Clientes', 'Pedidos'];
      const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet));
      
      if (missingSheets.length > 0) {
        return { 
          success: false, 
          message: `Arquivo inválido. Faltam as abas: ${missingSheets.join(', ')}. Use um arquivo exportado pelo próprio app.` 
        };
      }
      
      let totalImported = 0;
      let totalErrors = 0;
      const results = {
        products: { imported: 0, errors: 0, details: [] },
        customers: { imported: 0, errors: 0, details: [] },
        orders: { imported: 0, errors: 0, details: [] }
      };

      // Inicializar banco de dados
      await Database.init();

      // Importar Produtos
      console.log('📦 Importando produtos...');
      if (workbook.SheetNames.includes('Produtos')) {
        const productsSheet = workbook.Sheets['Produtos'];
        const productsData = XLSX.utils.sheet_to_json(productsSheet);
        
        for (const [index, row] of productsData.entries()) {
          try {
            const productData = {
              name: String(row['Nome'] || '').trim(),
              quantity: parseInt(row['Quantidade em Estoque'] || '0') || 0,
              cost_price: parseFloat(row['Preço de Custo'] || '0') || 0,
            };

            if (productData.name && productData.cost_price >= 0) {
              await Database.addProduct(productData);
              results.products.imported++;
              results.products.details.push(`✅ ${productData.name}`);
            } else {
              results.products.errors++;
              results.products.details.push(`❌ Linha ${index + 2}: Nome ou preço inválido`);
            }
          } catch (error) {
            console.error('Erro ao importar produto:', error);
            results.products.errors++;
            results.products.details.push(`❌ Linha ${index + 2}: ${error.message}`);
          }
        }
      }

      // Importar Clientes
      console.log('👥 Importando clientes...');
      if (workbook.SheetNames.includes('Clientes')) {
        const customersSheet = workbook.Sheets['Clientes'];
        const customersData = XLSX.utils.sheet_to_json(customersSheet);
        
        for (const [index, row] of customersData.entries()) {
          try {
            const customerData = {
              name: String(row['Nome'] || '').trim(),
              phone: String(row['Telefone'] || '').trim(),
              email: String(row['Email'] || '').trim(),
              address: String(row['Endereço'] || '').trim(),
            };

            if (customerData.name) {
              await Database.addCustomer(customerData);
              results.customers.imported++;
              results.customers.details.push(`✅ ${customerData.name}`);
            } else {
              results.customers.errors++;
              results.customers.details.push(`❌ Linha ${index + 2}: Nome obrigatório`);
            }
          } catch (error) {
            console.error('Erro ao importar cliente:', error);
            results.customers.errors++;
            results.customers.details.push(`❌ Linha ${index + 2}: ${error.message}`);
          }
        }
      }

      // Importar Pedidos
      console.log('📋 Importando pedidos...');
      if (workbook.SheetNames.includes('Pedidos')) {
        const ordersSheet = workbook.Sheets['Pedidos'];
        const ordersData = XLSX.utils.sheet_to_json(ordersSheet);
        
        // Agrupar itens por pedido
        const ordersMap = new Map();
        
        for (const [index, row] of ordersData.entries()) {
          try {
            const orderId = row['ID do Pedido'];
            if (!orderId) continue;

            if (!ordersMap.has(orderId)) {
              // Criar pedido
              const orderData = {
                customer_id: null,
                status: String(row['Status'] || 'with_customer').trim(),
                notes: String(row['Observações'] || '').trim(),
                total_amount: parseFloat(row['Total do Pedido'] || '0') || 0,
                paid_amount: parseFloat(row['Valor Pago'] || '0') || 0,
              };

              // Buscar cliente pelo nome
              if (row['Cliente']) {
                const customers = await Database.getCustomers();
                const customer = customers.find(c => c.name === String(row['Cliente']).trim());
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
              results.orders.details.push(`✅ Pedido ${orderId} criado`);
            }

            // Adicionar item ao pedido
            if (row['Produto'] && row['Quantidade']) {
              const products = await Database.getProducts();
              const product = products.find(p => p.name === String(row['Produto']).trim());
              
              if (product) {
                const orderItem = {
                  order_id: ordersMap.get(orderId).id,
                  product_id: product.id,
                  quantity: parseInt(row['Quantidade'] || '0') || 0,
                  unit_price: parseFloat(row['Preço Unitário'] || '0') || 0,
                  total_price: parseFloat(row['Total do Item'] || '0') || 0,
                };

                await Database.addOrderItem(orderItem);
                ordersMap.get(orderId).items.push(orderItem);
              } else {
                results.orders.details.push(`⚠️ Produto "${row['Produto']}" não encontrado para pedido ${orderId}`);
              }
            }
          } catch (error) {
            console.error('Erro ao importar pedido:', error);
            results.orders.errors++;
            results.orders.details.push(`❌ Linha ${index + 2}: ${error.message}`);
          }
        }
      }

      totalImported = results.products.imported + results.customers.imported + results.orders.imported;
      totalErrors = results.products.errors + results.customers.errors + results.orders.errors;

      // Criar mensagem detalhada
      let message = `Importação concluída!\n\n`;
      message += `📦 Produtos: ${results.products.imported} importados, ${results.products.errors} erros\n`;
      message += `👥 Clientes: ${results.customers.imported} importados, ${results.customers.errors} erros\n`;
      message += `📋 Pedidos: ${results.orders.imported} importados, ${results.orders.errors} erros\n\n`;
      
      if (totalErrors > 0) {
        message += `⚠️ Verifique os detalhes dos erros no console.`;
      }

      console.log('✅ Importação concluída:', results);

      return {
        success: true,
        message,
        totalImported,
        totalErrors,
        details: results
      };
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      return { 
        success: false, 
        message: `Erro ao importar dados: ${error.message}\n\nVerifique se:\n1. O arquivo está na pasta Downloads\n2. O arquivo foi exportado pelo próprio app\n3. O arquivo não está corrompido` 
      };
    }
  }
}

export default new ExcelServiceImproved();

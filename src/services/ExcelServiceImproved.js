import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import Database from '../database/database';

class ExcelServiceImproved {
  async importAllData(filePath) {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { 
          success: false, 
          message: 'Caminho do arquivo inválido ou não fornecido' 
        };
      }
      
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        return { 
          success: false, 
          message: 'Arquivo não encontrado. Verifique se o arquivo está na pasta Downloads.' 
        };
      }
      
      const fileStats = await RNFS.stat(filePath);
      
      if (fileStats.size === 0) {
        return { 
          success: false, 
          message: 'Arquivo está vazio. Verifique se o arquivo foi exportado corretamente.' 
        };
      }
      
      if (fileStats.size < 100) {
        return { 
          success: false, 
          message: 'Arquivo muito pequeno. Um arquivo Excel válido deve ter pelo menos 100 bytes.' 
        };
      }
      
      const fileData = await RNFS.readFile(filePath, 'base64');
      
      const fileName = filePath.split('/').pop().toLowerCase();
      const isXlsx = fileName.endsWith('.xlsx');
      const isXls = fileName.endsWith('.xls');
      
      // Verificar se o arquivo tem a assinatura correta
      if (isXlsx) {
        // Arquivos .xlsx são arquivos ZIP, devem começar com PK
        // Converter base64 para array de bytes para verificar assinatura
        try {
          const binaryString = atob(fileData);
          if (binaryString.length < 4 || binaryString.charCodeAt(0) !== 0x50 || binaryString.charCodeAt(1) !== 0x4B) {
            return { 
              success: false, 
              message: 'Arquivo .xlsx inválido. O arquivo não tem a assinatura correta de um arquivo Excel moderno.' 
            };
          }
        } catch (base64Error) {
          console.warn('Erro ao verificar assinatura .xlsx:', base64Error);
          // Continuar mesmo se não conseguir verificar a assinatura
        }
      } else if (isXls) {
        // Arquivos .xls têm assinatura específica
        try {
          const binaryString = atob(fileData);
          if (binaryString.length < 8) {
            return { 
              success: false, 
              message: 'Arquivo .xls inválido. O arquivo está corrompido ou não é um arquivo Excel.' 
            };
          }
        } catch (base64Error) {
          console.warn('Erro ao verificar assinatura .xls:', base64Error);
          // Continuar mesmo se não conseguir verificar a assinatura
        }
      }
      
      // Validar se o arquivo é realmente um Excel válido
      console.log('🔍 Processando arquivo com XLSX...');
      let workbook;
      try {
        workbook = XLSX.read(fileData, { type: 'base64' });
        console.log('✅ Arquivo Excel válido detectado');
      } catch (xlsxError) {
        console.error('❌ Erro ao processar arquivo como Excel:', xlsxError);
        return { 
          success: false, 
          message: `Arquivo inválido. O arquivo selecionado não é um arquivo Excel válido.\n\nErro: ${xlsxError.message}\n\nVerifique se:\n1. O arquivo é realmente um arquivo .xlsx ou .xls\n2. O arquivo não está corrompido\n3. O arquivo foi salvo corretamente\n4. O arquivo não foi criado em um formato incompatível` 
        };
      }
      
      // Verificar se o workbook foi criado corretamente
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        return { 
          success: false, 
          message: 'Arquivo Excel inválido. O arquivo não contém planilhas válidas.' 
        };
      }
      
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

      // Criar mensagem simplificada
      let message = `📦 Produtos: ${results.products.imported}\n`;
      message += `👥 Clientes: ${results.customers.imported}\n`;
      message += `📋 Pedidos: ${results.orders.imported}`;
      
      if (totalErrors > 0) {
        message += `\n\n⚠️ ${totalErrors} erro(s) encontrado(s)`;
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

  // Importar arquivo compartilhado (content://)
  async importSharedFile(contentUri) {
    try {
      console.log('🔍 Importando arquivo compartilhado...');
      console.log('📁 URI do conteúdo:', contentUri);
      
      // Validar se contentUri é válido
      if (!contentUri || typeof contentUri !== 'string') {
        return { 
          success: false, 
          message: 'URI do arquivo compartilhado inválido' 
        };
      }

      // Ler arquivo compartilhado
      console.log('📖 Lendo arquivo compartilhado...');
      const fileData = await RNFS.readFile(contentUri, 'base64');
      
      if (!fileData) {
        return { 
          success: false, 
          message: 'Não foi possível ler o arquivo compartilhado' 
        };
      }

      // Validar se o arquivo não está vazio
      if (fileData.length === 0) {
        return { 
          success: false, 
          message: 'Arquivo compartilhado está vazio' 
        };
      }

      // Validar assinatura do arquivo Excel
      console.log('🔍 Validando assinatura do arquivo compartilhado...');
      const isXlsx = contentUri.includes('.xlsx') || contentUri.includes('xlsx');
      const isXls = contentUri.includes('.xls') || contentUri.includes('xls');
      
      if (isXlsx) {
        // Validar assinatura ZIP para XLSX
        const binaryString = atob(fileData);
        if (binaryString.length < 4 || 
            binaryString.charCodeAt(0) !== 0x50 || 
            binaryString.charCodeAt(1) !== 0x4B) {
          return { 
            success: false, 
            message: 'Arquivo não é um XLSX válido (assinatura ZIP incorreta)' 
          };
        }
      }

      // Processar arquivo Excel
      console.log('📊 Processando arquivo Excel compartilhado...');
      const workbook = XLSX.read(fileData, { type: 'base64' });
      
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        return { 
          success: false, 
          message: 'Arquivo Excel compartilhado não contém planilhas válidas' 
        };
      }

      console.log('📋 Planilhas encontradas:', workbook.SheetNames);

      // Processar dados usando o mesmo método que importAllData
      const results = {
        products: { imported: 0, details: [] },
        customers: { imported: 0, details: [] },
        orders: { imported: 0, details: [] }
      };

      // Importar produtos
      if (workbook.SheetNames.includes('Produtos')) {
        const productsSheet = workbook.Sheets['Produtos'];
        const productsData = XLSX.utils.sheet_to_json(productsSheet);
        
        for (const [index, row] of productsData.entries()) {
          try {
            const productData = {
              name: String(row['Nome'] || '').trim(),
              description: String(row['Descrição'] || '').trim(),
              cost_price: parseFloat(row['Preço de Custo'] || '0') || 0,
              suggested_price: parseFloat(row['Preço Sugerido'] || '0') || 0,
              quantity: 0 // Sempre 0 para produtos importados
            };

            if (productData.name) {
              await Database.addProduct(productData);
              results.products.imported++;
              results.products.details.push(`✅ Produto: ${productData.name}`);
            }
          } catch (error) {
            console.error(`Erro ao importar produto linha ${index + 2}:`, error);
            results.products.details.push(`❌ Erro linha ${index + 2}: ${error.message}`);
          }
        }
      }

      // Importar clientes
      if (workbook.SheetNames.includes('Clientes')) {
        const customersSheet = workbook.Sheets['Clientes'];
        const customersData = XLSX.utils.sheet_to_json(customersSheet);
        
        for (const [index, row] of customersData.entries()) {
          try {
            const customerData = {
              name: String(row['Nome'] || '').trim(),
              email: String(row['Email'] || '').trim(),
              phone: String(row['Telefone'] || '').trim(),
              address: String(row['Endereço'] || '').trim()
            };

            if (customerData.name) {
              await Database.addCustomer(customerData);
              results.customers.imported++;
              results.customers.details.push(`✅ Cliente: ${customerData.name}`);
            }
          } catch (error) {
            console.error(`Erro ao importar cliente linha ${index + 2}:`, error);
            results.customers.details.push(`❌ Erro linha ${index + 2}: ${error.message}`);
          }
        }
      }

      // Importar pedidos
      if (workbook.SheetNames.includes('Pedidos')) {
        const ordersSheet = workbook.Sheets['Pedidos'];
        const ordersData = XLSX.utils.sheet_to_json(ordersSheet);
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
                results.orders.details.push(`⚠️ Produto não encontrado: ${row['Produto']}`);
              }
            }
          } catch (error) {
            console.error(`Erro ao importar pedido linha ${index + 2}:`, error);
            results.orders.details.push(`❌ Erro linha ${index + 2}: ${error.message}`);
          }
        }
      }

      // Montar mensagem de resultado simplificada
      const message = `📦 Produtos: ${results.products.imported}\n` +
        `👥 Clientes: ${results.customers.imported}\n` +
        `📋 Pedidos: ${results.orders.imported}`;

      return {
        success: true,
        message: message
      };

    } catch (error) {
      console.error('❌ Erro ao importar arquivo compartilhado:', error);
      return { 
        success: false, 
        message: `Erro ao importar arquivo compartilhado: ${error.message}\n\nVerifique se o arquivo é um Excel válido e não está corrompido` 
      };
    }
  }
}

export default new ExcelServiceImproved();

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
      const [products, customers, sales, orders] = await Promise.all([
        Database.getProducts(),
        Database.getCustomers(),
        Database.getSales(),
        Database.getOrders(),
      ]);

      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Planilha de Produtos
      const productsData = products.map(product => ({
        'ID': product.id,
        'Nome': product.name,
        'Descrição': product.description || '',
        'Categoria': product.category || '',
        'Tamanho': product.size || '',
        'Cor': product.color || '',
        'Quantidade': product.quantity,
        'Preço de Custo': product.cost_price,
        'Preço de Venda': product.sale_price,
        'Lucro por Peça': product.sale_price - product.cost_price,
        'Data de Criação': new Date(product.created_at).toLocaleDateString('pt-BR'),
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
      }));

      const customersSheet = XLSX.utils.json_to_sheet(customersData);
      XLSX.utils.book_append_sheet(workbook, customersSheet, 'Clientes');

      // Planilha de Vendas
      const salesData = sales.map(sale => ({
        'ID': sale.id,
        'Cliente': sale.customer_name || 'Cliente não informado',
        'Total': sale.total_amount,
        'Custo': sale.total_cost,
        'Lucro': sale.profit,
        'Forma de Pagamento': sale.payment_method,
        'Status': sale.status,
        'Data': new Date(sale.created_at).toLocaleDateString('pt-BR'),
      }));

      const salesSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Vendas');

      // Planilha de Pedidos
      const ordersData = orders.map(order => ({
        'ID': order.id,
        'Cliente': order.customer_name,
        'Produto': order.product_name,
        'Quantidade': order.quantity,
        'Status': order.status,
        'Observações': order.notes || '',
        'Data de Criação': new Date(order.created_at).toLocaleDateString('pt-BR'),
      }));

      const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Pedidos');

      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Salvar arquivo
      const fileName = `LojaRoupas_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, excelBuffer, 'base64');
      
      // Compartilhar arquivo
      const shareOptions = {
        title: 'Exportar Dados da Loja',
        message: 'Dados exportados da Loja de Roupas',
        url: `file://${filePath}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      await Share.open(shareOptions);
      
      return { success: true, message: 'Dados exportados com sucesso!' };
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      return { success: false, message: 'Erro ao exportar dados: ' + error.message };
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
        'Descrição': product.description || '',
        'Categoria': product.category || '',
        'Tamanho': product.size || '',
        'Cor': product.color || '',
        'Quantidade': product.quantity,
        'Preço de Custo': product.cost_price,
        'Preço de Venda': product.sale_price,
        'Lucro por Peça': product.sale_price - product.cost_price,
        'Data de Criação': new Date(product.created_at).toLocaleDateString('pt-BR'),
      }));

      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Produtos');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const fileName = `Produtos_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, excelBuffer, 'base64');
      
      const shareOptions = {
        title: 'Exportar Produtos',
        message: 'Lista de produtos da Loja de Roupas',
        url: `file://${filePath}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      await Share.open(shareOptions);
      
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

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const fileName = `RelatorioFinanceiro_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, excelBuffer, 'base64');
      
      const shareOptions = {
        title: 'Relatório Financeiro',
        message: 'Relatório financeiro da Loja de Roupas',
        url: `file://${filePath}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      await Share.open(shareOptions);
      
      return { success: true, message: 'Relatório financeiro exportado com sucesso!' };
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      return { success: false, message: 'Erro ao exportar relatório: ' + error.message };
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
            description: row['Descrição'] || row['descrição'] || '',
            category: row['Categoria'] || row['categoria'] || '',
            size: row['Tamanho'] || row['tamanho'] || '',
            color: row['Cor'] || row['cor'] || '',
            quantity: parseInt(row['Quantidade'] || row['quantidade'] || '0'),
            cost_price: parseFloat(row['Preço de Custo'] || row['preço de custo'] || '0'),
            sale_price: parseFloat(row['Preço de Venda'] || row['preço de venda'] || '0'),
          };

          if (productData.name && productData.cost_price && productData.sale_price) {
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


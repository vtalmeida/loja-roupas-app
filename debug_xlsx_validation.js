// Script de debug para validação de arquivos XLSX
// Execute este script para testar a validação de arquivos Excel

import RNFS from 'react-native-fs';
import XLSX from 'xlsx';

const debugXlsxFile = async (filePath) => {
  console.log('🔍 Iniciando debug do arquivo:', filePath);
  
  try {
    // 1. Verificar se o arquivo existe
    const fileExists = await RNFS.exists(filePath);
    console.log('✅ Arquivo existe:', fileExists);
    
    if (!fileExists) {
      console.log('❌ Arquivo não encontrado');
      return;
    }
    
    // 2. Obter informações do arquivo
    const fileStats = await RNFS.stat(filePath);
    console.log('📊 Tamanho do arquivo:', fileStats.size, 'bytes');
    console.log('📁 Nome do arquivo:', filePath.split('/').pop());
    console.log('📅 Data de modificação:', new Date(fileStats.mtime).toLocaleString());
    
    // 3. Verificar tamanho mínimo
    if (fileStats.size < 100) {
      console.log('❌ Arquivo muito pequeno para ser um Excel válido');
      return;
    }
    
    // 4. Ler arquivo como base64
    console.log('📖 Lendo arquivo como base64...');
    const fileData = await RNFS.readFile(filePath, 'base64');
    console.log('✅ Arquivo lido com sucesso, tamanho base64:', fileData.length);
    
    // 5. Verificar assinatura do arquivo
    const fileName = filePath.split('/').pop().toLowerCase();
    const isXlsx = fileName.endsWith('.xlsx');
    const isXls = fileName.endsWith('.xls');
    
    console.log('📋 Tipo de arquivo detectado:', isXlsx ? '.xlsx' : isXls ? '.xls' : 'desconhecido');
    
    if (isXlsx) {
      // Arquivos .xlsx são arquivos ZIP
      try {
        const binaryString = atob(fileData);
        const hasZipSignature = binaryString.length >= 4 && binaryString.charCodeAt(0) === 0x50 && binaryString.charCodeAt(1) === 0x4B;
        console.log('🔍 Assinatura ZIP (.xlsx):', hasZipSignature ? '✅ Válida' : '❌ Inválida');
        
        if (hasZipSignature) {
          const firstBytes = Array.from(binaryString.slice(0, 10)).map(c => '0x' + c.charCodeAt(0).toString(16).padStart(2, '0'));
          console.log('📦 Primeiros bytes:', firstBytes.join(' '));
        }
      } catch (base64Error) {
        console.warn('Erro ao verificar assinatura .xlsx:', base64Error);
      }
    }
    
    // 6. Tentar processar com XLSX
    console.log('🔍 Tentando processar com XLSX...');
    try {
      const workbook = XLSX.read(fileData, { type: 'base64' });
      console.log('✅ Arquivo processado com sucesso pelo XLSX');
      console.log('📋 Abas encontradas:', workbook.SheetNames);
      console.log('📊 Número de abas:', workbook.SheetNames.length);
      
      // Verificar se tem as abas necessárias
      const requiredSheets = ['Produtos', 'Clientes', 'Pedidos'];
      const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet));
      
      if (missingSheets.length > 0) {
        console.log('⚠️ Faltam abas necessárias:', missingSheets);
      } else {
        console.log('✅ Todas as abas necessárias estão presentes');
      }
      
      // Verificar conteúdo da primeira aba
      if (workbook.SheetNames.length > 0) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        console.log('📋 Primeira aba:', workbook.SheetNames[0]);
        console.log('📊 Número de linhas:', firstSheetData.length);
        if (firstSheetData.length > 0) {
          console.log('📋 Primeira linha (cabeçalhos):', firstSheetData[0]);
        }
      }
      
    } catch (xlsxError) {
      console.error('❌ Erro ao processar com XLSX:', xlsxError);
      console.error('📝 Detalhes do erro:', xlsxError.message);
      console.error('📝 Stack trace:', xlsxError.stack);
    }
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }
};

// Função para listar arquivos Excel na pasta Downloads
const listExcelFiles = async () => {
  try {
    const downloadsPath = RNFS.DownloadDirectoryPath;
    console.log('📁 Pasta Downloads:', downloadsPath);
    
    const files = await RNFS.readDir(downloadsPath);
    console.log('📊 Total de arquivos na pasta:', files.length);
    
    const excelFiles = files.filter(file => {
      if (!file.isFile()) return false;
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    });
    
    console.log('📊 Arquivos Excel encontrados:', excelFiles.length);
    
    excelFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   📊 Tamanho: ${(file.size / 1024).toFixed(1)} KB`);
      console.log(`   📅 Modificado: ${new Date(file.mtime).toLocaleString()}`);
      console.log(`   📁 Caminho: ${file.path}`);
      console.log('');
    });
    
    return excelFiles;
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);
    return [];
  }
};

export { debugXlsxFile, listExcelFiles };

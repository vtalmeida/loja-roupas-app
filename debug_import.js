// Script para debugar problemas de importação
// Execute no console do React Native Debugger

import RNFS from 'react-native-fs';
import XLSX from 'xlsx';

const debugImport = async (filePath) => {
  try {
    console.log('🔍 Iniciando debug da importação...');
    console.log('📁 Caminho do arquivo:', filePath);
    
    // Verificar se o arquivo existe
    const fileExists = await RNFS.exists(filePath);
    console.log('✅ Arquivo existe:', fileExists);
    
    if (!fileExists) {
      console.error('❌ Arquivo não encontrado!');
      return;
    }
    
    // Obter informações do arquivo
    const fileStats = await RNFS.stat(filePath);
    console.log('📊 Tamanho do arquivo:', fileStats.size, 'bytes');
    console.log('📅 Data de modificação:', fileStats.mtime);
    
    // Ler arquivo
    console.log('📖 Lendo arquivo...');
    const fileData = await RNFS.readFile(filePath, 'base64');
    console.log('✅ Arquivo lido, tamanho base64:', fileData.length);
    
    // Processar com XLSX
    console.log('📊 Processando com XLSX...');
    const workbook = XLSX.read(fileData, { type: 'base64' });
    console.log('✅ Workbook criado');
    console.log('📋 Abas disponíveis:', workbook.SheetNames);
    
    // Verificar cada aba
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n📄 Analisando aba: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      console.log(`📊 Linhas na aba: ${jsonData.length}`);
      
      if (jsonData.length > 0) {
        console.log('🔍 Primeira linha:', jsonData[0]);
        console.log('🔍 Colunas disponíveis:', Object.keys(jsonData[0]));
      }
    }
    
    console.log('✅ Debug concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
};

export default debugImport;

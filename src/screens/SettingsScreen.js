import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import ExcelService from '../services/ExcelService';
import ExcelServiceImproved from '../services/ExcelServiceImproved';
import Database from '../database/database';
import colors from '../theme/colors';

const SettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleExportToGoogleSheets = async () => {
    console.log('Iniciando exportação...');
    setLoading(true);
    try {
      // Usar a função exportAllData que estava funcionando antes
      const result = await ExcelService.exportAllData();
      console.log('Resultado da exportação:', result);
      
      // Só mostra modal se houver mensagem de erro
      if (!result.success || result.message) {
        Alert.alert(
          result.success ? 'Sucesso' : 'Erro',
          result.message
        );
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      Alert.alert('Erro', 'Erro ao exportar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleImportAllData = async () => {
    Alert.alert(
      'Importar Dados de Planilha',
      'Esta ação irá importar os dados da planilha selecionada e adicionar aos dados existentes. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Importar', 
          style: 'default',
          onPress: () => selectAndImportFile()
        }
      ]
    );
  };

  const selectAndImportFile = async () => {
    try {
      setLoading(true);
      
      // Listar arquivos Excel na pasta Downloads
      const downloadsPath = RNFS.DownloadDirectoryPath;
      const files = await RNFS.readDir(downloadsPath);
      
      // Filtrar apenas arquivos Excel (.xlsx e .xls)
      const excelFiles = files.filter(file => 
        file.isFile() && 
        (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
      );
      
      if (excelFiles.length === 0) {
        Alert.alert(
          'Nenhum arquivo Excel encontrado',
          'Não foram encontrados arquivos Excel (.xlsx ou .xls) na pasta Downloads.\n\nPara importar dados:\n1. Coloque o arquivo Excel na pasta Downloads\n2. O arquivo deve ter as abas: Produtos, Clientes, Pedidos\n3. Tente novamente',
          [
            { text: 'OK' },
            { 
              text: 'Verificar Pasta', 
              onPress: () => checkDownloadsFolder() 
            }
          ]
        );
        return;
      }
      
      // Ordenar arquivos por data de modificação (mais recentes primeiro)
      excelFiles.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
      
      // Criar lista de opções para o usuário escolher
      const fileOptions = excelFiles.map((file, index) => {
        const fileDate = new Date(file.mtime).toLocaleDateString('pt-BR');
        const fileSize = (file.size / 1024).toFixed(1) + ' KB';
        const isAppExport = file.name.includes('BruModaIntima');
        
        return {
          text: `${file.name}\n📅 ${fileDate} | 📊 ${fileSize}${isAppExport ? ' | ✅ Exportado pelo app' : ' | ⚠️ Arquivo externo'}`,
          onPress: () => importSelectedFile(file.path, file.name)
        };
      });
      
      // Adicionar opções extras
      fileOptions.push(
        {
          text: '📁 Verificar Pasta Downloads',
          onPress: () => checkDownloadsFolder()
        },
        {
          text: '❌ Cancelar',
          style: 'cancel'
        }
      );
      
      Alert.alert(
        '📊 Selecionar Arquivo Excel para Importar',
        `Encontrados ${excelFiles.length} arquivo(s) Excel na pasta Downloads:\n\n💡 Dica: Arquivos exportados pelo app têm maior compatibilidade.`,
        fileOptions
      );
      
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      Alert.alert('Erro', 'Erro ao acessar pasta Downloads: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkDownloadsFolder = async () => {
    try {
      const downloadsPath = RNFS.DownloadDirectoryPath;
      const files = await RNFS.readDir(downloadsPath);
      
      const allFiles = files.filter(file => file.isFile());
      const excelFiles = allFiles.filter(file => 
        file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
      );
      
      let message = `📁 Pasta Downloads:\n`;
      message += `📊 Total de arquivos: ${allFiles.length}\n`;
      message += `📈 Arquivos Excel: ${excelFiles.length}\n\n`;
      
      if (excelFiles.length > 0) {
        message += `Arquivos Excel encontrados:\n`;
        excelFiles.forEach(file => {
          const fileDate = new Date(file.mtime).toLocaleDateString('pt-BR');
          const fileSize = (file.size / 1024).toFixed(1) + ' KB';
          const isAppExport = file.name.includes('BruModaIntima');
          message += `• ${file.name} (${fileDate}, ${fileSize})${isAppExport ? ' ✅' : ' ⚠️'}\n`;
        });
      } else {
        message += `Nenhum arquivo Excel encontrado.\n\nPara importar:\n1. Coloque um arquivo .xlsx na pasta Downloads\n2. O arquivo deve ter as abas: Produtos, Clientes, Pedidos`;
      }
      
      Alert.alert('📁 Informações da Pasta Downloads', message, [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao verificar pasta Downloads: ' + error.message);
    }
  };

  const importSelectedFile = async (filePath, fileName = '') => {
    try {
      setLoading(true);
      console.log('Importando arquivo:', filePath);
      
      // Mostrar confirmação antes de importar
      const isAppExport = fileName.includes('BruModaIntima');
      const confirmMessage = isAppExport 
        ? `Importar dados do arquivo:\n\n📄 ${fileName}\n\n✅ Este arquivo foi exportado pelo app e tem total compatibilidade.`
        : `Importar dados do arquivo:\n\n📄 ${fileName}\n\n⚠️ Este é um arquivo externo. Verifique se tem as abas: Produtos, Clientes, Pedidos.`;
      
      Alert.alert(
        'Confirmar Importação',
        confirmMessage,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Importar', 
            onPress: () => performImport(filePath, fileName)
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      Alert.alert('Erro', 'Erro ao importar arquivo: ' + error.message);
      setLoading(false);
    }
  };

  const performImport = async (filePath, fileName) => {
    try {
      setLoading(true);
      
      // Importar dados usando o ExcelService melhorado
      const result = await ExcelServiceImproved.importAllData(filePath);
      
      const alertTitle = result.success ? '✅ Importação Concluída' : '❌ Erro na Importação';
      const alertMessage = result.success 
        ? `Arquivo: ${fileName}\n\n${result.message}`
        : `Arquivo: ${fileName}\n\n${result.message}`;
      
      Alert.alert(alertTitle, alertMessage, [{ text: 'OK' }]);
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      Alert.alert('Erro', `Erro ao importar arquivo ${fileName}: ` + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleClearDatabase = () => {
    Alert.alert(
      '⚠️ Limpar Banco de Dados',
      'Esta ação irá APAGAR TODOS os dados do aplicativo (produtos, clientes, pedidos, vendas).\n\nEsta ação NÃO PODE ser desfeita!\n\nTem certeza que deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await Database.init();
              await Database.clearAllData();
              Alert.alert(
                'Sucesso',
                'Banco de dados limpo com sucesso! Todos os dados foram removidos.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Erro ao limpar banco:', error);
              Alert.alert('Erro', 'Não foi possível limpar o banco de dados');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const ExportCard = ({ title, description, onPress, icon, color = colors.primary }) => (
    <Card style={styles.exportCard}>
      <View style={styles.exportHeader}>
        <Text style={styles.exportIcon}>{icon}</Text>
        <View style={styles.exportInfo}>
          <Text style={styles.exportTitle}>{title}</Text>
          <Text style={styles.exportDescription}>{description}</Text>
        </View>
      </View>
      <Button
        title="Exportar"
        onPress={onPress}
        variant="primary"
        style={[styles.exportButton, { backgroundColor: color }]}
        disabled={loading}
      />
    </Card>
  );

  const ImportCard = ({ title, description, onPress, icon, color = colors.success }) => (
    <Card style={styles.importCard}>
      <View style={styles.importHeader}>
        <Text style={styles.importIcon}>{icon}</Text>
        <View style={styles.importInfo}>
          <Text style={styles.importTitle}>{title}</Text>
          <Text style={styles.importDescription}>{description}</Text>
        </View>
      </View>
      <Button
        title="Importar"
        onPress={onPress}
        variant="success"
        style={[styles.importButton, { backgroundColor: color }]}
        disabled={loading}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Configurações" 
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Exportar Dados</Text>
          <Text style={styles.sectionDescription}>
            Exporte seus dados salvando no Google Drive ou editando no Google Sheets.
          </Text>
          
          <ExportCard
            title="Exportar dados"
            description="Abre menu para salvar arquivo no Google Drive ou editar no Google Sheets"
            onPress={handleExportToGoogleSheets}
            icon="☁️"
            color={colors.info}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📥 Importar Dados</Text>
          <Text style={styles.sectionDescription}>
            Importe dados de planilhas Excel para o aplicativo. Use a planilha exportada pelo próprio app.
          </Text>
          
          <ImportCard
            title="Importar Dados de Planilha"
            description="Selecione arquivo Excel da pasta Downloads do dispositivo"
            onPress={handleImportAllData}
            icon="📊"
            color={colors.success}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Manutenção</Text>
          <Text style={styles.sectionDescription}>
            Ferramentas para manutenção e limpeza do banco de dados.
          </Text>
          
          <Card style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <Text style={styles.dangerIcon}>⚠️</Text>
              <View style={styles.dangerInfo}>
                <Text style={styles.dangerTitle}>Limpar Banco de Dados</Text>
                <Text style={styles.dangerDescription}>
                  Remove TODOS os dados do aplicativo (produtos, clientes, pedidos, vendas)
                </Text>
              </View>
            </View>
            <Button
              title="Limpar Tudo"
              onPress={handleClearDatabase}
              variant="danger"
              style={styles.dangerButton}
              disabled={loading}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informações</Text>
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Formato de Importação</Text>
            <Text style={styles.infoText}>
              Para importar produtos, use uma planilha Excel com as seguintes colunas:
            </Text>
            <Text style={styles.infoList}>
              • Nome (obrigatório){'\n'}
              • Preço de Custo (obrigatório){'\n'}
              • Preço de Venda (obrigatório){'\n'}
              • Quantidade{'\n'}
              • Descrição{'\n'}
              • Categoria{'\n'}
              • Tamanho{'\n'}
              • Cor
            </Text>
          </Card>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Processando...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  exportCard: {
    marginBottom: 12,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exportIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  exportButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  importCard: {
    marginBottom: 12,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  importIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  importInfo: {
    flex: 1,
  },
  importTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  importDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  importButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  infoList: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  dangerCard: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
    borderWidth: 1,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dangerInfo: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.warning,
    marginBottom: 4,
  },
  dangerDescription: {
    fontSize: 14,
    color: colors.warning,
  },
  dangerButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    backgroundColor: colors.error,
  },
});

export default SettingsScreen;

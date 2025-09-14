import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Platform,
  Linking
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

const SettingsScreen = ({ navigation, sharedFile, onFileProcessed }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sharedFile) {
      processSharedFile(sharedFile);
    }
  }, [sharedFile]);

  const processSharedFile = async (fileUri) => {
    try {
      if (!fileUri || typeof fileUri !== 'string') {
        throw new Error('Caminho do arquivo inválido ou não fornecido');
      }
      
      const fileName = fileUri.split('/').pop() || 'arquivo_excel.xlsx';
      const isAppExport = fileName.includes('BruModaIntima');
      const confirmMessage = isAppExport 
        ? `Importar dados do arquivo:\n\n📄 ${fileName}\n\n✅ Este arquivo foi exportado pelo app e tem total compatibilidade.`
        : `Importar dados do arquivo:\n\n📄 ${fileName}\n\n⚠️ Este é um arquivo externo. Verifique se tem as abas: Produtos, Clientes, Pedidos.`;
      
      Alert.alert(
        'Confirmar Importação',
        confirmMessage,
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => {
            if (onFileProcessed) {
              onFileProcessed();
            }
          }},
          { 
            text: 'Importar', 
            onPress: () => performSharedFileImport(fileUri)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', `Erro ao processar arquivo: ${error.message}`, [
        { 
          text: 'OK', 
          onPress: () => {
            if (onFileProcessed) {
              onFileProcessed();
            }
          }
        }
      ]);
    }
  };

  const performSharedFileImport = async (fileUri) => {
    try {
      setLoading(true);
      
      // Verificar se é um arquivo compartilhado (content://) ou arquivo local
      let result;
      if (fileUri.startsWith('content://')) {
        // Arquivo compartilhado - usar método especial
        result = await ExcelServiceImproved.importSharedFile(fileUri);
      } else {
        // Arquivo local - usar método normal
        result = await ExcelServiceImproved.importAllData(fileUri);
      }
      
      const alertTitle = result.success ? '✅ Importação Concluída' : '❌ Erro na Importação';
      const alertMessage = result.success 
        ? `Arquivo importado com sucesso!\n\n${result.message}`
        : `Erro ao importar arquivo:\n\n${result.message}`;
      
      Alert.alert(alertTitle, alertMessage, [
        { 
          text: 'OK', 
          onPress: () => {
            // Limpar o arquivo compartilhado
            if (onFileProcessed) {
              onFileProcessed();
            }
          }
        }
      ]);
    } catch (error) {
      console.error('Erro ao importar arquivo compartilhado:', error);
      Alert.alert('Erro', `Erro ao importar arquivo: ${error.message}`, [
        { 
          text: 'OK', 
          onPress: () => {
            if (onFileProcessed) {
              onFileProcessed();
            }
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

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


  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Configurações" 
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Exportar Dados</Text>
          <Text style={styles.sectionDescription}>
            Exporte seus dados salvando automaticamente na pasta Downloads e compartilhando onde desejar.
          </Text>
          
          <ExportCard
            title="Exportar dados"
            description="Salva automaticamente em Downloads > Bru Moda Íntima e abre opção de compartilhamento"
            onPress={handleExportToGoogleSheets}
            icon="☁️"
            color={colors.info}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📥 Importar Dados</Text>
          <Text style={styles.sectionDescription}>
            Para importar dados de planilhas Excel para o aplicativo:
          </Text>
          
          <View style={styles.importInstructions}>
            <Text style={styles.instructionTitle}>📋 Como Importar:</Text>
            <Text style={styles.instructionStep}>1. Abra o arquivo Excel em qualquer app</Text>
            <Text style={styles.instructionStep}>2. Toque em "Compartilhar" ou "Abrir com"</Text>
            <Text style={styles.instructionStep}>3. Selecione "Bru Moda Íntima"</Text>
            <Text style={styles.instructionStep}>4. Confirme a importação</Text>
            
            <Text style={styles.instructionNote}>
              💡 Dica: Use arquivos exportados pelo próprio app para melhor compatibilidade
            </Text>
          </View>
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
  importInstructions: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  instructionNote: {
    fontSize: 12,
    color: colors.info,
    fontStyle: 'italic',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default SettingsScreen;

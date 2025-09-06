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
// import DocumentPicker from 'react-native-document-picker';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import ExcelService from '../services/ExcelService';

const SettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleExportAllData = async () => {
    setLoading(true);
    try {
      const result = await ExcelService.exportAllData();
      Alert.alert(
        result.success ? 'Sucesso' : 'Erro',
        result.message
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportProducts = async () => {
    setLoading(true);
    try {
      const result = await ExcelService.exportProducts();
      Alert.alert(
        result.success ? 'Sucesso' : 'Erro',
        result.message
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar produtos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFinancialReport = async () => {
    setLoading(true);
    try {
      const result = await ExcelService.exportFinancialReport();
      Alert.alert(
        result.success ? 'Sucesso' : 'Erro',
        result.message
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar relatório: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportProducts = async () => {
    Alert.alert(
      'Funcionalidade em Desenvolvimento',
      'A funcionalidade de importação será implementada em uma versão futura. Por enquanto, você pode exportar seus dados para backup.'
    );
  };

  const ExportCard = ({ title, description, onPress, icon, color = '#2E86AB' }) => (
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

  const ImportCard = ({ title, description, onPress, icon, color = '#28A745' }) => (
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
        rightComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Exportar Dados</Text>
          <Text style={styles.sectionDescription}>
            Exporte seus dados para planilhas Excel para backup ou análise externa.
          </Text>
          
          <ExportCard
            title="Todos os Dados"
            description="Exporta produtos, clientes, vendas e pedidos em planilhas separadas"
            onPress={handleExportAllData}
            icon="📋"
            color="#2E86AB"
          />
          
          <ExportCard
            title="Apenas Produtos"
            description="Exporta apenas a lista de produtos com preços e estoque"
            onPress={handleExportProducts}
            icon="📦"
            color="#17A2B8"
          />
          
          <ExportCard
            title="Relatório Financeiro"
            description="Exporta vendas e relatório de produtos mais vendidos"
            onPress={handleExportFinancialReport}
            icon="💰"
            color="#FFC107"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📥 Importar Dados</Text>
          <Text style={styles.sectionDescription}>
            Importe dados de planilhas Excel para o aplicativo.
          </Text>
          
          <ImportCard
            title="Importar Produtos"
            description="Importa produtos de uma planilha Excel (formato específico)"
            onPress={handleImportProducts}
            icon="📦"
            color="#28A745"
          />
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
    backgroundColor: '#F8F9FA',
  },
  closeButton: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6C757D',
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
    color: '#333333',
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 14,
    color: '#6C757D',
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
    color: '#333333',
    marginBottom: 4,
  },
  importDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  importButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  infoList: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#2E86AB',
    fontWeight: '600',
  },
});

export default SettingsScreen;

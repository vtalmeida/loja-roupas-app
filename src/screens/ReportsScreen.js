import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Card from '../components/Card';
import Database from '../database/database';

const ReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState({
    salesReport: null,
    topProducts: [],
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalSales: 0,
    totalToReceive: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      await Database.init();
      
      const [orders, topProducts] = await Promise.all([
        Database.getOrders(),
        Database.getTopProducts(5),
      ]);

      // Considerar apenas pedidos pagos para vendas
      const paidOrders = orders.filter(order => order.status === 'paid');
      
      // Calcular valores apenas dos pedidos pagos
      const totalRevenue = paidOrders.reduce((sum, order) => {
        const product = topProducts.find(p => p.id === order.product_id);
        return sum + ((product?.sale_price || 0) * order.quantity);
      }, 0);
      
      const totalCost = paidOrders.reduce((sum, order) => {
        const product = topProducts.find(p => p.id === order.product_id);
        return sum + ((product?.cost_price || 0) * order.quantity);
      }, 0);
      
      const totalProfit = totalRevenue - totalCost;
      
      // Calcular "a receber" - pedidos com status "encomenda" e com cliente
      const ordersToReceive = orders.filter(order => 
        order.status === 'order' && order.customer_id
      );
      
      const totalToReceive = ordersToReceive.reduce((sum, order) => {
        const product = topProducts.find(p => p.id === order.product_id);
        return sum + ((product?.sale_price || 0) * order.quantity);
      }, 0);

      // Relatório dos últimos 30 dias (apenas pedidos pagos)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentPaidOrders = paidOrders.filter(order => 
        new Date(order.created_at) >= thirtyDaysAgo
      );

      const recentRevenue = recentPaidOrders.reduce((sum, order) => {
        const product = topProducts.find(p => p.id === order.product_id);
        return sum + ((product?.sale_price || 0) * order.quantity);
      }, 0);
      
      const recentCost = recentPaidOrders.reduce((sum, order) => {
        const product = topProducts.find(p => p.id === order.product_id);
        return sum + ((product?.cost_price || 0) * order.quantity);
      }, 0);
      
      const recentProfit = recentRevenue - recentCost;

      setReports({
        salesReport: {
          total_sales: recentPaidOrders.length,
          total_revenue: recentRevenue,
          total_cost: recentCost,
          total_profit: recentProfit,
        },
        topProducts,
        totalRevenue,
        totalCost,
        totalProfit,
        totalSales: paidOrders.length,
        totalToReceive,
        totalOrders: orders.length,
      });
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = '#2E86AB' }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );

  const renderTopProduct = ({ item, index }) => (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productRank}>#{index + 1}</Text>
        <Text style={styles.productName}>{item.name}</Text>
      </View>
      <View style={styles.productStats}>
        <Text style={styles.productStat}>
          <Text style={styles.statLabel}>Vendidos:</Text> {item.total_sold}
        </Text>
        <Text style={styles.productStat}>
          <Text style={styles.statLabel}>Receita:</Text> R$ {(item.total_revenue || 0).toFixed(2)}
        </Text>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Relatórios" 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando relatórios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Relatórios" 
        rightComponent={
          <TouchableOpacity onPress={loadReports}>
            <Text style={styles.refreshButton}>🔄</Text>
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Geral</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total de Vendas (Pagas)" 
              value={reports.totalSales} 
              color="#17A2B8"
            />
            <StatCard 
              title="Receita Total" 
              value={`R$ ${(reports.totalRevenue || 0).toFixed(2)}`} 
              color="#28A745"
            />
            <StatCard 
              title="Custo Total" 
              value={`R$ ${(reports.totalCost || 0).toFixed(2)}`} 
              color="#FFC107"
            />
            <StatCard 
              title="Lucro Total" 
              value={`R$ ${(reports.totalProfit || 0).toFixed(2)}`} 
              color="#DC3545"
            />
            <StatCard 
              title="A Receber" 
              value={`R$ ${(reports.totalToReceive || 0).toFixed(2)}`} 
              color="#6F42C1"
              subtitle="Pedidos em encomenda"
            />
            <StatCard 
              title="Total de Pedidos" 
              value={reports.totalOrders} 
              color="#6C757D"
            />
          </View>
        </View>

        {reports.salesReport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Últimos 30 Dias</Text>
            <View style={styles.statsGrid}>
              <StatCard 
                title="Vendas" 
                value={reports.salesReport.total_sales} 
                color="#17A2B8"
              />
              <StatCard 
                title="Receita" 
                value={`R$ ${(reports.salesReport.total_revenue || 0).toFixed(2)}`} 
                color="#28A745"
              />
              <StatCard 
                title="Custo" 
                value={`R$ ${(reports.salesReport.total_cost || 0).toFixed(2)}`} 
                color="#FFC107"
              />
              <StatCard 
                title="Lucro" 
                value={`R$ ${(reports.salesReport.total_profit || 0).toFixed(2)}`} 
                color="#DC3545"
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
          {reports.topProducts.length > 0 ? (
            <FlatList
              data={reports.topProducts}
              renderItem={renderTopProduct}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          ) : (
            <Card>
              <Text style={styles.noDataText}>Nenhum produto vendido ainda</Text>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análise de Lucratividade</Text>
          <Card>
            <View style={styles.profitAnalysis}>
              <Text style={styles.analysisTitle}>Margem de Lucro</Text>
              <Text style={styles.analysisValue}>
                {(reports.totalRevenue || 0) > 0 
                  ? `${(((reports.totalProfit || 0) / (reports.totalRevenue || 1)) * 100).toFixed(1)}%`
                  : '0%'
                }
              </Text>
              <Text style={styles.analysisSubtitle}>
                {(reports.totalRevenue || 0) > 0 
                  ? `R$ ${(reports.totalProfit || 0).toFixed(2)} de lucro em R$ ${(reports.totalRevenue || 0).toFixed(2)} de receita`
                  : 'Nenhuma venda realizada'
                }
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
          <Card>
            <View style={styles.financialSummary}>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Receita Total:</Text>
                <Text style={[styles.financialValue, styles.positiveValue]}>
                  R$ {(reports.totalRevenue || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Custo Total:</Text>
                <Text style={[styles.financialValue, styles.negativeValue]}>
                  -R$ {(reports.totalCost || 0).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.financialRow, styles.financialTotal]}>
                <Text style={styles.financialLabel}>Lucro Líquido:</Text>
                <Text style={[
                  styles.financialValue, 
                  (reports.totalProfit || 0) >= 0 ? styles.positiveValue : styles.negativeValue
                ]}>
                  R$ {(reports.totalProfit || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  refreshButton: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    padding: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#6C757D',
  },
  productCard: {
    marginBottom: 8,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productStat: {
    fontSize: 14,
    color: '#333333',
  },
  statLabel: {
    fontWeight: '600',
    color: '#2E86AB',
  },
  noDataText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  profitAnalysis: {
    alignItems: 'center',
    padding: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  analysisValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 4,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  financialSummary: {
    padding: 16,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  financialTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#2E86AB',
    marginTop: 8,
    paddingTop: 16,
  },
  financialLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveValue: {
    color: '#28A745',
  },
  negativeValue: {
    color: '#DC3545',
  },
});

export default ReportsScreen;

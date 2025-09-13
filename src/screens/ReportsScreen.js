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
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import Card from '../components/Card';
import Database from '../database/database';
import colors from '../theme/colors';

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

  // Recarregar dados sempre que a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    try {
      setLoading(true);
      await Database.init();
      
      const [orders, topProducts, orderItemsWithCosts] = await Promise.all([
        Database.getOrders(),
        Database.getTopProducts(10), // Aumentar para 10 produtos
        Database.getAllOrderItemsWithCosts(),
      ]);

      // Calcular valores baseados no valor pago de todos os pedidos
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.paid_amount || 0);
      }, 0);
      
      // Calcular custo total real - valor que você gastou com todos os produtos
      const totalCost = orderItemsWithCosts.reduce((sum, item) => {
        return sum + (item.cost_price * item.quantity);
      }, 0);
      
      const totalProfit = totalRevenue - totalCost;
      
      // Calcular "a receber" - diferença entre total e valor pago de todos os pedidos
      const totalToReceive = orders.reduce((sum, order) => {
        const remaining = (order.total_amount || 0) - (order.paid_amount || 0);
        return sum + Math.max(0, remaining); // Só considerar valores positivos
      }, 0);

      // Relatório dos últimos 30 dias (valores pagos)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = orders.filter(order => 
        new Date(order.created_at) >= thirtyDaysAgo
      );

      const recentRevenue = recentOrders.reduce((sum, order) => {
        return sum + (order.paid_amount || 0);
      }, 0);
      
      // Calcular custo dos últimos 30 dias baseado nos itens reais
      const recentOrderItems = orderItemsWithCosts.filter(item => {
        const order = orders.find(o => o.id === item.order_id);
        return order && new Date(order.created_at) >= thirtyDaysAgo;
      });
      
      const recentCost = recentOrderItems.reduce((sum, item) => {
        return sum + (item.cost_price * item.quantity);
      }, 0);
      
      const recentProfit = recentRevenue - recentCost;

      // Contar pedidos que têm valor pago
      const paidOrdersCount = orders.filter(order => (order.paid_amount || 0) > 0).length;
      const recentPaidOrdersCount = recentOrders.filter(order => (order.paid_amount || 0) > 0).length;

      setReports({
        salesReport: {
          total_sales: recentPaidOrdersCount,
          total_revenue: recentRevenue,
          total_cost: recentCost,
          total_profit: recentProfit,
        },
        topProducts,
        totalRevenue,
        totalCost,
        totalProfit,
        totalSales: paidOrdersCount,
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

  const StatCard = ({ title, value, subtitle, color = colors.primary }) => (
    <Card noMargin style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );

  const ProductCard = ({ item, index }) => (
    <View style={styles.productRow}>
      <View style={styles.rankContainer}>
        <Text style={styles.productRank}>{index + 1}º</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.productStats}>
          <Text style={styles.productStat}>
            <Text style={styles.statLabel}>Vendidos:</Text> {item.total_sold}
          </Text>
          <Text style={styles.productStat}>
            <Text style={styles.statLabel}>Receita:</Text> R$ {(item.total_revenue || 0).toFixed(2).replace('.', ',')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTopProduct = ({ item, index }) => (
    <ProductCard item={item} index={index} />
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
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Geral</Text>
          <View style={styles.statsGrid}>
            {/* Primeira linha */}
            <StatCard 
              title="Total de Vendas (Com Pagamento)" 
              value={reports.totalSales} 
              color={colors.info}
            />
            <StatCard 
              title="Total de Pedidos" 
              value={reports.totalOrders} 
              color={colors.textMuted}
            />
            {/* Segunda linha */}
            <StatCard 
              title="Custo Total" 
              value={`R$ ${(reports.totalCost || 0).toFixed(2).replace('.', ',')}`} 
              color={colors.warning}
            />
            <StatCard 
              title="Receita Total" 
              value={`R$ ${(reports.totalRevenue || 0).toFixed(2).replace('.', ',')}`} 
              color={colors.success}
            />
            {/* Terceira linha */}
            <StatCard 
              title="Lucro Total" 
              value={`R$ ${(reports.totalProfit || 0).toFixed(2).replace('.', ',')}`} 
              color={colors.error}
            />
            <StatCard 
              title="A Receber" 
              value={`R$ ${(reports.totalToReceive || 0).toFixed(2).replace('.', ',')}`} 
              color={colors.accent}
              subtitle="Valores pendentes"
            />
          </View>
        </View>

        {reports.salesReport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Últimos 30 Dias</Text>
            <View style={styles.statsGrid}>
              {/* Primeira linha */}
              <StatCard 
                title="Vendas" 
                value={reports.salesReport.total_sales} 
                color={colors.info}
              />
              <StatCard 
                title="Receita" 
                value={`R$ ${(reports.salesReport.total_revenue || 0).toFixed(2).replace('.', ',')}`} 
                color={colors.success}
              />
              {/* Segunda linha */}
              <StatCard 
                title="Custo" 
                value={`R$ ${(reports.salesReport.total_cost || 0).toFixed(2).replace('.', ',')}`} 
                color={colors.warning}
              />
              <StatCard 
                title="Lucro" 
                value={`R$ ${(reports.salesReport.total_profit || 0).toFixed(2).replace('.', ',')}`} 
                color={colors.error}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
          {reports.topProducts.length > 0 ? (
            <Card>
              <FlatList
                data={reports.topProducts}
                renderItem={renderTopProduct}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </Card>
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
                  ? `R$ ${(reports.totalProfit || 0).toFixed(2).replace('.', ',')} de lucro em R$ ${(reports.totalRevenue || 0).toFixed(2).replace('.', ',')} de receita`
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
                  R$ {(reports.totalRevenue || 0).toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Custo Total:</Text>
                <Text style={[styles.financialValue, styles.negativeValue]}>
                  -R$ {(reports.totalCost || 0).toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={[styles.financialRow, styles.financialTotal]}>
                <Text style={styles.financialLabel}>Lucro Líquido:</Text>
                <Text style={[
                  styles.financialValue, 
                  (reports.totalProfit || 0) >= 0 ? styles.positiveValue : styles.negativeValue
                ]}>
                  R$ {(reports.totalProfit || 0).toFixed(2).replace('.', ',')}
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
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    padding: 12,
    minHeight: 80,
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    lineHeight: 16,
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  productRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productStat: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statLabel: {
    fontWeight: '600',
    color: colors.primary,
  },
  noDataText: {
    fontSize: 16,
    color: colors.textMuted,
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  analysisValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 4,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
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
    borderBottomColor: colors.border,
  },
  financialTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: 8,
    paddingTop: 16,
  },
  financialLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveValue: {
    color: colors.success,
  },
  negativeValue: {
    color: colors.error,
  },
});

export default ReportsScreen;

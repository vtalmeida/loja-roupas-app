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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import CurrencyInput from '../components/CurrencyInput';
import InlineDropdown from '../components/InlineDropdown';
import ProductSelector from '../components/ProductSelector';
import FilterModal from '../components/FilterModal';
import SuccessModal from '../components/SuccessModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Database from '../database/database';
import { formatCurrency, cleanCurrencyValue } from '../utils/formatters';
import colors from '../theme/colors';

const statusColors = {
  with_customer: colors.info,
  paid: colors.success,
  order: colors.error,
};

const OrdersScreen = ({ navigation, route }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [formData, setFormData] = useState({
    customer_id: '',
    status: 'with_customer',
    notes: '',
    paid_amount: '',
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  const statusLabels = {
    order: 'Encomenda',
    with_customer: 'Com Cliente',
    paid: 'Pago',
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recarregar dados sempre que a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, statusFilter, customerFilter, sortOrder]);

  useEffect(() => {
    const checkPendingAction = async () => {
      try {
        const pendingAction = await AsyncStorage.getItem('pendingAction');
        if (pendingAction === 'newOrder') {
          // Limpar a ação pendente
          await AsyncStorage.removeItem('pendingAction');
          // Abrir o modal após um pequeno delay
          setTimeout(() => {
            handleNewOrder();
          }, 500);
        }
      } catch (error) {
        console.error('Erro ao verificar ação pendente:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', checkPendingAction);

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      await Database.init();
      const [ordersData, productsData, customersData] = await Promise.all([
        Database.getOrders(),
        Database.getProducts(),
        Database.getCustomers(),
      ]);
      
      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    }
  };


  const applyFiltersAndSort = () => {
    let filtered = [...orders];

    // Aplicar filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Aplicar filtro de cliente
    if (customerFilter !== 'all') {
      filtered = filtered.filter(order => order.customer_id.toString() === customerFilter);
    }

    // Aplicar ordenação por ID do pedido (ordem decrescente)
    filtered.sort((a, b) => {
      return b.id - a.id; // Ordem decrescente por ID
    });

    setFilteredOrders(filtered);
  };

  const handleNewOrder = async () => {
    // Recarregar dados antes de abrir o modal
    await loadData();
    
    setEditingOrder(null);
    setFormData({
      customer_id: '',
      status: 'with_customer',
      notes: '',
      paid_amount: '',
    });
    setSelectedProducts([]);
    setModalVisible(true);
  };

  const handleEditOrder = async (order) => {
    // Recarregar dados antes de abrir o modal
    await loadData();
    
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id.toString(),
      status: order.status,
      notes: order.notes || '',
      paid_amount: (order.paid_amount || 0).toFixed(2).replace('.', ','),
    });
    
    // Carregar itens do pedido
    const orderItems = await Database.getOrderItems(order.id);
    // Adicionar campo unit_price_text para cada item
    const orderItemsWithText = orderItems.map(item => ({
      ...item,
      unit_price_text: item.unit_price > 0 ? item.unit_price.toFixed(2).replace('.', ',') : ''
    }));
    setSelectedProducts(orderItemsWithText);
    setModalVisible(true);
  };

  const handleSaveOrder = async () => {
    if (!formData.customer_id || selectedProducts.length === 0) {
      Alert.alert('Erro', 'Selecione um cliente e pelo menos um produto');
      return;
    }

    try {
      const totalAmount = selectedProducts.reduce((total, product) => total + product.total_price, 0);
      
      const orderData = {
        customer_id: parseInt(formData.customer_id),
        status: formData.status,
        notes: formData.notes,
        total_amount: totalAmount,
        paid_amount: parseFloat(cleanCurrencyValue(formData.paid_amount)) || 0,
      };

      if (editingOrder) {
        // Atualizar pedido existente
        await Database.updateOrderStatus(editingOrder.id, formData.status);
        await Database.updateOrderPaidAmount(editingOrder.id, parseFloat(cleanCurrencyValue(formData.paid_amount)) || 0);
        await Database.updateOrderTotal(editingOrder.id, totalAmount);
        
        // Remover todos os itens existentes do pedido
        await Database.deleteOrderItems(editingOrder.id);
        
        // Adicionar os novos itens do pedido
        for (const product of selectedProducts) {
          await Database.addOrderItem({
            order_id: editingOrder.id,
            product_id: product.id,
            quantity: product.quantity,
            unit_price: product.unit_price,
            total_price: product.total_price,
          });
        }
        
        showSuccessModal('Pedido atualizado com sucesso');
      } else {
        // Criar novo pedido
        const orderId = await Database.addOrder(orderData);
        
        // Adicionar itens do pedido
        for (const product of selectedProducts) {
          await Database.addOrderItem({
            order_id: orderId,
            product_id: product.id,
            quantity: product.quantity,
            unit_price: product.unit_price,
            total_price: product.total_price,
          });
        }
        
        showSuccessModal('Pedido criado com sucesso');
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      Alert.alert('Erro', 'Não foi possível salvar o pedido');
    }
  };

  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setDeleteModalVisible(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      await Database.deleteOrder(orderToDelete.id);
      showSuccessModal('Pedido excluído com sucesso');
      setDeleteModalVisible(false);
      setOrderToDelete(null);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      Alert.alert('Erro', 'Não foi possível excluir o pedido');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await Database.updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  const handleApplyFilters = (filters) => {
    setStatusFilter(filters.statusFilter);
    setCustomerFilter(filters.customerFilter);
    setSortOrder(filters.sortOrder);
  };

  const updatePaidAmount = async (orderId, paidAmount) => {
    try {
      await Database.updateOrderPaidAmount(orderId, paidAmount);
      showSuccessModal('Valor pago atualizado');
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar valor pago:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o valor pago');
    }
  };


  const renderOrder = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Pedido Nº {item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
          <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Cliente:</Text> {item.customer_name}
        </Text>
        <Text style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Total:</Text> R$ {formatCurrency(item.total_amount || 0)}
        </Text>
        <Text style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Pago:</Text> R$ {formatCurrency(item.paid_amount || 0)}
        </Text>
        <Text style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Restante:</Text> R$ {formatCurrency((item.total_amount || 0) - (item.paid_amount || 0))}
        </Text>
        {item.notes && (
          <Text style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Observações:</Text> {item.notes}
          </Text>
        )}
        <Text style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Data:</Text> {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.orderActions}>
        <View style={styles.statusButtons}>
          {Object.keys(statusLabels).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                item.status === status && {
                  backgroundColor: statusColors[status],
                  borderColor: statusColors[status],
                }
              ]}
              onPress={() => updateOrderStatus(item.id, status)}
            >
              <Text style={[
                styles.statusButtonText,
                item.status === status && styles.statusButtonTextActive
              ]}>
                {statusLabels[status]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={() => handleEditOrder(item)}
            style={styles.actionButton}
          >
            <Text style={styles.editButton}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteOrder(item)}
            style={styles.actionButton}
          >
            <Text style={styles.deleteButton}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const getStatusCounts = () => {
    const counts = {};
    Object.keys(statusLabels).forEach(status => {
      counts[status] = orders.filter(order => order.status === status).length;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Pedidos" 
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(true)}
              
            >
              <Text style={styles.filterButtonText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNewOrder}>
              <Text style={styles.addButton}>+</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total de pedidos: {filteredOrders.length}
          </Text>
          <View style={styles.statusSummary}>
            {Object.keys(statusLabels).map(status => (
              <View key={status} style={styles.statusSummaryItem}>
                <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
                <Text style={styles.statusSummaryText}>
                  {statusLabels[status]}: {statusCounts[status]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
      >
        <View style={styles.form}>
          <InlineDropdown
            label="Cliente *"
            placeholder="Selecione um cliente"
            data={customers}
            value={formData.customer_id}
            onSelect={(value) => setFormData({ ...formData, customer_id: value })}
            searchKey="name"
            displayKey="name"
          />

          <ProductSelector
            products={products}
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status *</Text>
            <View style={styles.statusButtons}>
              {Object.keys(statusLabels).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    formData.status === status && {
                      backgroundColor: statusColors[status],
                      borderColor: statusColors[status],
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, status })}
                >
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === status && styles.statusButtonTextActive
                  ]}>
                    {statusLabels[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <CurrencyInput
            label="Valor Pago"
            value={formData.paid_amount}
            onChangeText={(text) => setFormData({ ...formData, paid_amount: text })}
            placeholder="0,00"
          />

          <Input
            label="Observações"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Observações sobre o pedido"
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={() => setModalVisible(false)}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title={editingOrder ? 'Atualizar' : 'Salvar'}
              onPress={handleSaveOrder}
              style={styles.button}
            />
          </View>
        </View>
      </Modal>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        customers={customers}
        statusLabels={statusLabels}
        statusFilter={statusFilter}
        customerFilter={customerFilter}
        sortOrder={sortOrder}
      />

      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        message={successMessage}
      />

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        title="Confirmar Exclusão"
        message={`Deseja realmente excluir o pedido #${orderToDelete?.id}?`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  filterButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addButton: {
    marginLeft: 16,
    fontSize: 28,
    color: '#D61A75',
    fontWeight: 'bold',
  },
  summary: {
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    margin: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  statusSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusSummaryText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  listContainer: {
    padding: 16,
  },
  saleCard: {
    marginBottom: 12,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  saleDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  saleDetails: {
    marginTop: 8,
  },
  saleDetail: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderDetail: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: colors.primary,
  },
  orderActions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusButtonActive: {
  },
  statusButtonText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  editButton: {
    fontSize: 16,
    color: colors.primary,
  },
  deleteButton: {
    fontSize: 16,
    color: colors.error,
  },
  form: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    padding: 8,
    margin: 4,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  optionSelected: {
  },
  optionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  filterButtonActive: {
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  sortButtonActive: {
  },
  sortButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  statusButtonActive: {
  },
  statusButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default OrdersScreen;

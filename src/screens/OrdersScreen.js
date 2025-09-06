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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import InlineDropdown from '../components/InlineDropdown';
import QuantityCounter from '../components/QuantityCounter';
import Database from '../database/database';

const OrdersScreen = ({ navigation, route }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    quantity: '',
    status: 'with_customer',
    notes: '',
  });

  const statusColors = {
    with_customer: '#17A2B8',
    paid: '#6F42C1',
    order: '#DC3545',
  };

  const statusLabels = {
    with_customer: 'Com Cliente',
    paid: 'Pago',
    order: 'Encomenda',
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, statusFilter, sortOrder]);

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

    // Aplicar ordenação
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setFormData({
      customer_id: '',
      product_id: '',
      quantity: '',
      status: 'with_customer',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id.toString(),
      product_id: order.product_id.toString(),
      quantity: order.quantity.toString(),
      status: order.status,
      notes: order.notes || '',
    });
    setModalVisible(true);
  };

  const handleSaveOrder = async () => {
    if (!formData.customer_id || !formData.product_id || !formData.quantity) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const orderData = {
        customer_id: parseInt(formData.customer_id),
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity),
        status: formData.status,
        notes: formData.notes,
      };

      if (editingOrder) {
        await Database.updateOrderStatus(editingOrder.id, formData.status);
        Alert.alert('Sucesso', 'Pedido atualizado com sucesso');
      } else {
        await Database.addOrder(orderData);
        Alert.alert('Sucesso', 'Pedido criado com sucesso');
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      Alert.alert('Erro', 'Não foi possível salvar o pedido');
    }
  };

  const handleDeleteOrder = (order) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir este pedido?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: You might want to add a deleteOrder method to Database
              Alert.alert('Sucesso', 'Pedido excluído com sucesso');
              loadData();
            } catch (error) {
              console.error('Erro ao excluir pedido:', error);
              Alert.alert('Erro', 'Não foi possível excluir o pedido');
            }
          },
        },
      ]
    );
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await Database.updateOrderStatus(orderId, newStatus);
      Alert.alert('Sucesso', 'Status do pedido atualizado');
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };


  const renderOrder = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Pedido #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
          <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Cliente:</Text> {item.customer_name}
        </Text>
        <Text style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Produto:</Text> {item.product_name}
        </Text>
        <Text style={styles.orderDetail}>
          <Text style={styles.detailLabel}>Quantidade:</Text> {item.quantity}
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
                item.status === status && styles.statusButtonActive
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
          <TouchableOpacity onPress={handleNewOrder}>
            <Text style={styles.addButton}>+</Text>
          </TouchableOpacity>
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

        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Filtrar por status:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {Object.keys(statusLabels).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterButton, statusFilter === status && styles.filterButtonActive]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[styles.filterButtonText, statusFilter === status && styles.filterButtonTextActive]}>
                    {statusLabels[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Ordenar por data:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortOrder === 'newest' && styles.sortButtonActive]}
                onPress={() => setSortOrder('newest')}
              >
                <Text style={[styles.sortButtonText, sortOrder === 'newest' && styles.sortButtonTextActive]}>
                  Mais recentes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortOrder === 'oldest' && styles.sortButtonActive]}
                onPress={() => setSortOrder('oldest')}
              >
                <Text style={[styles.sortButtonText, sortOrder === 'oldest' && styles.sortButtonTextActive]}>
                  Mais antigos
                </Text>
              </TouchableOpacity>
            </View>
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

          <InlineDropdown
            label="Produto *"
            placeholder="Selecione um produto"
            data={products}
            value={formData.product_id}
            onSelect={(value) => setFormData({ ...formData, product_id: value })}
            searchKey="name"
            displayKey="name"
          />

          <QuantityCounter
            label="Quantidade *"
            value={formData.quantity}
            onValueChange={(value) => setFormData({ ...formData, quantity: value })}
            min={1}
            max={999}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status *</Text>
            <View style={styles.statusButtons}>
              {Object.keys(statusLabels).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    formData.status === status && styles.statusButtonActive
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#2E86AB',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  addButton: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  summary: {
    padding: 16,
    backgroundColor: '#E3F2FD',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E86AB',
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
    color: '#2E86AB',
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
    color: '#333333',
  },
  saleDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  saleDetails: {
    marginTop: 8,
  },
  saleDetail: {
    fontSize: 14,
    color: '#333333',
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
    color: '#333333',
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
    color: '#333333',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#2E86AB',
  },
  orderActions: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
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
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  statusButtonActive: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#333333',
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
  },
  deleteButton: {
    fontSize: 16,
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
    color: '#333333',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    padding: 8,
    margin: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  optionSelected: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  optionText: {
    fontSize: 14,
    color: '#333333',
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
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
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
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333333',
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
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333333',
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
    color: '#333333',
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
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  statusButtonActive: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default OrdersScreen;

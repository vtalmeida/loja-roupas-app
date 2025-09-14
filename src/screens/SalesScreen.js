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
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Database from '../database/database';

const SalesScreen = ({ navigation }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    payment_method: 'dinheiro',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Database.init();
      const [salesData, productsData, customersData] = await Promise.all([
        Database.getSales(),
        Database.getProducts(),
        Database.getCustomers(),
      ]);
      
      setSales(salesData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    }
  };

  const handleNewSale = () => {
    setSelectedProducts([]);
    setFormData({
      customer_id: '',
      payment_method: 'dinheiro',
    });
    setModalVisible(true);
  };

  const addProductToSale = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === product.id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const removeProductFromSale = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeProductFromSale(productId);
    } else {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === productId 
          ? { ...p, quantity: quantity }
          : p
      ));
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.sale_price * product.quantity);
    }, 0);
  };

  const calculateCost = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.cost_price * product.quantity);
    }, 0);
  };

  const calculateProfit = () => {
    return calculateTotal() - calculateCost();
  };

  const handleSaveSale = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um produto');
      return;
    }

    try {
      const totalAmount = calculateTotal();
      const totalCost = calculateCost();
      const profit = calculateProfit();

      // Criar a venda
      const saleId = await Database.addSale({
        customer_id: formData.customer_id || null,
        total_amount: totalAmount,
        total_cost: totalCost,
        profit: profit,
        payment_method: formData.payment_method,
        status: 'completed',
      });

      // Adicionar os itens da venda
      for (const product of selectedProducts) {
        await Database.addSaleItem({
          sale_id: saleId,
          product_id: product.id,
          quantity: product.quantity,
          unit_price: product.sale_price,
          total_price: product.sale_price * product.quantity,
        });

        // Atualizar estoque do produto
        const updatedQuantity = product.quantity - product.quantity;
        await Database.updateProduct(product.id, {
          ...product,
          quantity: updatedQuantity,
        });
      }

      Alert.alert('Sucesso', 'Venda realizada com sucesso');
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      Alert.alert('Erro', 'Não foi possível salvar a venda');
    }
  };

  const renderSale = ({ item }) => (
    <Card style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <Text style={styles.saleId}>Venda #{item.id}</Text>
        <Text style={styles.saleDate}>
          {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      
      <View style={styles.saleDetails}>
        <Text style={styles.saleDetail}>
          <Text style={styles.detailLabel}>Cliente:</Text> {item.customer_name || 'Cliente não informado'}
        </Text>
        <Text style={styles.saleDetail}>
          <Text style={styles.detailLabel}>Total:</Text> R$ {(item.total_amount || 0).toFixed(2)}
        </Text>
        <Text style={styles.saleDetail}>
          <Text style={styles.detailLabel}>Custo:</Text> R$ {(item.total_cost || 0).toFixed(2)}
        </Text>
        <Text style={styles.saleDetail}>
          <Text style={styles.detailLabel}>Lucro:</Text> R$ {(item.profit || 0).toFixed(2)}
        </Text>
        <Text style={styles.saleDetail}>
          <Text style={styles.detailLabel}>Pagamento:</Text> {item.payment_method}
        </Text>
      </View>
    </Card>
  );

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => addProductToSale(item)}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>R$ {(item.sale_price || 0).toFixed(2)}</Text>
      </View>
      <Text style={styles.addButton}>+</Text>
    </TouchableOpacity>
  );

  const renderSelectedProduct = ({ item }) => (
    <View style={styles.selectedProductItem}>
      <View style={styles.selectedProductInfo}>
        <Text style={styles.selectedProductName}>{item.name}</Text>
        <Text style={styles.selectedProductPrice}>
          R$ {(item.sale_price || 0).toFixed(2)} x {item.quantity} = R$ {((item.sale_price || 0) * item.quantity).toFixed(2)}
        </Text>
      </View>
      <View style={styles.selectedProductActions}>
        <TouchableOpacity 
          onPress={() => updateProductQuantity(item.id, item.quantity - 1)}
          style={styles.quantityButton}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity 
          onPress={() => updateProductQuantity(item.id, item.quantity + 1)}
          style={styles.quantityButton}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => removeProductFromSale(item.id)}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Vendas" 
        rightComponent={
          <TouchableOpacity onPress={handleNewSale}>
            <Text style={styles.addButton}>+</Text>
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total de vendas: {sales.length}
          </Text>
        </View>
        
        <FlatList
          data={sales}
          renderItem={renderSale}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Nova Venda"
      >
        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cliente (Opcional)</Text>
            <View style={styles.customerSelector}>
              {customers.map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerOption,
                    formData.customer_id === customer.id && styles.customerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, customer_id: customer.id })}
                >
                  <Text style={[
                    styles.customerOptionText,
                    formData.customer_id === customer.id && styles.customerOptionTextSelected
                  ]}>
                    {customer.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produtos Disponíveis</Text>
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              style={styles.productsList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {selectedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Produtos Selecionados</Text>
              <FlatList
                data={selectedProducts}
                renderItem={renderSelectedProduct}
                keyExtractor={(item) => item.id.toString()}
                style={styles.selectedProductsList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
            <View style={styles.paymentSelector}>
              {['dinheiro', 'cartão', 'pix'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentOption,
                    formData.payment_method === method && styles.paymentOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, payment_method: method })}
                >
                  <Text style={[
                    styles.paymentOptionText,
                    formData.payment_method === method && styles.paymentOptionTextSelected
                  ]}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedProducts.length > 0 && (
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total: R$ {(calculateTotal() || 0).toFixed(2)}</Text>
              <Text style={styles.profitLabel}>Lucro: R$ {(calculateProfit() || 0).toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={() => setModalVisible(false)}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title="Finalizar Venda"
              onPress={handleSaveSale}
              style={styles.button}
              disabled={selectedProducts.length === 0}
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
  content: {
    flex: 1,
  },
  addButton: {
    fontSize: 28,
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
  detailLabel: {
    fontWeight: '600',
    color: '#2E86AB',
  },
  form: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  customerSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customerOption: {
    padding: 8,
    margin: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  customerOptionSelected: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  customerOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  customerOptionTextSelected: {
    color: '#FFFFFF',
  },
  productsList: {
    maxHeight: 150,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 4,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  productPrice: {
    fontSize: 12,
    color: '#6C757D',
  },
  selectedProductsList: {
    maxHeight: 150,
  },
  selectedProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  selectedProductPrice: {
    fontSize: 12,
    color: '#2E86AB',
  },
  selectedProductActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#2E86AB',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginHorizontal: 8,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 16,
  },
  paymentSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  paymentOption: {
    padding: 8,
    margin: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  paymentOptionSelected: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  paymentOptionTextSelected: {
    color: '#FFFFFF',
  },
  totalSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  profitLabel: {
    fontSize: 16,
    color: '#28A745',
    fontWeight: '600',
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
});

export default SalesScreen;

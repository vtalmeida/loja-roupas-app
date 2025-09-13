import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
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
import Database from '../database/database';
import { formatCurrency, cleanCurrencyValue } from '../utils/formatters';
import colors from '../theme/colors';
import SuccessModal from '../components/SuccessModal';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';

const ProductsScreen = ({ navigation, route }) => {
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    cost_price: '',
  });


  useEffect(() => {
    loadProducts();
  }, []);

  // Recarregar dados sempre que a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  useEffect(() => {
    const checkPendingAction = async () => {
      try {
        const pendingAction = await AsyncStorage.getItem('pendingAction');
        if (pendingAction === 'newProduct') {
          // Limpar a ação pendente
          await AsyncStorage.removeItem('pendingAction');
          // Abrir o modal após um pequeno delay
          setTimeout(() => {
            handleAddProduct();
          }, 500);
        }
      } catch (error) {
        console.error('Erro ao verificar ação pendente:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', checkPendingAction);

    return unsubscribe;
  }, [navigation]);

  const loadProducts = async () => {
    try {
      await Database.init();
      const productsData = await Database.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos');
    }
  };

  const formatCurrency = (value) => {
    return (value || 0).toFixed(2).replace('.', ',');
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      quantity: '',
      cost_price: '',
    });
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      quantity: product.quantity.toString(),
      cost_price: product.cost_price.toFixed(2).replace('.', ','),
    });
    setModalVisible(true);
  };

  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.cost_price) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        quantity: parseInt(formData.quantity) || 0,
        cost_price: parseFloat(cleanCurrencyValue(formData.cost_price)),
      };

      if (editingProduct) {
        await Database.updateProduct(editingProduct.id, productData);
        showSuccessModal('Produto atualizado com sucesso');
      } else {
        await Database.addProduct(productData);
        showSuccessModal('Produto adicionado com sucesso');
      }

      setModalVisible(false);
      loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      Alert.alert('Erro', 'Não foi possível salvar o produto');
    }
  };

  const handleDeleteProduct = async (product) => {
    try {
      // Verificar se o produto está sendo usado em pedidos
      const isInUse = await Database.isProductInUse(product.id);
      
      if (isInUse) {
        setErrorMessage(`O produto "${product.name}" está sendo usado em pedidos e não pode ser excluído.`);
        setErrorModalVisible(true);
        return;
      }

      setProductToDelete(product);
      setConfirmModalVisible(true);
    } catch (error) {
      console.error('Erro ao verificar uso do produto:', error);
      setErrorMessage('Não foi possível verificar se o produto está em uso');
      setErrorModalVisible(true);
    }
  };

  const confirmDelete = async () => {
    try {
      await Database.deleteProduct(productToDelete.id);
      showSuccessModal('Produto excluído com sucesso');
      loadProducts();
      setConfirmModalVisible(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      Alert.alert('Erro', 'Não foi possível excluir o produto');
    }
  };

  const renderProduct = ({ item }) => (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.productActions}>
          <TouchableOpacity 
            onPress={() => handleEditProduct(item)}
            style={styles.actionButton}
          >
            <Text style={styles.editButton}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteProduct(item)}
            style={styles.actionButton}
          >
            <Text style={styles.deleteButton}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.productDetails}>
        <Text style={styles.productDetail}>
          <Text style={styles.detailLabel}>Quantidade:</Text> {item.quantity}
        </Text>
        <Text style={styles.productDetail}>
          <Text style={styles.detailLabel}>Preço de Custo:</Text> R$ {formatCurrency(item.cost_price || 0)}
        </Text>
        <Text style={styles.productDetail}>
          <Text style={styles.detailLabel}>Sugestão de Venda (250%):</Text> R$ {formatCurrency((item.cost_price || 0) * 2.5)}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Produtos" 
        rightComponent={
          <TouchableOpacity onPress={handleAddProduct}>
            <Text style={styles.addButton}>+</Text>
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total de produtos: {products.length}
          </Text>
        </View>
        
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
      >
        <View style={styles.form}>
          <Input
            label="Nome do Produto *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Ex: Camiseta Polo"
          />
          
          <Input
            label="Quantidade em Estoque"
            value={formData.quantity}
            onChangeText={(text) => {
              // Aceita apenas números
              const cleanText = text.replace(/[^\d]/g, '');
              setFormData({ ...formData, quantity: cleanText });
            }}
            placeholder="0"
          />
          
          <CurrencyInput
            label="Preço de Custo *"
            value={formData.cost_price}
            onChangeText={(text) => setFormData({ ...formData, cost_price: text })}
            placeholder="0,00"
          />
          
          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={() => setModalVisible(false)}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title={editingProduct ? 'Atualizar' : 'Salvar'}
              onPress={handleSaveProduct}
              style={styles.button}
            />
          </View>
        </View>
      </Modal>

      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        message={successMessage}
      />

      <ConfirmModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Deseja realmente excluir o produto "${productToDelete?.name}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      <ErrorModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="Não é possível excluir"
        message={errorMessage}
        buttonText="OK"
      />
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
  addButton: {
    fontSize: 24,
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
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
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
  productDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  productDetails: {
    marginTop: 8,
  },
  productDetail: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: colors.primary,
  },
  form: {
    flex: 1,
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

export default ProductsScreen;

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
import Database from '../database/database';

const ProductsScreen = ({ navigation, route }) => {
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    color: '',
    quantity: '',
    cost_price: '',
    sale_price: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      size: '',
      color: '',
      quantity: '',
      cost_price: '',
      sale_price: '',
    });
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      size: product.size || '',
      color: product.color || '',
      quantity: product.quantity.toString(),
      cost_price: product.cost_price.toString(),
      sale_price: product.sale_price.toString(),
    });
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.cost_price || !formData.sale_price) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        size: formData.size,
        color: formData.color,
        quantity: parseInt(formData.quantity) || 0,
        cost_price: parseFloat(formData.cost_price),
        sale_price: parseFloat(formData.sale_price),
      };

      if (editingProduct) {
        await Database.updateProduct(editingProduct.id, productData);
        Alert.alert('Sucesso', 'Produto atualizado com sucesso');
      } else {
        await Database.addProduct(productData);
        Alert.alert('Sucesso', 'Produto adicionado com sucesso');
      }

      setModalVisible(false);
      loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      Alert.alert('Erro', 'Não foi possível salvar o produto');
    }
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o produto "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await Database.deleteProduct(product.id);
              Alert.alert('Sucesso', 'Produto excluído com sucesso');
              loadProducts();
            } catch (error) {
              console.error('Erro ao excluir produto:', error);
              Alert.alert('Erro', 'Não foi possível excluir o produto');
            }
          },
        },
      ]
    );
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
          <Text style={styles.detailLabel}>Tamanho:</Text> {item.size || 'Não informado'}
        </Text>
        <Text style={styles.productDetail}>
          <Text style={styles.detailLabel}>Cor:</Text> {item.color || 'Não informado'}
        </Text>
        <Text style={styles.productDetail}>
          <Text style={styles.detailLabel}>Quantidade:</Text> {item.quantity}
        </Text>
        <Text style={styles.productDetail}>
          <Text style={styles.detailLabel}>Preço de Custo:</Text> R$ {(item.cost_price || 0).toFixed(2)}
        </Text>
        <Text style={styles.productDetail}>
          <Text style={styles.detailLabel}>Preço de Venda:</Text> R$ {(item.sale_price || 0).toFixed(2)}
        </Text>
        <Text style={styles.productDetail}>
          <Text style={styles.detailLabel}>Lucro por Peça:</Text> R$ {((item.sale_price || 0) - (item.cost_price || 0)).toFixed(2)}
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
            label="Tamanho"
            value={formData.size}
            onChangeText={(text) => setFormData({ ...formData, size: text })}
            placeholder="Ex: P, M, G, GG"
          />
          
          <Input
            label="Cor"
            value={formData.color}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            placeholder="Ex: Azul, Vermelho, etc."
          />
          
          <Input
            label="Quantidade em Estoque"
            value={formData.quantity}
            onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            placeholder="0"
            keyboardType="numeric"
          />
          
          <Input
            label="Preço de Custo *"
            value={formData.cost_price}
            onChangeText={(text) => setFormData({ ...formData, cost_price: text })}
            placeholder="0.00"
            keyboardType="numeric"
          />
          
          <Input
            label="Preço de Venda *"
            value={formData.sale_price}
            onChangeText={(text) => setFormData({ ...formData, sale_price: text })}
            placeholder="0.00"
            keyboardType="numeric"
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
    color: '#333333',
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
  },
  deleteButton: {
    fontSize: 16,
  },
  productDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  productDetails: {
    marginTop: 8,
  },
  productDetail: {
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

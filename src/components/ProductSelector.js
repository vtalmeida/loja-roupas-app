import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import CurrencyInput from './CurrencyInput';
import { formatCurrency, cleanCurrencyValue } from '../utils/formatters';
import colors from '../theme/colors';

const ProductSelector = ({ 
  products, 
  selectedProducts, 
  onProductsChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Forçar re-renderização quando produtos mudam
  useEffect(() => {
    // Este useEffect garante que o componente seja re-renderizado
    // quando os produtos selecionados mudam
  }, [selectedProducts]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const addProduct = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      // Se já existe, aumenta a quantidade
      const updatedProducts = selectedProducts.map(p => 
        p.id === product.id 
          ? { ...p, quantity: p.quantity + 1, total_price: (p.quantity + 1) * p.unit_price }
          : p
      );
      onProductsChange(updatedProducts);
    } else {
      // Se não existe, adiciona novo produto
      const suggestedPrice = Math.floor(product.cost_price * 2.5 * 100) / 100; // Arredonda para baixo com 2 casas decimais
      const newProduct = {
        ...product,
        quantity: 1,
        unit_price: suggestedPrice,
        total_price: suggestedPrice,
        unit_price_text: suggestedPrice.toFixed(2).replace('.', ',') // Formatação correta com 2 casas decimais
      };
      onProductsChange([...selectedProducts, newProduct]);
    }
    setIsOpen(false);
    setSearchText('');
  };

  const removeProduct = (productId) => {
    const updatedProducts = selectedProducts.filter(p => p.id !== productId);
    onProductsChange(updatedProducts);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }
    
    const updatedProducts = selectedProducts.map(p => 
      p.id === productId 
        ? { ...p, quantity: newQuantity, total_price: newQuantity * p.unit_price }
        : p
    );
    onProductsChange(updatedProducts);
  };

  const updatePrice = (productId, newPrice) => {
    const updatedProducts = selectedProducts.map(p => 
      p.id === productId 
        ? { ...p, unit_price: newPrice, total_price: p.quantity * newPrice }
        : p
    );
    onProductsChange(updatedProducts);
  };

  const updatePriceText = (productId, text) => {
    const price = parseFloat(cleanCurrencyValue(text)) || 0;
    const updatedProducts = selectedProducts.map(p => 
      p.id === productId 
        ? { ...p, unit_price: price, total_price: p.quantity * price, unit_price_text: text }
        : p
    );
    onProductsChange(updatedProducts);
  };

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, product) => total + product.total_price, 0);
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Produtos *</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsOpen(true)}
        >
          <Text style={styles.addButtonText}>+ Adicionar Produto</Text>
        </TouchableOpacity>
      </View>

      {selectedProducts.length > 0 && (
        <View style={styles.selectedProducts}>
          {selectedProducts.map((product) => (
            <View key={product.id} style={styles.productItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name || product.product_name}</Text>
                <Text style={styles.productCost}>
                  Custo: R$ {formatCurrency(product.cost_price)}
                </Text>
              </View>
              
              <View style={styles.productControls}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(product.id, product.quantity - 1)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{product.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(product.id, product.quantity + 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.priceContainer}>
                  <CurrencyInput
                    label="Preço:"
                    value={product.unit_price_text || ''}
                    onChangeText={(text) => updatePriceText(product.id, text)}
                    placeholder="0,00"
                    style={styles.priceInputField}
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeProduct(product.id)}
                >
                  <Text style={styles.removeButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.totalPrice}>
                Total: R$ {formatCurrency(product.total_price)}
              </Text>
            </View>
          ))}
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>
              Total do Pedido: R$ {formatCurrency(getTotalAmount())}
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📦 Selecionar Produto</Text>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produto..."
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            
            <ScrollView
              style={styles.productsList}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEnabled={true}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productOption}
                  onPress={() => addProduct(product)}
                >
                  <View style={styles.productOptionInfo}>
                    <Text style={styles.productOptionName}>{product.name}</Text>
                    <Text style={styles.productOptionCost}>
                      Custo: R$ {formatCurrency(product.cost_price)}
                    </Text>
                    <Text style={styles.productOptionSuggestion}>
                      Sugestão: R$ {formatCurrency(product.cost_price * 2.5)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedProducts: {
    marginTop: 8,
  },
  productItem: {
    backgroundColor: colors.backgroundCard,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productInfo: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  productCost: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputField: {
    marginBottom: 0,
    minWidth: 100,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 16,
    color: colors.error,
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
  },
  totalContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 16,
    fontSize: 16,
    backgroundColor: colors.backgroundSecondary,
    color: colors.textPrimary,
  },
  productsList: {
    maxHeight: 300,
  },
  productOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productOptionInfo: {
    flex: 1,
  },
  productOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  productOptionCost: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productOptionSuggestion: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default ProductSelector;

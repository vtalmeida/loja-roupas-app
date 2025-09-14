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
import MaskedInput from '../components/MaskedInput';
import Database from '../database/database';
import { formatPhone } from '../utils/formatters';
import colors from '../theme/colors';
import SuccessModal from '../components/SuccessModal';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';

const CustomersScreen = ({ navigation, route }) => {
  const [customers, setCustomers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  // Recarregar dados sempre que a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadCustomers();
    }, [])
  );

  useEffect(() => {
    const checkPendingAction = async () => {
      try {
        const pendingAction = await AsyncStorage.getItem('pendingAction');
        if (pendingAction === 'newCustomer') {
          // Limpar a ação pendente
          await AsyncStorage.removeItem('pendingAction');
          // Abrir o modal após um pequeno delay
          setTimeout(() => {
            handleAddCustomer();
          }, 500);
        }
      } catch (error) {
        console.error('Erro ao verificar ação pendente:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', checkPendingAction);

    return unsubscribe;
  }, [navigation]);

  const loadCustomers = async () => {
    try {
      await Database.init();
      const customersData = await Database.getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os clientes');
    }
  };

  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };


  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
    });
    setModalVisible(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
    });
    setModalVisible(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name) {
      Alert.alert('Erro', 'O nome do cliente é obrigatório');
      return;
    }

    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone,
      };

      if (editingCustomer) {
        await Database.updateCustomer(editingCustomer.id, customerData);
        showSuccessModal('Cliente atualizado com sucesso');
      } else {
        await Database.addCustomer(customerData);
        showSuccessModal('Cliente adicionado com sucesso');
      }

      setModalVisible(false);
      loadCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente');
    }
  };

  const handleDeleteCustomer = async (customer) => {
    try {
      // Verificar se o cliente está sendo usado em pedidos
      const isInUse = await Database.isCustomerInUse(customer.id);
      
      if (isInUse) {
        setErrorMessage(`O cliente "${customer.name}" possui pedidos e não pode ser excluído.`);
        setErrorModalVisible(true);
        return;
      }

      setCustomerToDelete(customer);
      setConfirmModalVisible(true);
    } catch (error) {
      console.error('Erro ao verificar uso do cliente:', error);
      setErrorMessage('Não foi possível verificar se o cliente está em uso');
      setErrorModalVisible(true);
    }
  };

  const confirmDelete = async () => {
    try {
      await Database.deleteCustomer(customerToDelete.id);
      showSuccessModal('Cliente excluído com sucesso');
      loadCustomers();
      setConfirmModalVisible(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      Alert.alert('Erro', 'Não foi possível excluir o cliente');
    }
  };

  const renderCustomer = ({ item }) => (
    <Card style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <Text style={styles.customerName}>{item.name}</Text>
        <View style={styles.customerActions}>
          <TouchableOpacity 
            onPress={() => handleEditCustomer(item)}
            style={styles.actionButton}
          >
            <Text style={styles.editButton}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteCustomer(item)}
            style={styles.actionButton}
          >
            <Text style={styles.deleteButton}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.customerDetails}>
        {item.phone && (
          <Text style={styles.customerDetail}>
            <Text style={styles.detailLabel}>📞 Telefone:</Text> {formatPhone(item.phone)}
          </Text>
        )}
        {item.email && (
          <Text style={styles.customerDetail}>
            <Text style={styles.detailLabel}>📧 Email:</Text> {item.email}
          </Text>
        )}
        {item.address && (
          <Text style={styles.customerDetail}>
            <Text style={styles.detailLabel}>📍 Endereço:</Text> {item.address}
          </Text>
        )}
        <Text style={styles.customerDetail}>
          <Text style={styles.detailLabel}>📅 Cadastrado em:</Text> {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Clientes" 
        rightComponent={
          <TouchableOpacity onPress={handleAddCustomer}>
            <Text style={styles.addButton}>+</Text>
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total de clientes: {customers.length}
          </Text>
        </View>
        
        <FlatList
          data={customers}
          renderItem={renderCustomer}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <View style={styles.form}>
          <Input
            label="Nome do Cliente *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Ex: João Silva"
          />
          
          <MaskedInput
            label="Telefone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="(11) 99999-9999"
            mask="phone"
          />
          
          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={() => setModalVisible(false)}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title={editingCustomer ? 'Atualizar' : 'Salvar'}
              onPress={handleSaveCustomer}
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
        message={`Deseja realmente excluir o cliente "${customerToDelete?.name}"?`}
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
  },
  listContainer: {
    padding: 16,
  },
  customerCard: {
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  customerActions: {
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
  customerDetails: {
    marginTop: 8,
  },
  customerDetail: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: colors.primary,
  },
  form: {
    maxHeight: 400,
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

export default CustomersScreen;

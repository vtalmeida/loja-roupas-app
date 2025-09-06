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

const CustomersScreen = ({ navigation, route }) => {
  const [customers, setCustomers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

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
        Alert.alert('Sucesso', 'Cliente atualizado com sucesso');
      } else {
        await Database.addCustomer(customerData);
        Alert.alert('Sucesso', 'Cliente adicionado com sucesso');
      }

      setModalVisible(false);
      loadCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente');
    }
  };

  const handleDeleteCustomer = (customer) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o cliente "${customer.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await Database.deleteCustomer(customer.id);
              Alert.alert('Sucesso', 'Cliente excluído com sucesso');
              loadCustomers();
            } catch (error) {
              console.error('Erro ao excluir cliente:', error);
              Alert.alert('Erro', 'Não foi possível excluir o cliente');
            }
          },
        },
      ]
    );
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
            <Text style={styles.detailLabel}>📞 Telefone:</Text> {item.phone}
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
          
          <Input
            label="Telefone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
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
    color: '#333333',
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
  },
  deleteButton: {
    fontSize: 16,
  },
  customerDetails: {
    marginTop: 8,
  },
  customerDetail: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#2E86AB',
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

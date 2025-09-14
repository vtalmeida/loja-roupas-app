import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import colors from '../theme/colors';

const FilterModal = ({ 
  visible, 
  onClose, 
  onApplyFilters,
  customers,
  statusLabels,
  statusFilter,
  customerFilter,
  sortOrder
}) => {
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localCustomerFilter, setLocalCustomerFilter] = useState(customerFilter);
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder);
  const [searchCustomer, setSearchCustomer] = useState('');

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  const handleApply = () => {
    onApplyFilters({
      statusFilter: localStatusFilter,
      customerFilter: localCustomerFilter,
      sortOrder: localSortOrder
    });
    onClose();
  };

  const handleReset = () => {
    setLocalStatusFilter('all');
    setLocalCustomerFilter('all');
    setLocalSortOrder('newest');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔍 Filtros</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalBody} 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEnabled={true}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Filtro por Status */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    localStatusFilter === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => setLocalStatusFilter('all')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    localStatusFilter === 'all' && styles.filterOptionTextActive
                  ]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {Object.keys(statusLabels).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      localStatusFilter === status && styles.filterOptionActive
                    ]}
                    onPress={() => setLocalStatusFilter(status)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localStatusFilter === status && styles.filterOptionTextActive
                    ]}>
                      {statusLabels[status]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filtro por Cliente */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Cliente</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar cliente..."
                placeholderTextColor={colors.textMuted}
                value={searchCustomer}
                onChangeText={setSearchCustomer}
              />
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    localCustomerFilter === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => setLocalCustomerFilter('all')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    localCustomerFilter === 'all' && styles.filterOptionTextActive
                  ]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {filteredCustomers.map(customer => (
                  <TouchableOpacity
                    key={customer.id}
                    style={[
                      styles.filterOption,
                      localCustomerFilter === customer.id.toString() && styles.filterOptionActive
                    ]}
                    onPress={() => setLocalCustomerFilter(customer.id.toString())}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localCustomerFilter === customer.id.toString() && styles.filterOptionTextActive
                    ]}>
                      {customer.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ordenação */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Ordenar por Data</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    localSortOrder === 'newest' && styles.filterOptionActive
                  ]}
                  onPress={() => setLocalSortOrder('newest')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    localSortOrder === 'newest' && styles.filterOptionTextActive
                  ]}>
                    Mais Recentes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    localSortOrder === 'oldest' && styles.filterOptionActive
                  ]}
                  onPress={() => setLocalSortOrder('oldest')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    localSortOrder === 'oldest' && styles.filterOptionTextActive
                  ]}>
                    Mais Antigos
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
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
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default FilterModal;

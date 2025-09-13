import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Modal,
  Dimensions 
} from 'react-native';
import colors from '../theme/colors';

const InlineDropdown = ({ 
  label, 
  placeholder, 
  data, 
  value, 
  onSelect, 
  searchKey, 
  displayKey,
  secondaryKey,
  style 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredData = data.filter(item => 
    item[searchKey].toLowerCase().includes(searchText.toLowerCase())
  );

  const selectedItem = data.find(item => item.id.toString() === value);

  const handleSelect = (item) => {
    onSelect(item.id.toString());
    setIsOpen(false);
    setSearchText('');
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchText('');
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={toggleDropdown}
      >
        <View style={styles.selectorTextContainer}>
          <Text style={[
            styles.selectorText, 
            !selectedItem && styles.placeholderText
          ]}>
            {selectedItem ? selectedItem[displayKey] : placeholder}
          </Text>
          {selectedItem && secondaryKey && (
            <Text style={styles.selectorSecondaryText}>
              {selectedItem[secondaryKey]}
            </Text>
          )}
        </View>
        <Text style={styles.selectorIcon}>📋</Text>
      </TouchableOpacity>

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
              <Text style={styles.modalTitle}>📋 Selecionar {label}</Text>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {filteredData.map((item) => (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={styles.optionItem}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>{item[displayKey]}</Text>
                    {secondaryKey && (
                      <Text style={styles.optionSecondaryText}>
                        {item[secondaryKey]}
                      </Text>
                    )}
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  selectorSecondaryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  placeholderText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  selectorIcon: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
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
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  optionSecondaryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default InlineDropdown;

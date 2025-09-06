import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet 
} from 'react-native';

const QuantityCounter = ({ 
  label, 
  value, 
  onValueChange, 
  min = 1, 
  max = 999,
  style 
}) => {
  const [inputValue, setInputValue] = useState(value || '1');

  const handleIncrement = () => {
    const currentValue = parseInt(value) || 1;
    const newValue = Math.min(currentValue + 1, max);
    onValueChange(newValue.toString());
    setInputValue(newValue.toString());
  };

  const handleDecrement = () => {
    const currentValue = parseInt(value) || 1;
    const newValue = Math.max(currentValue - 1, min);
    onValueChange(newValue.toString());
    setInputValue(newValue.toString());
  };

  const handleInputChange = (text) => {
    setInputValue(text);
    
    // Permitir apenas números
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      onValueChange('1');
      return;
    }
    
    const numValue = parseInt(numericValue);
    if (numValue >= min && numValue <= max) {
      onValueChange(numericValue);
    } else if (numValue > max) {
      onValueChange(max.toString());
      setInputValue(max.toString());
    } else if (numValue < min) {
      onValueChange('1');
      setInputValue('1');
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < min) {
      onValueChange('1');
      setInputValue('1');
    } else if (numValue > max) {
      onValueChange(max.toString());
      setInputValue(max.toString());
    } else {
      onValueChange(numValue.toString());
      setInputValue(numValue.toString());
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.counterContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.decrementButton]}
          onPress={handleDecrement}
          disabled={(parseInt(value) || 1) <= min}
        >
          <Text style={[
            styles.buttonText,
            (parseInt(value) || 1) <= min && styles.buttonTextDisabled
          ]}>-</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          onBlur={handleInputBlur}
          keyboardType="numeric"
          selectTextOnFocus
          maxLength={3}
        />
        
        <TouchableOpacity 
          style={[styles.button, styles.incrementButton]}
          onPress={handleIncrement}
          disabled={(parseInt(value) || 1) >= max}
        >
          <Text style={[
            styles.buttonText,
            (parseInt(value) || 1) >= max && styles.buttonTextDisabled
          ]}>+</Text>
        </TouchableOpacity>
      </View>
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
    color: '#333333',
    marginBottom: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  decrementButton: {
    backgroundColor: '#DC3545',
  },
  incrementButton: {
    backgroundColor: '#28A745',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#CCCCCC',
  },
  input: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
  },
});

export default QuantityCounter;

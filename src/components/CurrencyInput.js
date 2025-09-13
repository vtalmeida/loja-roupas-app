import React from "react"
import { View, Text, TextInput, StyleSheet } from "react-native"
import colors from '../theme/colors'

const CurrencyInput = ({ label, value, onChangeText, placeholder, style }) => {
  const handleFocus = () => {
    // Limpar o campo quando focar
    onChangeText('')
  }

  const handleTextChange = (text) => {
    // Aceita apenas números e vírgula
    let cleanText = text.replace(/[^\d,]/g, '');
    
    // Limita a apenas uma vírgula
    const commaCount = (cleanText.match(/,/g) || []).length;
    if (commaCount > 1) {
      cleanText = cleanText.replace(/,/g, '').replace(/(\d+)/, '$1,');
    }
    
    // Limita a 2 casas decimais após a vírgula
    if (cleanText.includes(',')) {
      const parts = cleanText.split(',');
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2);
        cleanText = parts.join(',');
      }
    }
    
    onChangeText(cleanText);
  }

  const handleBlur = () => {
    // Aplicar máscara quando sair do campo
    if (value && value.trim() !== '') {
      const numericValue = parseFloat(value.replace(',', '.'));
      if (!isNaN(numericValue)) {
        // Formatar com 2 casas decimais
        const formattedValue = numericValue.toFixed(2).replace('.', ',');
        onChangeText(formattedValue);
      }
    }
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || "0,00"}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
})

export default CurrencyInput

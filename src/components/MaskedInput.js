"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, StyleSheet } from "react-native"
import { processCurrencyInput, formatCurrency } from "../utils/formatters"
import colors from '../theme/colors'

const MaskedInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  mask = "default",
  style,
}) => {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    if (value) {
      setDisplayValue(applyMask(value, mask))
    } else {
      setDisplayValue("")
    }
  }, [value, mask])

  const applyMask = (text, maskType) => {
    if (!text) return ""

    switch (maskType) {
      case "phone":
        // Remove tudo que não é número
        const numbers = text.replace(/\D/g, "")

        // Aplica máscara (99) 99999-9999
        if (numbers.length <= 2) {
          return `(${numbers}`
        } else if (numbers.length <= 7) {
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
        } else {
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
        }

      case "currency":
        return formatCurrency(text)

      default:
        return text
    }
  }

  const handleTextChange = (text) => {
    let cleanText = text

    if (mask === "phone") {
      // Remove tudo que não é número
      cleanText = text.replace(/\D/g, "")

      // Limita a 11 dígitos
      if (cleanText.length > 11) {
        cleanText = cleanText.slice(0, 11)
      }
    } else if (mask === "currency") {
      const { cleanValue, displayValue } = processCurrencyInput(text, value)
      setDisplayValue(displayValue)
      onChangeText(cleanValue)
      return
    }

    const maskedValue = applyMask(cleanText, mask)
    setDisplayValue(maskedValue)
    onChangeText(cleanText)
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={displayValue}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={mask === "phone" ? "numeric" : mask === "currency" ? "numeric" : keyboardType}
        maxLength={mask === "phone" ? 15 : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
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
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.backgroundSecondary,
    color: colors.textPrimary,
  },
})

export default MaskedInput

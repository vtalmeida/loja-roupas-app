# 🔄 Guia de Solução de Problemas - Importação de Dados

## ❌ Problemas Comuns e Soluções

### 1. **Arquivo não encontrado**
**Erro**: "Arquivo não encontrado. Verifique se o arquivo está na pasta Downloads."

**Soluções**:
- ✅ Verifique se o arquivo está na pasta **"Bru Moda Íntima"** dentro de Downloads
- ✅ Confirme se o nome do arquivo termina com `.xlsx`
- ✅ Tente exportar novamente para criar a pasta automaticamente

### 2. **Arquivo vazio**
**Erro**: "Arquivo está vazio. Verifique se o arquivo foi exportado corretamente."

**Soluções**:
- ✅ Re-exporte os dados do app original
- ✅ Verifique se há dados para exportar
- ✅ Confirme se a exportação foi concluída com sucesso

### 3. **Arquivo inválido**
**Erro**: "Arquivo inválido. Faltam as abas: Produtos, Clientes, Pedidos."

**Soluções**:
- ✅ Use apenas arquivos exportados pelo próprio app
- ✅ Não modifique a estrutura do arquivo Excel
- ✅ Não use arquivos criados manualmente

### 4. **Arquivo não é Excel válido**
**Erro**: "Arquivo inválido. O arquivo selecionado não é um arquivo Excel válido."

**Soluções**:
- ✅ Verifique se o arquivo é realmente um .xlsx ou .xls
- ✅ Confirme que o arquivo não está corrompido
- ✅ Tente abrir o arquivo no Excel ou Google Sheets primeiro
- ✅ Re-exporte o arquivo se necessário
- ✅ Verifique se o arquivo não foi salvo em formato incompatível

### 5. **Erro de permissão**
**Erro**: "Erro ao acessar pasta Downloads"

**Soluções**:
- ✅ Verifique as permissões de armazenamento do app
- ✅ Reinicie o app
- ✅ Reinstale o app se necessário

## 📋 Passo a Passo para Importação

### **No App Original (Exportação)**:
1. Abra o app que tem os dados
2. Vá em **Configurações**
3. Toque em **"Exportar Dados"**
4. Aguarde a exportação ser concluída
5. Confirme que o arquivo foi salvo na pasta **"Bru Moda Íntima"** dentro de Downloads

### **No App de Destino (Importação)**:
1. Abra o app onde quer importar
2. Vá em **Configurações**
3. Toque em **"Importar Dados"**
4. Selecione o arquivo da lista (da pasta "Bru Moda Íntima")
5. Confirme a importação
6. Aguarde a conclusão

## 🔍 Verificações Importantes

### **Antes da Exportação**:
- ✅ App tem dados para exportar
- ✅ Conexão com internet estável
- ✅ Espaço suficiente no armazenamento

### **Antes da Importação**:
- ✅ Arquivo está na pasta Downloads
- ✅ Arquivo foi exportado pelo mesmo app
- ✅ Arquivo não foi modificado
- ✅ App de destino tem espaço suficiente

## 🛠️ Solução de Problemas Avançada

### **Se nada funcionar**:
1. **Limpe o cache** do app
2. **Reinicie** o dispositivo
3. **Reinstale** o app
4. **Exporte novamente** os dados
5. **Tente importar** novamente

### **Logs de Debug**:
- Abra o console do React Native Debugger
- Procure por mensagens que começam com 🔍, ✅, ❌
- Compartilhe os logs se o problema persistir

## 📞 Suporte

Se o problema persistir:
1. Anote a mensagem de erro exata
2. Verifique os logs no console
3. Teste com um arquivo de exportação simples
4. Entre em contato com o suporte técnico

---

**💡 Dica**: Sempre teste a importação com poucos dados primeiro para verificar se está funcionando corretamente.

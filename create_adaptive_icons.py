#!/usr/bin/env python3
"""
Script para criar ícones adaptativos do Android
Remove fundo branco e cria ícones que se integram perfeitamente
"""

from PIL import Image, ImageDraw
import os

def create_adaptive_icons():
    """Cria ícones adaptativos para Android"""
    
    # Verificar se o arquivo PNG existe
    png_file = "custom_icon.png"
    if not os.path.exists(png_file):
        print(f"❌ Arquivo {png_file} não encontrado!")
        return False
    
    try:
        # Abrir a imagem PNG
        print(f"📁 Abrindo {png_file}...")
        img = Image.open(png_file)
        
        # Converter para RGBA para trabalhar com transparência
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Tamanhos para Android (mipmap)
        android_sizes = {
            'mipmap-mdpi': 48,
            'mipmap-hdpi': 72,
            'mipmap-xhdpi': 96,
            'mipmap-xxhdpi': 144,
            'mipmap-xxxhdpi': 192
        }
        
        print("🎨 Criando ícones adaptativos...")
        
        for folder, size in android_sizes.items():
            print(f"   📱 Processando {folder} ({size}x{size})...")
            
            # Criar diretório se não existir
            os.makedirs(f"android/app/src/main/res/{folder}", exist_ok=True)
            
            # Redimensionar a imagem original
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # Criar fundo transparente
            background = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            
            # Criar máscara circular
            mask = Image.new('L', (size, size), 0)
            draw = ImageDraw.Draw(mask)
            
            # Desenhar círculo para máscara
            margin = size // 8  # Margem de 12.5%
            draw.ellipse([margin, margin, size - margin, size - margin], fill=255)
            
            # Aplicar máscara à imagem
            resized.putalpha(mask)
            
            # Colar a imagem no fundo transparente
            background.paste(resized, (0, 0), resized)
            
            # Salvar ic_launcher.png
            launcher_path = f"android/app/src/main/res/{folder}/ic_launcher.png"
            background.save(launcher_path)
            print(f"      ✅ {launcher_path}")
            
            # Salvar ic_launcher_round.png (mesmo ícone)
            round_path = f"android/app/src/main/res/{folder}/ic_launcher_round.png"
            background.save(round_path)
            print(f"      ✅ {round_path}")
        
        print("\n🎨 Criando ícones com fundo rose gold...")
        
        # Criar versão com fundo rose gold para melhor integração
        rose_gold_bg = (232, 180, 184, 255)  # #E8B4B8
        
        for folder, size in android_sizes.items():
            print(f"   🌹 Processando {folder} com fundo rose gold...")
            
            # Redimensionar a imagem original
            resized = img.resize((int(size * 0.7), int(size * 0.7)), Image.Resampling.LANCZOS)
            
            # Criar fundo rose gold
            background = Image.new('RGBA', (size, size), rose_gold_bg)
            
            # Centralizar a imagem no fundo
            x = (size - resized.width) // 2
            y = (size - resized.height) // 2
            
            # Colar a imagem no centro
            background.paste(resized, (x, y), resized)
            
            # Salvar como ic_launcher_foreground.png
            foreground_path = f"android/app/src/main/res/{folder}/ic_launcher_foreground.png"
            background.save(foreground_path)
            print(f"      ✅ {foreground_path}")
        
        print("\n✅ Ícones adaptativos criados com sucesso!")
        print("📱 Os ícones agora se integram perfeitamente com o Android!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar ícones adaptativos: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Criando ícones adaptativos para Android")
    print("=" * 50)
    
    success = create_adaptive_icons()
    
    if success:
        print("\n🎉 Processo concluído com sucesso!")
        print("📱 Seus ícones agora são adaptativos e bonitos!")
    else:
        print("\n💥 Falha na criação dos ícones!")

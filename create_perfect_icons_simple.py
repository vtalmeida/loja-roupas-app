#!/usr/bin/env python3
"""
Script para criar ícones perfeitos removendo fundo branco
Versão simples sem numpy - apenas PIL
"""

from PIL import Image, ImageDraw
import os

def remove_white_background_simple(img):
    """Remove fundo branco da imagem usando PIL"""
    # Converter para RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Obter dados da imagem
    data = img.getdata()
    
    # Criar nova lista de dados
    new_data = []
    for item in data:
        # Se o pixel for branco (R, G, B > 240), tornar transparente
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((0, 0, 0, 0))  # Transparente
        else:
            new_data.append(item)  # Manter original
    
    # Aplicar os novos dados
    img.putdata(new_data)
    return img

def create_perfect_icons():
    """Cria ícones perfeitos para Android"""
    
    # Verificar se o arquivo PNG existe
    png_file = "custom_icon.png"
    if not os.path.exists(png_file):
        print(f"❌ Arquivo {png_file} não encontrado!")
        return False
    
    try:
        # Abrir a imagem PNG
        print(f"📁 Abrindo {png_file}...")
        img = Image.open(png_file)
        
        # Remover fundo branco
        print("🧹 Removendo fundo branco...")
        img_no_bg = remove_white_background_simple(img)
        
        # Tamanhos para Android (mipmap)
        android_sizes = {
            'mipmap-mdpi': 48,
            'mipmap-hdpi': 72,
            'mipmap-xhdpi': 96,
            'mipmap-xxhdpi': 144,
            'mipmap-xxxhdpi': 192
        }
        
        print("🎨 Criando ícones perfeitos...")
        
        for folder, size in android_sizes.items():
            print(f"   📱 Processando {folder} ({size}x{size})...")
            
            # Criar diretório se não existir
            os.makedirs(f"android/app/src/main/res/{folder}", exist_ok=True)
            
            # Redimensionar a imagem sem fundo
            resized = img_no_bg.resize((size, size), Image.Resampling.LANCZOS)
            
            # Salvar ic_launcher.png
            launcher_path = f"android/app/src/main/res/{folder}/ic_launcher.png"
            resized.save(launcher_path)
            print(f"      ✅ {launcher_path}")
            
            # Salvar ic_launcher_round.png (mesmo ícone)
            round_path = f"android/app/src/main/res/{folder}/ic_launcher_round.png"
            resized.save(round_path)
            print(f"      ✅ {round_path}")
        
        print("\n🎨 Criando ícones com fundo rose gold...")
        
        # Cor rose gold do tema
        rose_gold_bg = (232, 180, 184, 255)  # #E8B4B8
        
        for folder, size in android_sizes.items():
            print(f"   🌹 Processando {folder} com fundo rose gold...")
            
            # Redimensionar a imagem sem fundo (70% do tamanho)
            icon_size = int(size * 0.7)
            resized = img_no_bg.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
            
            # Criar fundo rose gold
            background = Image.new('RGBA', (size, size), rose_gold_bg)
            
            # Centralizar a imagem no fundo
            x = (size - icon_size) // 2
            y = (size - icon_size) // 2
            
            # Colar a imagem no centro
            background.paste(resized, (x, y), resized)
            
            # Salvar como ic_launcher_foreground.png
            foreground_path = f"android/app/src/main/res/{folder}/ic_launcher_foreground.png"
            background.save(foreground_path)
            print(f"      ✅ {foreground_path}")
        
        print("\n🎨 Criando arquivo ICO perfeito...")
        # Criar ICO com fundo transparente
        ico_sizes = [16, 24, 32, 48, 64, 128, 256]
        ico_images = []
        
        for size in ico_sizes:
            resized = img_no_bg.resize((size, size), Image.Resampling.LANCZOS)
            ico_images.append(resized)
        
        ico_file = "custom_icon.ico"
        ico_images[0].save(
            ico_file,
            format='ICO',
            sizes=[(img.width, img.height) for img in ico_images],
            append_images=ico_images[1:]
        )
        print(f"   ✅ {ico_file} criado com fundo transparente")
        
        print("\n✅ Ícones perfeitos criados com sucesso!")
        print("📱 Os ícones agora se integram perfeitamente com o Android!")
        print("🎨 Fundo branco removido e substituído por transparência")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar ícones perfeitos: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Criando ícones perfeitos para Android")
    print("=" * 50)
    
    success = create_perfect_icons()
    
    if success:
        print("\n🎉 Processo concluído com sucesso!")
        print("📱 Seus ícones agora são perfeitos e sem fundo branco!")
    else:
        print("\n💥 Falha na criação dos ícones!")

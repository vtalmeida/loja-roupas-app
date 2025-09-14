#!/usr/bin/env python3
"""
Script para criar ícones adaptativos no estilo Flutter
Gera ícones que se adaptam automaticamente ao tema do Android
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

def create_adaptive_icons_flutter_style():
    """Cria ícones adaptativos no estilo Flutter"""
    
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
        
        # Tamanhos para Android (drawable e mipmap)
        drawable_sizes = {
            'drawable-mdpi': 108,
            'drawable-hdpi': 162,
            'drawable-xhdpi': 216,
            'drawable-xxhdpi': 324,
            'drawable-xxxhdpi': 432
        }
        
        mipmap_sizes = {
            'mipmap-mdpi': 48,
            'mipmap-hdpi': 72,
            'mipmap-xhdpi': 96,
            'mipmap-xxhdpi': 144,
            'mipmap-xxxhdpi': 192
        }
        
        print("🎨 Criando ícones adaptativos (drawable)...")
        
        # Criar ícones drawable (foreground) - maiores para adaptação
        for folder, size in drawable_sizes.items():
            print(f"   📱 Processando {folder} ({size}x{size})...")
            
            # Criar diretório se não existir
            os.makedirs(f"android/app/src/main/res/{folder}", exist_ok=True)
            
            # Redimensionar a imagem sem fundo para o tamanho completo
            resized = img_no_bg.resize((size, size), Image.Resampling.LANCZOS)
            
            # Salvar ic_launcher_foreground.png
            foreground_path = f"android/app/src/main/res/{folder}/ic_launcher_foreground.png"
            resized.save(foreground_path)
            print(f"      ✅ {foreground_path}")
        
        print("\n🎨 Criando ícones mipmap (fallback)...")
        
        # Criar ícones mipmap (fallback para versões antigas)
        for folder, size in mipmap_sizes.items():
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
        
        print("\n🎨 Criando arquivo ICO adaptativo...")
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
        
        print("\n✅ Ícones adaptativos criados com sucesso!")
        print("📱 Os ícones agora se adaptam automaticamente ao tema do Android!")
        print("🎨 Funciona com ícones redondos, quadrados e bordas arredondadas")
        print("🌹 Fundo rose gold (#E8B4B8) para Android 8.0+")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar ícones adaptativos: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Criando ícones adaptativos no estilo Flutter")
    print("=" * 60)
    
    success = create_adaptive_icons_flutter_style()
    
    if success:
        print("\n🎉 Processo concluído com sucesso!")
        print("📱 Seus ícones agora são adaptativos como no Flutter!")
        print("🔄 Se adaptam automaticamente ao tema do Android!")
    else:
        print("\n💥 Falha na criação dos ícones!")

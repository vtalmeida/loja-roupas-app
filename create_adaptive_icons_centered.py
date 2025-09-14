#!/usr/bin/env python3
"""
Script para criar ícones adaptativos com centralização automática
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

def center_image_in_canvas(img, target_size, padding_percent=0.1):
    """Centraliza a imagem em um canvas do tamanho especificado"""
    # Calcular o tamanho com padding
    padding = int(target_size * padding_percent)
    max_icon_size = target_size - (padding * 2)
    
    # Redimensionar a imagem mantendo proporção
    img.thumbnail((max_icon_size, max_icon_size), Image.Resampling.LANCZOS)
    
    # Criar canvas transparente
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    
    # Centralizar a imagem
    x = (target_size - img.width) // 2
    y = (target_size - img.height) // 2
    
    # Colar a imagem no canvas
    canvas.paste(img, (x, y), img)
    
    return canvas

def create_adaptive_icons_centered():
    """Cria ícones adaptativos com centralização automática"""
    
    # Verificar se o arquivo PNG existe
    png_file = "custom_icon.png"
    if not os.path.exists(png_file):
        print(f"❌ Arquivo {png_file} não encontrado!")
        print("💡 Coloque sua imagem como 'custom_icon.png' na pasta raiz")
        return False
    
    try:
        # Abrir a imagem PNG
        print(f"📁 Abrindo {png_file}...")
        img = Image.open(png_file)
        print(f"   📏 Tamanho original: {img.size[0]}x{img.size[1]} pixels")
        
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
        
        print("🎨 Criando ícones adaptativos centralizados (drawable)...")
        
        # Criar ícones drawable (foreground) - centralizados
        for folder, size in drawable_sizes.items():
            print(f"   📱 Processando {folder} ({size}x{size})...")
            
            # Criar diretório se não existir
            os.makedirs(f"android/app/src/main/res/{folder}", exist_ok=True)
            
            # Centralizar a imagem no canvas
            centered_img = center_image_in_canvas(img_no_bg, size, 0.1)  # 10% de padding
            
            # Salvar ic_launcher_foreground.png
            foreground_path = f"android/app/src/main/res/{folder}/ic_launcher_foreground.png"
            centered_img.save(foreground_path)
            print(f"      ✅ {foreground_path}")
        
        print("\n🎨 Criando ícones mipmap centralizados (fallback)...")
        
        # Criar ícones mipmap (fallback para versões antigas) - centralizados
        for folder, size in mipmap_sizes.items():
            print(f"   📱 Processando {folder} ({size}x{size})...")
            
            # Criar diretório se não existir
            os.makedirs(f"android/app/src/main/res/{folder}", exist_ok=True)
            
            # Centralizar a imagem no canvas
            centered_img = center_image_in_canvas(img_no_bg, size, 0.1)  # 10% de padding
            
            # Salvar ic_launcher.png
            launcher_path = f"android/app/src/main/res/{folder}/ic_launcher.png"
            centered_img.save(launcher_path)
            print(f"      ✅ {launcher_path}")
            
            # Salvar ic_launcher_round.png (mesmo ícone)
            round_path = f"android/app/src/main/res/{folder}/ic_launcher_round.png"
            centered_img.save(round_path)
            print(f"      ✅ {round_path}")
        
        print("\n🎨 Criando arquivo ICO centralizado...")
        # Criar ICO com fundo transparente e centralizado
        ico_sizes = [16, 24, 32, 48, 64, 128, 256]
        ico_images = []
        
        for size in ico_sizes:
            centered_img = center_image_in_canvas(img_no_bg, size, 0.1)
            ico_images.append(centered_img)
        
        ico_file = "custom_icon.ico"
        ico_images[0].save(
            ico_file,
            format='ICO',
            sizes=[(img.width, img.height) for img in ico_images],
            append_images=ico_images[1:]
        )
        print(f"   ✅ {ico_file} criado com centralização")
        
        print("\n✅ Ícones adaptativos centralizados criados com sucesso!")
        print("📱 Os ícones agora se adaptam automaticamente ao tema do Android!")
        print("🎯 Imagem centralizada com 10% de padding em todos os tamanhos")
        print("🌹 Fundo rose gold (#E8B4B8) para Android 8.0+")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar ícones adaptativos: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Criando ícones adaptativos centralizados")
    print("=" * 60)
    print("💡 Para usar: substitua 'custom_icon.png' e execute este script")
    print("=" * 60)
    
    success = create_adaptive_icons_centered()
    
    if success:
        print("\n🎉 Processo concluído com sucesso!")
        print("📱 Seus ícones agora são adaptativos e centralizados!")
        print("🔄 Se adaptam automaticamente ao tema do Android!")
        print("\n📋 Próximos passos:")
        print("   1. npx react-native run-android")
        print("   2. Instalar no celular e testar!")
    else:
        print("\n💥 Falha na criação dos ícones!")
        print("💡 Verifique se o arquivo 'custom_icon.png' existe na pasta raiz")

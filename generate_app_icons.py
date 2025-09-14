#!/usr/bin/env python3
"""
Script para gerar ícones do app a partir do custom_icon.png
Gera todos os tamanhos necessários para Android e iOS
"""

from PIL import Image
import os

def create_app_icons():
    """Cria todos os ícones necessários para o app"""
    
    # Verificar se o arquivo PNG existe
    png_file = "custom_icon.png"
    if not os.path.exists(png_file):
        print(f"❌ Arquivo {png_file} não encontrado!")
        return False
    
    try:
        # Abrir a imagem PNG
        print(f"📁 Abrindo {png_file}...")
        img = Image.open(png_file)
        
        # Tamanhos para Android (mipmap)
        android_sizes = {
            'mipmap-mdpi': 48,
            'mipmap-hdpi': 72,
            'mipmap-xhdpi': 96,
            'mipmap-xxhdpi': 144,
            'mipmap-xxxhdpi': 192
        }
        
        # Tamanhos para iOS
        ios_sizes = {
            'icon-20.png': 20,
            'icon-29.png': 29,
            'icon-40.png': 40,
            'icon-58.png': 58,
            'icon-60.png': 60,
            'icon-76.png': 76,
            'icon-80.png': 80,
            'icon-87.png': 87,
            'icon-120.png': 120,
            'icon-152.png': 152,
            'icon-167.png': 167,
            'icon-180.png': 180,
            'icon-1024.png': 1024
        }
        
        print("🤖 Gerando ícones para Android...")
        # Criar diretórios se não existirem
        for folder in android_sizes.keys():
            os.makedirs(f"android/app/src/main/res/{folder}", exist_ok=True)
        
        # Gerar ícones Android
        for folder, size in android_sizes.items():
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # Salvar ic_launcher.png
            launcher_path = f"android/app/src/main/res/{folder}/ic_launcher.png"
            resized.save(launcher_path)
            print(f"   ✅ {launcher_path} ({size}x{size})")
            
            # Salvar ic_launcher_round.png (mesmo ícone)
            round_path = f"android/app/src/main/res/{folder}/ic_launcher_round.png"
            resized.save(round_path)
            print(f"   ✅ {round_path} ({size}x{size})")
        
        print("\n🍎 Gerando ícones para iOS...")
        # Criar diretório iOS se não existir
        ios_dir = "ios/lojaroupasapp/Images.xcassets/AppIcon.appiconset"
        os.makedirs(ios_dir, exist_ok=True)
        
        # Gerar ícones iOS
        for filename, size in ios_sizes.items():
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            ios_path = f"{ios_dir}/{filename}"
            resized.save(ios_path)
            print(f"   ✅ {ios_path} ({size}x{size})")
        
        print("\n🎨 Gerando arquivo ICO...")
        # Criar ICO com múltiplos tamanhos
        ico_sizes = [16, 24, 32, 48, 64, 128, 256]
        ico_images = []
        
        for size in ico_sizes:
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            ico_images.append(resized)
        
        ico_file = "custom_icon.ico"
        ico_images[0].save(
            ico_file,
            format='ICO',
            sizes=[(img.width, img.height) for img in ico_images],
            append_images=ico_images[1:]
        )
        print(f"   ✅ {ico_file} criado")
        
        print("\n✅ Todos os ícones foram gerados com sucesso!")
        print("📱 Para aplicar as mudanças:")
        print("   1. Recompile o app: npx react-native run-android")
        print("   2. Ou limpe o cache: npx react-native start --reset-cache")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao gerar ícones: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Gerando ícones do app a partir do custom_icon.png")
    print("=" * 60)
    
    success = create_app_icons()
    
    if success:
        print("\n🎉 Processo concluído com sucesso!")
        print("📱 Seu app agora terá o ícone personalizado!")
    else:
        print("\n💥 Falha na geração dos ícones!")

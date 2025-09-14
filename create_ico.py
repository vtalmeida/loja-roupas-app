#!/usr/bin/env python3
"""
Script para converter custom_icon.png para custom_icon.ico
"""

from PIL import Image
import os

def create_ico_from_png():
    """Converte custom_icon.png para custom_icon.ico com múltiplos tamanhos"""
    
    # Verificar se o arquivo PNG existe
    png_file = "custom_icon.png"
    if not os.path.exists(png_file):
        print(f"❌ Arquivo {png_file} não encontrado!")
        return False
    
    try:
        # Abrir a imagem PNG
        print(f"📁 Abrindo {png_file}...")
        img = Image.open(png_file)
        
        # Tamanhos comuns para ICO (em pixels)
        sizes = [16, 24, 32, 48, 64, 128, 256]
        
        # Criar lista de imagens redimensionadas
        ico_images = []
        
        print("🔄 Redimensionando para múltiplos tamanhos...")
        for size in sizes:
            # Redimensionar mantendo proporção
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            ico_images.append(resized)
            print(f"   ✅ {size}x{size} pixels")
        
        # Salvar como ICO
        ico_file = "custom_icon.ico"
        print(f"💾 Salvando como {ico_file}...")
        ico_images[0].save(
            ico_file,
            format='ICO',
            sizes=[(img.width, img.height) for img in ico_images],
            append_images=ico_images[1:]
        )
        
        print(f"✅ {ico_file} criado com sucesso!")
        print(f"📊 Tamanhos incluídos: {', '.join([f'{s}x{s}' for s in sizes])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar ICO: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Criando arquivo ICO a partir do custom_icon.png")
    print("=" * 50)
    
    success = create_ico_from_png()
    
    if success:
        print("\n🎉 Conversão concluída com sucesso!")
    else:
        print("\n💥 Falha na conversão!")

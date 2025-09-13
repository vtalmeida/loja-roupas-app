from PIL import Image, ImageDraw
import os

def create_custom_icon(size, filename, source_image):
    # Load the custom icon
    img = Image.open(source_image)
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Resize to the target size
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Create a new image with transparent background
    new_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Paste the resized image onto the new image
    new_img.paste(img, (0, 0), img)
    
    # Save the image
    new_img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Android icon sizes
android_sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

# iOS icon sizes
ios_sizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]

source_image = 'custom_icon.png'

print("Creating Android icons...")
for folder, size in android_sizes.items():
    # Create regular icon
    create_custom_icon(size, f'android/app/src/main/res/{folder}/ic_launcher.png', source_image)
    # Create round icon
    create_custom_icon(size, f'android/app/src/main/res/{folder}/ic_launcher_round.png', source_image)

print("Creating iOS icons...")
for size in ios_sizes:
    filename = f'ios/lojaroupasapp/Images.xcassets/AppIcon.appiconset/icon-{size}.png'
    create_custom_icon(size, filename, source_image)

print("All custom icons created successfully!")

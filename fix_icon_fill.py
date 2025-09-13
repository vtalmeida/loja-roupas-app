from PIL import Image, ImageDraw
import os

def create_filled_icon(size, filename, source_image):
    # Load the custom icon
    img = Image.open(source_image)
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Create a new square image with the target size
    new_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Calculate scaling to fill the entire square (crop if necessary)
    img_ratio = img.width / img.height
    target_ratio = 1.0  # Square
    
    if img_ratio > target_ratio:
        # Image is wider than tall - scale by height and crop width
        new_height = size
        new_width = int(size * img_ratio)
    else:
        # Image is taller than wide - scale by width and crop height
        new_width = size
        new_height = int(size / img_ratio)
    
    # Resize the image
    img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Calculate position to center the image
    x_offset = (size - new_width) // 2
    y_offset = (size - new_height) // 2
    
    # Paste the resized image onto the new image, centered
    new_img.paste(img_resized, (x_offset, y_offset), img_resized)
    
    # Save the image
    new_img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size}) - filled")

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

print("Creating filled Android icons...")
for folder, size in android_sizes.items():
    # Create regular icon
    create_filled_icon(size, f'android/app/src/main/res/{folder}/ic_launcher.png', source_image)
    # Create round icon
    create_filled_icon(size, f'android/app/src/main/res/{folder}/ic_launcher_round.png', source_image)

print("Creating filled iOS icons...")
for size in ios_sizes:
    filename = f'ios/lojaroupasapp/Images.xcassets/AppIcon.appiconset/icon-{size}.png'
    create_filled_icon(size, filename, source_image)

print("All filled icons created successfully!")

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle with gradient effect
    margin = 4
    draw.ellipse([margin, margin, size-margin, size-margin], 
                 fill=(233, 30, 99, 255), outline=(255, 255, 255, 255), width=2)
    
    # Inner circle for depth
    inner_margin = size * 0.15
    draw.ellipse([inner_margin, inner_margin, size-inner_margin, size-inner_margin], 
                 outline=(255, 255, 255, 100), width=1)
    
    # Text "BM"
    try:
        # Try to use a bold font
        font_size = int(size * 0.35)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    text = "BM"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 2
    
    # Draw text with white color
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # Decorative dots
    dot_size = max(2, size // 24)
    dot_positions = [
        (size * 0.3, size * 0.3),
        (size * 0.7, size * 0.3),
        (size * 0.3, size * 0.7),
        (size * 0.7, size * 0.7)
    ]
    
    for pos in dot_positions:
        draw.ellipse([pos[0]-dot_size, pos[1]-dot_size, pos[0]+dot_size, pos[1]+dot_size], 
                     fill=(255, 255, 255, 150))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create icons for different Android densities
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

for folder, size in sizes.items():
    # Create regular icon
    create_icon(size, f'android/app/src/main/res/{folder}/ic_launcher.png')
    # Create round icon
    create_icon(size, f'android/app/src/main/res/{folder}/ic_launcher_round.png')

print("All Android icons created successfully!")

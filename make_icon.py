from PIL import Image
import os

def remove_background():
    img_path = r"C:/Users/Suvro/.gemini/antigravity/brain/tempmediaStorage/media__1780203191146.png"
    out_path = r"c:/Users/Suvro/Desktop/Jxm Tour Club/public/favicon.png"
    
    if not os.path.exists(img_path):
        print(f"Error: {img_path} not found")
        return

    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for r, g, b, a in data:
        lum = (0.299 * r + 0.587 * g + 0.114 * b)
        
        # Soft threshold for background removal
        if lum < 20:
            new_data.append((0, 0, 0, 0)) # Fully transparent black
        else:
            # Scale alpha based on luminance for smooth edges
            alpha = int(min(255, max(0, (lum - 20) * (255 / 80))))
            
            # Boost RGB to remove the "black" tint from pre-multiplied edges
            if alpha > 0 and alpha < 255:
                factor = 255 / alpha
                r = min(255, int(r * factor))
                g = min(255, int(g * factor))
                b = min(255, int(b * factor))
                
            new_data.append((r, g, b, alpha))
            
    img.putdata(new_data)
    
    # Make square
    width, height = img.size
    size = min(width, height)
    left = (width - size) / 2
    top = (height - size) / 2
    right = (width + size) / 2
    bottom = (height + size) / 2
    img = img.crop((left, top, right, bottom))
    
    # Save as PNG
    img.save(out_path, "PNG")
    print("Saved as favicon.png")

if __name__ == "__main__":
    remove_background()

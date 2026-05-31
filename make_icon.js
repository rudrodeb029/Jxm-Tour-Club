import { Jimp } from "jimp";
import fs from "fs/promises";

async function processImage() {
  const imgPath = "C:/Users/Suvro/.gemini/antigravity/brain/tempmediaStorage/media__1780203191146.png";
  const outPath = "c:/Users/Suvro/Desktop/Jxm Tour Club/public/favicon.png";

  try {
    const buffer = await fs.readFile(imgPath);
    const image = await Jimp.read(buffer);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red   = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue  = this.bitmap.data[idx + 2];
      
      const lum = (0.299 * red + 0.587 * green + 0.114 * blue);
      
      if (lum < 20) {
        this.bitmap.data[idx + 3] = 0; // alpha
      } else {
        const alpha = Math.min(255, Math.max(0, (lum - 20) * (255 / 80)));
        this.bitmap.data[idx + 3] = alpha;
        
        if (alpha > 0 && alpha < 255) {
            const factor = 255 / alpha;
            this.bitmap.data[idx + 0] = Math.min(255, red * factor);
            this.bitmap.data[idx + 1] = Math.min(255, green * factor);
            this.bitmap.data[idx + 2] = Math.min(255, blue * factor);
        }
      }
    });

    const size = Math.min(image.bitmap.width, image.bitmap.height);
    const cropX = (image.bitmap.width - size) / 2;
    const cropY = (image.bitmap.height - size) / 2;
    
    image.crop(cropX, cropY, size, size);
    
    await image.writeAsync(outPath);
    console.log("Saved transparent favicon.png");
  } catch (err) {
    console.error(err);
  }
}

processImage();

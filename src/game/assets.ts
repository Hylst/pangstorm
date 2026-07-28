export interface GameAssets {
  backgrounds: HTMLImageElement[];
  loaded: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      reject(new Error(`Failed to load ${src}`));
    };
    img.src = src;
  });
}

export async function loadAssets(): Promise<GameAssets> {
  const backgroundPaths = [
    'images/bg_level1.webp',
    'images/bg_level2.webp',
    'images/bg_level3.webp',
    'images/bg_level4.webp',
    'images/bg_level5.webp',
  ];

  const backgrounds: HTMLImageElement[] = [];
  for (const path of backgroundPaths) {
    try {
      const img = await loadImage(path);
      backgrounds.push(img);
    } catch {
      
      backgrounds.push(null as any);
    }
  }

  return { backgrounds, loaded: true };
}

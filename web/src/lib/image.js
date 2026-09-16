// Redimensionne et recompresse une image côté client avant upload — une
// photo de téléphone brute (3 à 10 Mo) ralentit énormément l'envoi sur
// réseau mobile ; ramenée à ~1600px de large en JPEG, elle passe à
// quelques centaines de Ko sans perte visible dans l'app.
export function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Compression de la photo impossible.'))), 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image."));
    };
    img.src = url;
  });
}

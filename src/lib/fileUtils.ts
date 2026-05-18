export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const compressImage = (file: File, maxWidth = 1080): Promise<string> => {
   return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
         let width = img.width;
         let height = img.height;
         if (width > maxWidth || height > maxWidth) {
           if (width > height) {
             height = Math.round((height * maxWidth) / width);
             width = maxWidth;
           } else {
             width = Math.round((width * maxWidth) / height);
             height = maxWidth;
           }
         }
         const canvas = document.createElement('canvas');
         canvas.width = width;
         canvas.height = height;
         const ctx = canvas.getContext('2d');
         if (!ctx) return reject(new Error("Canvas error"));
         ctx.drawImage(img, 0, 0, width, height);
         resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error("Image load error"));
      const reader = new FileReader();
      reader.onload = (e) => img.src = e.target?.result as string;
      reader.readAsDataURL(file);
   });
};

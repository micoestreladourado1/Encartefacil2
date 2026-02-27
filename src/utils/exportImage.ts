import { toPng, toJpeg } from 'html-to-image';

export const exportAsImage = async (elementId: string, format: 'png' | 'jpeg' = 'png', fileName: string = 'encarte') => {
  const node = document.getElementById(elementId);
  if (!node) return;

  try {
    const dataUrl = format === 'png' 
      ? await toPng(node, { quality: 0.95, pixelRatio: 2 })
      : await toJpeg(node, { quality: 0.95, pixelRatio: 2 });
      
    const link = document.createElement('a');
    link.download = `${fileName}.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
    alert('Erro ao exportar a imagem. Tente novamente.');
  }
};


import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
}

const QRCodeGenerator = ({ data, size = 200, level = 'M' }: QRCodeGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: level,
      }).catch(console.error);
    }
  }, [data, size, level]);

  return (
    <canvas
      ref={canvasRef}
      className="border rounded-lg shadow-sm"
    />
  );
};

export default QRCodeGenerator;

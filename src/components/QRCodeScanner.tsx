
import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

interface QRCodeScannerProps {
  onScanResult: (result: string) => void;
}

const QRCodeScanner = ({ onScanResult }: QRCodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScanning = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      setHasPermission(true);
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Start scanning loop
      scanQRCode();
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
    }
  };

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        onScanResult(code.data);
        stopScanning();
        return;
      }
    }

    if (isScanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (hasPermission === false) {
    return (
      <div className="text-center p-8">
        <CameraOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">Camera Permission Required</h3>
        <p className="text-gray-600 mb-4">
          Please allow camera access to scan QR codes
        </p>
        <Button onClick={startScanning}>
          <Camera className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isScanning ? (
        <div className="text-center p-8">
          <Camera className="w-12 h-12 mx-auto mb-4 text-purple-600" />
          <h3 className="text-lg font-medium mb-2">Ready to Scan</h3>
          <p className="text-gray-600 mb-4">
            Start your camera to scan QR codes for payments
          </p>
          <Button onClick={startScanning}>
            <Camera className="w-4 h-4 mr-2" />
            Start Scanning
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 border-2 border-purple-500 rounded-lg pointer-events-none">
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-purple-500"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-purple-500"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-purple-500"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-purple-500"></div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Position the QR code within the frame
            </p>
            <Button variant="outline" onClick={stopScanning}>
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Scanning
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;

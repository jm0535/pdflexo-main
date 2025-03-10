
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { toast } from "sonner";

interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add a line at the bottom for guidance
    ctx.beginPath();
    ctx.strokeStyle = '#cccccc';
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.stroke();
    ctx.strokeStyle = '#000000'; // Reset stroke style
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (!hasSignature) {
      toast.error("Please draw your signature before saving");
      return;
    }

    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw the bottom line
    ctx.beginPath();
    ctx.strokeStyle = '#cccccc';
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.stroke();
    ctx.strokeStyle = '#000000'; // Reset stroke style
    
    setHasSignature(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
        <h3 className="text-lg font-medium mb-2">Draw Your Signature</h3>
        <div className="border border-gray-300 rounded-md mb-4">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            className="w-full cursor-crosshair"
          />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button variant="default" onClick={handleSave}>
              <Check className="mr-1 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;

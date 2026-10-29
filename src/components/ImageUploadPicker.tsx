import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Camera, 
  X, 
  AlertCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react';

interface ImageUploadPickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeBytes?: number; // default 5MB
}

export const ImageUploadPicker: React.FC<ImageUploadPickerProps> = ({
  images,
  onChange,
  maxImages = 4,
  maxSizeBytes = 5 * 1024 * 1024
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Compress & read image file to high-efficiency data URL
  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        reject(new Error(`Invalid format "${file.name}". Please choose JPG, PNG, WEBP, or GIF.`));
        return;
      }

      if (file.size > maxSizeBytes) {
        reject(new Error(`"${file.name}" exceeds the 5MB size limit.`));
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage('');

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`Maximum of ${maxImages} images allowed.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    setIsProcessing(true);
    setUploadProgress(15);

    try {
      const processed: string[] = [];
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setUploadProgress(Math.round(((i + 1) / filesToProcess.length) * 90));
        const dataUrl = await processFile(file);
        processed.push(dataUrl);
      }

      setUploadProgress(100);
      onChange([...images, ...processed]);
      setTimeout(() => setUploadProgress(null), 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing image file.');
      setUploadProgress(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Hidden standard and camera inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Buttons: Gallery Pick & Camera Capture */}
      {images.length < maxImages && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-3 py-2 bg-white hover:bg-[#FAFAFA] border border-[#DBDBDB] hover:border-[#DD2A7B]/50 rounded-xl text-xs font-semibold text-[#262626] flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <UploadCloud size={15} className="text-[#DD2A7B]" />
            <span>Upload from Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="px-3 py-2 bg-white hover:bg-[#FAFAFA] border border-[#DBDBDB] hover:border-emerald-500/50 rounded-xl text-xs font-semibold text-[#262626] flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Camera size={15} className="text-emerald-600" />
            <span>Camera Capture</span>
          </button>

          <span className="text-[11px] text-[#737373]">
            ({images.length}/{maxImages} • up to 5MB)
          </span>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="space-y-1.5 p-3 rounded-xl bg-white border border-[#DBDBDB]">
          <div className="flex justify-between text-xs">
            <span className="text-[#262626] flex items-center gap-1.5 font-medium">
              <Loader2 size={13} className="animate-spin text-[#DD2A7B]" />
              Processing & Optimizing Image...
            </span>
            <span className="text-[#DD2A7B] font-bold font-mono">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-[#FAFAFA] h-1.5 rounded-full overflow-hidden border border-[#DBDBDB]">
            <div
              className="bg-gradient-to-r from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error alert with retry */}
      {errorMessage && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] underline font-bold flex items-center gap-1 hover:text-red-700 cursor-pointer"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Image Preview Grid with Remove buttons */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {images.map((src, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-[#DBDBDB] bg-[#FAFAFA] aspect-square"
            >
              <img
                src={src}
                alt={`Selected ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-[#ED4956] text-white shadow-md transition cursor-pointer"
                title="Remove image"
              >
                <X size={13} />
              </button>
              <div className="absolute bottom-1 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
                #{idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

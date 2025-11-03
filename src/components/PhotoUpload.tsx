import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
  userId: number;
}

const PhotoUpload = ({ currentPhotoUrl, onPhotoUploaded }: PhotoUploadProps) => {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || '');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setPhotoUrl(newUrl);
    onPhotoUploaded(newUrl);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="User" size={32} className="text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <Label htmlFor="photoUrl">URL фотографии</Label>
          <Input
            id="photoUrl"
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={photoUrl}
            onChange={handleUrlChange}
            className="bg-input border-border"
          />
          <p className="text-xs text-muted-foreground">
            Вставьте ссылку на изображение
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
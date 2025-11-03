import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
  userId: number;
}

const PhotoUpload = ({ currentPhotoUrl, onPhotoUploaded }: PhotoUploadProps) => {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setPhotoUrl(newUrl);
    onPhotoUploaded(newUrl);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Выберите изображение',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 2 МБ',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setPhotoUrl(base64String);
        onPhotoUploaded(base64String);
        setUploading(false);
        
        toast({
          title: 'Успешно',
          description: 'Фотография загружена'
        });
      };

      reader.onerror = () => {
        setUploading(false);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить файл',
          variant: 'destructive'
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фотографию',
        variant: 'destructive'
      });
    }
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
          <Label>Фотография</Label>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Icon name="Upload" size={16} className="mr-2" />
                  Выбрать файл
                </>
              )}
            </Button>
          </div>
          <Input
            id="photoUrl"
            type="url"
            placeholder="Или вставьте URL"
            value={photoUrl.startsWith('data:') ? '' : photoUrl}
            onChange={handleUrlChange}
            className="bg-input border-border text-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
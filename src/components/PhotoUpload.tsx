import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
  userId: number;
}

const PhotoUpload = ({ currentPhotoUrl, onPhotoUploaded, userId }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 5 МБ',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('https://api.poehali.dev/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Ошибка загрузки файла');
      }

      const { url } = await uploadResponse.json();
      setPhotoUrl(url);

      const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
      const userEmail = localStorage.getItem('userEmail') || '';

      const updateResponse = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          id: userId,
          photoUrl: url
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Ошибка обновления профиля');
      }

      onPhotoUploaded(url);

      toast({
        title: 'Успешно',
        description: 'Фотография обновлена'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фотографию',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="User" size={48} className="text-muted-foreground" />
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
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
            Загрузить фото
          </>
        )}
      </Button>
    </div>
  );
};

export default PhotoUpload;

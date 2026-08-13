import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const PROFILE_URL = (funcUrls as Record<string, string>)["profile"];

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("authToken");
  return token
    ? { "Content-Type": "application/json", "X-Auth-Token": token }
    : { "Content-Type": "application/json" };
};

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  currentPhotoUrl?: string;
  currentCoverUrl?: string;
  initials: string;
  onPhotoUpdated?: (url: string) => void;
  onCoverUpdated?: (url: string) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ProfileEditDialog({
  open,
  onOpenChange,
  email,
  currentPhotoUrl,
  currentCoverUrl,
  initials,
  onPhotoUpdated,
  onCoverUpdated,
}: ProfileEditDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentPhotoUrl);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(currentCoverUrl);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  const handlePickFile = () => fileRef.current?.click();
  const handlePickCover = () => coverRef.current?.click();

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Нужно изображение", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "Максимум 5 МБ", variant: "destructive" });
      return;
    }
    setUploadingCover(true);
    try {
      const base64 = await fileToBase64(file);
      setCoverPreview(base64);
      const res = await fetch(PROFILE_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "upload_cover", email, image: base64 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Не удалось загрузить");
      setCoverPreview(data.cover_url);
      localStorage.setItem("userCoverUrl", data.cover_url);
      onCoverUpdated?.(data.cover_url);
      toast({ title: "Шапка обновлена" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить шапку";
      toast({ title: "Ошибка", description: message, variant: "destructive" });
      setCoverPreview(currentCoverUrl);
    } finally {
      setUploadingCover(false);
      if (coverRef.current) coverRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Нужно изображение", description: "Выбери файл-картинку (JPG, PNG или WebP)", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "Максимум 5 МБ", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setPreview(base64);
      const res = await fetch(PROFILE_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "upload_avatar", email, image: base64 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Не удалось загрузить фото");
      }
      setPreview(data.photo_url);
      localStorage.setItem("userPhotoUrl", data.photo_url);
      onPhotoUpdated?.(data.photo_url);
      toast({ title: "Фото обновлено", description: "Аватар успешно загружен" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить фото";
      toast({ title: "Ошибка", description: message, variant: "destructive" });
      setPreview(currentPhotoUrl);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast({ title: "Заполни все поля", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Слишком короткий пароль", description: "Минимум 6 символов", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    setChanging(true);
    try {
      const res = await fetch(PROFILE_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          action: "change_password",
          email,
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Не удалось сменить пароль");
      }
      toast({ title: "Пароль изменён" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось сменить пароль";
      toast({ title: "Ошибка", description: message, variant: "destructive" });
    } finally {
      setChanging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Редактирование профиля</DialogTitle>
          <DialogDescription>Обнови аватар и пароль от аккаунта</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="avatar" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="avatar">
              <Icon name="ImagePlus" size={16} className="mr-1" />
              Аватар
            </TabsTrigger>
            <TabsTrigger value="cover">
              <Icon name="Image" size={16} className="mr-1" />
              Шапка
            </TabsTrigger>
            <TabsTrigger value="password">
              <Icon name="KeyRound" size={16} className="mr-1" />
              Пароль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cover" className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-32 rounded-lg overflow-hidden border border-border bg-gradient-to-r from-primary/30 via-purple-500/20 to-cyan-500/20">
                {coverPreview && (
                  <img src={coverPreview} alt="Шапка" className="w-full h-full object-cover" />
                )}
              </div>
              <input
                ref={coverRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverChange}
                className="hidden"
              />
              <Button onClick={handlePickCover} disabled={uploadingCover} className="w-full">
                {uploadingCover ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" size={16} className="mr-2" />
                    Выбрать шапку профиля
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Широкое изображение лучше всего. JPG, PNG или WebP. До 5 МБ.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="avatar" className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                <AvatarImage src={preview} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button onClick={handlePickFile} disabled={uploading} className="w-full">
                {uploading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" size={16} className="mr-2" />
                    Выбрать новое фото
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                JPG, PNG или WebP. До 5 МБ.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="old-password">Текущий пароль</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Новый пароль</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Повторите новый пароль</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={changing} className="w-full">
              {changing ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  Сохранить новый пароль
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
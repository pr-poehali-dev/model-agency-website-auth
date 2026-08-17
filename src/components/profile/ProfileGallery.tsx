import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const PHOTOS_URL = (funcUrls as Record<string, string>)["user-photos"];

interface Photo {
  id: number;
  photo_url: string;
  comment: string;
  position: number;
}

interface Props {
  targetEmail: string;
  actorEmail: string;
  actorRole: string;
  readOnly?: boolean;
}

const MAX_PHOTOS = 6;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ProfileGallery({ targetEmail, actorEmail, actorRole, readOnly }: Props) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<Photo | null>(null);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [editComment, setEditComment] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canEdit =
    !readOnly &&
    (actorRole === "director" || actorEmail.toLowerCase() === targetEmail.toLowerCase());

  const load = async () => {
    if (!targetEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`${PHOTOS_URL}?email=${encodeURIComponent(targetEmail)}`);
      const data = await res.json();
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [targetEmail]);

  const handlePick = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Нужно изображение", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "До 5 МБ", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(PHOTOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          target_email: targetEmail,
          actor_email: actorEmail,
          actor_role: actorRole,
          image: base64,
          comment: "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Ошибка");
      setPhotos((p) => [...p, data.photo]);
      toast({ title: "Фото добавлено" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не удалось загрузить";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Удалить фото?")) return;
    try {
      const res = await fetch(PHOTOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          target_email: targetEmail,
          actor_email: actorEmail,
          actor_role: actorRole,
          photo_id: photo.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Ошибка");
      setPhotos((p) => p.filter((x) => x.id !== photo.id));
      toast({ title: "Фото удалено" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не удалось удалить";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    }
  };

  const openEdit = (photo: Photo) => {
    setEditing(photo);
    setEditComment(photo.comment || "");
  };

  const saveComment = async () => {
    if (!editing) return;
    try {
      const res = await fetch(PHOTOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_comment",
          target_email: targetEmail,
          actor_email: actorEmail,
          actor_role: actorRole,
          photo_id: editing.id,
          comment: editComment,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Ошибка");
      setPhotos((p) =>
        p.map((x) => (x.id === editing.id ? { ...x, comment: editComment } : x)),
      );
      setEditing(null);
      toast({ title: "Подпись обновлена" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не удалось сохранить";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon name="Loader2" size={16} className="animate-spin" />
          Загрузка галереи...
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
          <Icon name="Images" size={20} className="text-primary" />
          Галерея
          <span className="text-sm text-muted-foreground font-normal">
            {photos.length}/{MAX_PHOTOS}
          </span>
        </h3>
        {canEdit && photos.length < MAX_PHOTOS && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
              className="hidden"
            />
            <Button size="sm" onClick={handlePick} disabled={uploading}>
              {uploading ? (
                <>
                  <Icon name="Loader2" size={14} className="mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Icon name="Plus" size={14} className="mr-2" />
                  Добавить фото
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Icon name="ImageOff" size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Пока нет фото</p>
          {canEdit && (
            <p className="text-xs mt-1">Нажми «Добавить фото», чтобы загрузить первое</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-background/50 border border-border/50">
              <img
                src={photo.photo_url}
                alt={photo.comment || "Фото"}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setViewing(photo)}
              />
              {photo.comment && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pointer-events-none">
                  <p className="text-white text-xs line-clamp-2">{photo.comment}</p>
                </div>
              )}
              {canEdit && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 p-0 bg-background/90 hover:bg-background"
                    onClick={(e) => { e.stopPropagation(); openEdit(photo); }}
                  >
                    <Icon name="Pencil" size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                  >
                    <Icon name="Trash2" size={12} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Фото</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <img
                src={viewing.photo_url}
                alt={viewing.comment || "Фото"}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
              {viewing.comment && (
                <p className="text-sm text-muted-foreground italic">«{viewing.comment}»</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Подпись к фото</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <img
                src={editing.photo_url}
                alt="Фото"
                className="w-full max-h-60 object-contain rounded-lg bg-background/50"
              />
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value.slice(0, 200))}
                placeholder="Краткая подпись (необязательно)"
                maxLength={200}
                rows={3}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{editComment.length}/200</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
                  <Button onClick={saveComment}>Сохранить</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

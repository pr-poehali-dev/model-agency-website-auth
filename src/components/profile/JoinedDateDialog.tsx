import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetchNoCreds } from "@/lib/api";
import funcUrls from "../../../backend/func2url.json";

const PROFILE_URL = (funcUrls as Record<string, string>)["profile"];

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEmail: string;
  currentValue?: string | null;
  onSaved: () => void;
}

const JoinedDateDialog = ({ open, onOpenChange, targetEmail, currentValue, onSaved }: Props) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 + 1 }, (_, i) => currentYear - i);

  const [month, setMonth] = useState("1");
  const [year, setYear] = useState(String(currentYear));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (currentValue) {
      const d = new Date(currentValue);
      if (!isNaN(d.getTime())) {
        setMonth(String(d.getMonth() + 1));
        setYear(String(d.getFullYear()));
        return;
      }
    }
    setMonth("1");
    setYear(String(currentYear));
  }, [open, currentValue, currentYear]);

  const save = async (reset: boolean) => {
    setSaving(true);
    try {
      const res = await authenticatedFetchNoCreds(PROFILE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_joined_at",
          email: targetEmail,
          joined_at: reset ? null : `${year}-${String(month).padStart(2, "0")}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: reset ? "Дата сброшена" : "Дата обновлена" });
        onSaved();
        onOpenChange(false);
      } else {
        toast({
          title: data.error || "Не удалось сохранить",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Ошибка соединения", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>В компании с</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Месяц</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Год</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Если сбросить, будет показана дата создания учётной записи.
          </p>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => save(false)} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button variant="outline" onClick={() => save(true)} disabled={saving}>
              Сбросить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinedDateDialog;

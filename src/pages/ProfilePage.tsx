import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, type Period } from "@/utils/periodUtils";
import funcUrls from "../../backend/func2url.json";

const SHIFT_PROGRESS_URL = (funcUrls as Record<string, string>)["shift-progress"];
const PRODUCER_PLANS_URL = (funcUrls as Record<string, string>)["producer-plans"];

const formatIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const MOCK_USER = {
  name: "Анастасия Волкова",
  role: "Модель",
  email: "anastasia@agency.com",
  avatar: "https://cdn.poehali.dev/projects/25df84be-2a57-474f-bb58-132a6c9f8811/files/5e020e37-1504-41c9-a68f-aa839b86978e.jpg",
  joinedAt: "Март 2024",
  location: "Москва",
};

const MOCK_ACHIEVEMENTS = [
  {
    id: 1,
    emoji: "🥇",
    title: "Лучший месяц",
    description: "Наивысший результат по продажам за Март 2024",
    grantedBy: "Директор",
    date: "01.04.2024",
    color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
  },
  {
    id: 2,
    emoji: "⭐",
    title: "Звезда команды",
    description: "Отмечена коллегами за помощь и поддержку",
    grantedBy: "Продюсер Иван",
    date: "15.03.2024",
    color: "from-purple-500/20 to-violet-500/10 border-purple-500/30",
  },
  {
    id: 3,
    emoji: "🔥",
    title: "Стабильность",
    description: "30 дней без пропусков и опозданий",
    grantedBy: "Продюсер Иван",
    date: "01.03.2024",
    color: "from-orange-500/20 to-red-500/10 border-orange-500/30",
  },
  {
    id: 4,
    emoji: "💎",
    title: "Топ-профиль",
    description: "Один из самых посещаемых профилей платформы",
    grantedBy: "Директор",
    date: "20.02.2024",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
  },
];

const MOCK_COMMENTS = [
  {
    id: 1,
    author: "Иван Петров",
    role: "Продюсер",
    text: "Отличная работа в этом месяце! Настя показывает стабильный рост и всегда вовремя выполняет задачи.",
    date: "18.04.2024",
    avatar: "ИП",
  },
  {
    id: 2,
    author: "Мария Соколова",
    role: "Оператор",
    text: "Приятно работать в паре, всегда на связи и готова к изменениям графика.",
    date: "12.04.2024",
    avatar: "МС",
  },
  {
    id: 3,
    author: "Директор",
    role: "Директор",
    text: "Продолжай в том же духе, результаты говорят сами за себя.",
    date: "05.04.2024",
    avatar: "Д",
  },
];

const MOCK_PROGRESS = [
  { label: "Посещаемость", value: 96, color: "bg-green-500" },
];

const MOCK_RATING = [
  { place: 1, name: "Анастасия Волкова", role: "Модель", score: 97, emoji: "🥇", achievements: 4 },
  { place: 2, name: "Иван Петров", role: "Продюсер", score: 91, emoji: "🥈", achievements: 3 },
  { place: 3, name: "Мария Соколова", role: "Оператор", score: 85, emoji: "🥉", achievements: 2 },
  { place: 4, name: "Дмитрий Козлов", role: "Оператор", score: 78, emoji: null, achievements: 1 },
  { place: 5, name: "Елена Новикова", role: "Модель", score: 72, emoji: null, achievements: 1 },
  { place: 6, name: "Алексей Смирнов", role: "Контент-мейкер", score: 65, emoji: null, achievements: 0 },
];

const ROLE_LABELS: Record<string, string> = {
  director: "Директор",
  producer: "Продюсер",
  operator: "Оператор",
  model: "Модель",
  content_maker: "Контент-мейкер",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [ratingOpen, setRatingOpen] = useState(false);
  const userRole = localStorage.getItem("userRole") || "model";
  const userName = localStorage.getItem("userName") || MOCK_USER.name;
  const userEmail = localStorage.getItem("userEmail") || MOCK_USER.email;

  const createdAtRaw = localStorage.getItem("userCreatedAt");
  const joinedLabel = createdAtRaw
    ? new Date(createdAtRaw).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    : MOCK_USER.joinedAt;

  const currentUserRole = localStorage.getItem("userRole") || "model";
  const isProducer = userRole === "producer";
  const isShiftTracked = userRole === "operator" || userRole === "content_maker" || isProducer;
  const viewerIsDirector = currentUserRole === "director";
  const [period, setPeriod] = useState<Period>(() => getCurrentPeriod());
  const [shiftData, setShiftData] = useState<{
    shifts_count: number;
    target: number;
    models_assigned: number;
    bonus_ready: boolean;
    income_fact?: number;
    income_plan?: number;
    shifts_ready?: boolean;
    income_ready?: boolean;
  } | null>(null);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planInputValue, setPlanInputValue] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  const reloadShiftData = () => {
    if (!isShiftTracked || !userEmail) return;
    setLoadingShifts(true);
    const url = `${SHIFT_PROGRESS_URL}?user_email=${encodeURIComponent(userEmail)}&role=${encodeURIComponent(userRole)}&period_start=${formatIsoDate(period.startDate)}&period_end=${formatIsoDate(period.endDate)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.shifts_count === "number") {
          setShiftData({
            shifts_count: data.shifts_count,
            target: data.target,
            models_assigned: data.models_assigned,
            bonus_ready: data.bonus_ready,
            income_fact: data.income_fact,
            income_plan: data.income_plan,
            shifts_ready: data.shifts_ready,
            income_ready: data.income_ready,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingShifts(false));
  };

  useEffect(() => {
    setShiftData(null);
    reloadShiftData();
  }, [isShiftTracked, userEmail, userRole, period]);

  const openPlanDialog = () => {
    setPlanInputValue(shiftData?.income_plan ? String(shiftData.income_plan) : "");
    setPlanDialogOpen(true);
  };

  const savePlan = async () => {
    const amount = parseFloat(planInputValue);
    if (isNaN(amount) || amount < 0) {
      toast.error("Введите корректную сумму");
      return;
    }
    setSavingPlan(true);
    try {
      const response = await fetch(PRODUCER_PLANS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producer_email: userEmail,
          period_start: formatIsoDate(period.startDate),
          period_end: formatIsoDate(period.endDate),
          plan_amount: amount,
          set_by_email: localStorage.getItem("userEmail") || "",
          user_role: currentUserRole,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("План дохода сохранён");
        setPlanDialogOpen(false);
        reloadShiftData();
      } else {
        toast.error(data.error || "Ошибка сохранения");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSavingPlan(false);
    }
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Назад
        </Button>

        {/* Шапка профиля */}
        <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/30 via-purple-500/20 to-cyan-500/20" />
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                  <AvatarImage src={MOCK_USER.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Медали-бейджи на аватаре */}
                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                  {MOCK_ACHIEVEMENTS.slice(0, 3).map((a) => (
                    <span
                      key={a.id}
                      title={a.title}
                      className="text-base leading-none cursor-default"
                    >
                      {a.emoji}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1 pb-1">
                <h1 className="text-2xl font-bold text-foreground font-heading">
                  {userName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    {ROLE_LABELS[userRole] || userRole}
                  </Badge>

                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <Icon name="Calendar" size={13} />
                    В компании с {joinedLabel}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">{userEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Достижения */}
          <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground flex items-center gap-2 font-heading">
                <Icon name="Trophy" size={20} className="text-primary" />
                Достижения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_ACHIEVEMENTS.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-xl border bg-gradient-to-br p-4 ${achievement.color} transition-all hover:scale-[1.02] cursor-default`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl leading-none">{achievement.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{achievement.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Icon name="User" size={11} />
                            {achievement.grantedBy}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{achievement.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Прогресс */}
          <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-foreground flex items-center gap-2 font-heading">
                  <Icon name="TrendingUp" size={20} className="text-primary" />
                  Прогресс
                </CardTitle>
                {isShiftTracked && (
                  <div className="flex items-center gap-1 bg-background/50 rounded-lg px-2 py-1 border border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setPeriod(getPreviousPeriod(period))}
                    >
                      <Icon name="ChevronLeft" size={14} />
                    </Button>
                    <span className="text-xs text-muted-foreground px-1 min-w-[70px] text-center">{period.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setPeriod(getNextPeriod(period))}
                    >
                      <Icon name="ChevronRight" size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Посещаемость смен (для оператора/мейкера/продюсера) */}
                {isShiftTracked && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-muted-foreground">
                        Посещаемость смен
                        {shiftData && shiftData.models_assigned > 1 && (
                          <span className="text-xs ml-1">
                            ({shiftData.models_assigned} моделей)
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {loadingShifts
                          ? "..."
                          : shiftData
                          ? `${shiftData.shifts_count} / ${shiftData.target}`
                          : "0 / 10"}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          (isProducer ? shiftData?.shifts_ready : shiftData?.bonus_ready)
                            ? "bg-green-500"
                            : "bg-primary"
                        }`}
                        style={{
                          width: shiftData && shiftData.target > 0
                            ? `${Math.min(100, (shiftData.shifts_count / shiftData.target) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                    {!isProducer && (
                      <p
                        className={`text-xs mt-2 font-semibold transition-colors ${
                          shiftData?.bonus_ready ? "text-green-500" : "text-muted-foreground/60"
                        }`}
                      >
                        Премия 5000 руб.
                      </p>
                    )}
                  </div>
                )}

                {/* План дохода (только для продюсера) */}
                {isProducer && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        План дохода
                        {viewerIsDirector && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={openPlanDialog}
                          >
                            <Icon name="Pencil" size={12} />
                          </Button>
                        )}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {loadingShifts
                          ? "..."
                          : shiftData
                          ? `$${(shiftData.income_fact || 0).toFixed(0)} / $${(shiftData.income_plan || 0).toFixed(0)}`
                          : "$0 / $0"}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          shiftData?.income_ready ? "bg-green-500" : "bg-purple-500"
                        }`}
                        style={{
                          width: shiftData && (shiftData.income_plan || 0) > 0
                            ? `${Math.min(100, ((shiftData.income_fact || 0) / (shiftData.income_plan || 1)) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                    {!shiftData?.income_plan && !viewerIsDirector && (
                      <p className="text-xs mt-1 text-muted-foreground/60">План не задан директором</p>
                    )}
                    <p
                      className={`text-xs mt-2 font-semibold transition-colors ${
                        shiftData?.bonus_ready ? "text-green-500" : "text-muted-foreground/60"
                      }`}
                    >
                      Премия 5000 руб.
                    </p>
                  </div>
                )}

                {MOCK_PROGRESS.slice(0, isShiftTracked ? (isProducer ? 0 : 1) : 2).map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Комментарии */}
          <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2 font-heading">
                  <Icon name="MessageSquare" size={20} className="text-primary" />
                  Отзывы коллег
                </CardTitle>
                <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setRatingOpen(true)}>
                  <Icon name="BarChart2" size={15} className="mr-1.5" />
                  Рейтинг сотрудников
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_COMMENTS.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {comment.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        {comment.author}
                      </span>
                      <Badge variant="outline" className="text-xs py-0 px-1.5 border-border/50 text-muted-foreground">
                        {comment.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{comment.text}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{comment.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Диалог рейтинга */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-foreground">
              <Icon name="BarChart2" size={20} className="text-primary" />
              Рейтинг сотрудников
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {MOCK_RATING.map((person) => (
              <div
                key={person.place}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
                  person.name === (localStorage.getItem("userName") || "")
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/30 border-border/40"
                }`}
              >
                <span className="w-7 text-center text-lg font-bold">
                  {person.emoji ?? <span className="text-sm text-muted-foreground">{person.place}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{person.name}</p>
                  <p className="text-xs text-muted-foreground">{person.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{person.score}</p>
                  <p className="text-xs text-muted-foreground">{person.achievements} 🏅</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог задания плана дохода (для директора) */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-foreground">
              <Icon name="Target" size={20} className="text-primary" />
              План дохода продюсера
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="text-sm text-muted-foreground">
              <div>Продюсер: <span className="text-foreground font-medium">{userName}</span></div>
              <div>Период: <span className="text-foreground font-medium">{period.label}</span></div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Сумма плана, $</label>
              <Input
                type="number"
                min="0"
                step="1"
                value={planInputValue}
                onChange={(e) => setPlanInputValue(e.target.value)}
                placeholder="Например, 5000"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)} disabled={savingPlan}>
              Отмена
            </Button>
            <Button onClick={savePlan} disabled={savingPlan}>
              {savingPlan ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
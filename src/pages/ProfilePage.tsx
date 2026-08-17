import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useProfileData, useShiftProgress } from "@/hooks/useProfileQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, type Period } from "@/utils/periodUtils";
import ProducerPlansManager from "@/components/ProducerPlansManager";
import ProfileEditDialog from "@/components/profile/ProfileEditDialog";
import AchievementsSection from "@/components/profile/AchievementsSection";
import AchievementTypesManager from "@/components/profile/AchievementTypesManager";
import GrantAchievementDialog from "@/components/profile/GrantAchievementDialog";
import AchievementsHistoryDialog from "@/components/profile/AchievementsHistoryDialog";
import ProfileGallery from "@/components/profile/ProfileGallery";
import TeamDirectory from "@/components/profile/TeamDirectory";
import JoinedDateDialog from "@/components/profile/JoinedDateDialog";
import { Skeleton } from "@/components/ui/skeleton";

const MOCK_USER = {
  name: "Анастасия Волкова",
  role: "Модель",
  email: "anastasia@agency.com",
  avatar: "https://cdn.poehali.dev/projects/25df84be-2a57-474f-bb58-132a6c9f8811/files/5e020e37-1504-41c9-a68f-aa839b86978e.jpg",
  joinedAt: "Март 2024",
  location: "Москва",
};

const ROLE_LABELS: Record<string, string> = {
  director: "Директор",
  producer: "Продюсер",
  operator: "Оператор",
  model: "Модель",
  content_maker: "Контент-мейкер",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [typesManagerOpen, setTypesManagerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [achievementsRefresh, setAchievementsRefresh] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string>(() => localStorage.getItem("userPhotoUrl") || "");
  const [coverUrl, setCoverUrl] = useState<string>(() => localStorage.getItem("userCoverUrl") || "");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [joinedOpen, setJoinedOpen] = useState(false);
  const queryClient = useQueryClient();
  const { email: emailParam } = useParams<{ email: string }>();
  const viewedEmail = emailParam ? decodeURIComponent(emailParam) : "";

  const currentUserRole = localStorage.getItem("userRole") || "model";
  const currentUserEmail = localStorage.getItem("userEmail") || "";

  const userEmail = viewedEmail || currentUserEmail || MOCK_USER.email;
  const viewingOther = !!viewedEmail && viewedEmail.toLowerCase() !== currentUserEmail.toLowerCase();

  const { data: profileData } = useProfileData(userEmail);

  const userName = viewingOther
    ? profileData?.full_name || userEmail
    : localStorage.getItem("userName") || MOCK_USER.name;
  const userRole = viewingOther
    ? profileData?.role || ""
    : localStorage.getItem("userRole") || "model";

  const createdAtRaw =
    profileData?.joined_at ||
    profileData?.created_at ||
    (viewingOther ? null : localStorage.getItem("userCreatedAt"));
  const joinedLabel = createdAtRaw
    ? new Date(createdAtRaw).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    : viewingOther
      ? null
      : MOCK_USER.joinedAt;
  const isProducer = userRole === "producer";
  const isShiftTracked = userRole === "operator" || userRole === "content_maker";
  const isDirectorProfile = userRole === "director";
  const viewerIsDirector = currentUserRole === "director";
  const viewerIsProducer = currentUserRole === "producer";
  const isOwnProfile =
    !!currentUserEmail && currentUserEmail.toLowerCase() === userEmail.toLowerCase();
  const canEditProfile = isOwnProfile;
  const showProducerPlansSection = viewerIsDirector && isOwnProfile;
  const canGrantAchievement = viewerIsDirector || viewerIsProducer;
  const showTypesManager = viewerIsDirector && isOwnProfile;
  const canSeeProgress = isOwnProfile;
  const [period, setPeriod] = useState<Period>(() => getCurrentPeriod());

  const { data: shiftData = null, isFetching: loadingShifts } = useShiftProgress(
    userEmail,
    userRole,
    period.startDate,
    period.endDate,
    (isShiftTracked || isProducer || isDirectorProfile) && canSeeProgress,
  );

  const attendancePercent =
    shiftData && shiftData.target > 0
      ? Math.round((shiftData.shifts_count / shiftData.target) * 100)
      : 0;

  useEffect(() => {
    if (viewingOther) {
      setPhotoUrl("");
      setCoverUrl("");
    } else {
      setPhotoUrl(localStorage.getItem("userPhotoUrl") || "");
      setCoverUrl(localStorage.getItem("userCoverUrl") || "");
    }
  }, [userEmail, viewingOther]);

  useEffect(() => {
    if (viewingOther) {
      if (profileData?.email && profileData.email.toLowerCase() !== userEmail.toLowerCase()) return;
      setCoverUrl(profileData?.cover_url || "");
      setPhotoUrl(profileData?.photo_url || "");
      return;
    }
    if (!profileData?.success) return;
    setCoverUrl(profileData.cover_url || "");
    setPhotoUrl(profileData.photo_url || "");
    if (profileData.cover_url) {
      localStorage.setItem("userCoverUrl", profileData.cover_url);
    } else {
      localStorage.removeItem("userCoverUrl");
    }
    if (profileData.photo_url) {
      localStorage.setItem("userPhotoUrl", profileData.photo_url);
    } else {
      localStorage.removeItem("userPhotoUrl");
    }
  }, [profileData, viewingOther, userEmail]);



  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(viewingOther ? "/profile" : "/dashboard")}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            {viewingOther ? "К моему профилю" : "Назад"}
          </Button>
          {viewingOther && (
            <span className="text-xs text-muted-foreground">Профиль сотрудника</span>
          )}
        </div>

        {/* Шапка профиля */}
        <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm overflow-hidden">
          <div
            className="h-32 sm:h-40 bg-gradient-to-r from-primary/30 via-purple-500/20 to-cyan-500/20 bg-cover bg-center relative group"
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
          >
            {canEditProfile && (
              <button
                onClick={() => setEditOpen(true)}
                className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 backdrop-blur-sm border border-border/50"
              >
                <Icon name="Camera" size={12} />
                Сменить шапку
              </button>
            )}
          </div>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              <div className="relative">
                <Avatar
                  className="w-24 h-24 border-4 border-background shadow-xl cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setAvatarOpen(true)}
                >
                  <AvatarImage src={photoUrl || MOCK_USER.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
                <DialogContent className="max-w-lg p-2 bg-background/95 backdrop-blur-sm">
                  <img
                    src={photoUrl || MOCK_USER.avatar}
                    alt={userName}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                </DialogContent>
              </Dialog>

              <div className="flex-1 pb-1">
                <h1 className="text-2xl font-bold text-foreground font-heading">
                  {userName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {userRole && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                      {ROLE_LABELS[userRole] || userRole}
                    </Badge>
                  )}

                  {joinedLabel && (
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <Icon name="Calendar" size={13} />
                      В компании с {joinedLabel}
                      {viewerIsDirector && (
                        <button
                          type="button"
                          onClick={() => setJoinedOpen(true)}
                          title="Изменить дату"
                          className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Icon name="Pencil" size={12} />
                        </button>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1">{userEmail}</p>
              </div>

              {canEditProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="self-start sm:self-end"
                >
                  <Icon name="Settings" size={14} className="mr-2" />
                  Редактировать
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <ProfileEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          email={userEmail}
          currentPhotoUrl={photoUrl}
          currentCoverUrl={coverUrl}
          initials={initials}
          onPhotoUpdated={setPhotoUrl}
          onCoverUpdated={setCoverUrl}
        />

        <JoinedDateDialog
          open={joinedOpen}
          onOpenChange={setJoinedOpen}
          targetEmail={userEmail}
          currentValue={profileData?.joined_at || profileData?.created_at}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["profile", userEmail] })}
        />

        <ProfileGallery
          targetEmail={userEmail}
          actorEmail={currentUserEmail}
          actorRole={currentUserRole}
          readOnly={viewingOther}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="md:col-span-2 space-y-3">
            {(showTypesManager || canGrantAchievement) && (
              <div className="flex flex-wrap gap-2 justify-end">
                {showTypesManager && (
                  <Button variant="outline" size="sm" onClick={() => setTypesManagerOpen(true)}>
                    <Icon name="Settings2" size={14} className="mr-2" />
                    Управление достижениями
                  </Button>
                )}
                {showTypesManager && (
                  <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
                    <Icon name="History" size={14} className="mr-2" />
                    История
                  </Button>
                )}
                {canGrantAchievement && (
                  <Button size="sm" onClick={() => setGrantOpen(true)}>
                    <Icon name="Award" size={14} className="mr-2" />
                    Назначить достижение
                  </Button>
                )}
              </div>
            )}
            <AchievementsSection userEmail={userEmail} refreshKey={achievementsRefresh} />
          </div>

          {showTypesManager && (
            <AchievementTypesManager
              open={typesManagerOpen}
              onOpenChange={setTypesManagerOpen}
              actorEmail={currentUserEmail}
            />
          )}

          {showTypesManager && (
            <AchievementsHistoryDialog
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              actorEmail={currentUserEmail}
              onChanged={() => setAchievementsRefresh((x) => x + 1)}
            />
          )}

          {canGrantAchievement && (
            <GrantAchievementDialog
              open={grantOpen}
              onOpenChange={setGrantOpen}
              targetEmail={isOwnProfile ? undefined : userEmail}
              targetName={isOwnProfile ? undefined : userName}
              actorEmail={currentUserEmail}
              actorRole={currentUserRole}
              onGranted={() => setAchievementsRefresh((x) => x + 1)}
            />
          )}

          {/* Прогресс — только свой профиль или директор */}
          {canSeeProgress && (
          <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-foreground flex items-center gap-2 font-heading">
                  <Icon name="TrendingUp" size={20} className="text-primary" />
                  Прогресс
                </CardTitle>
                {(isShiftTracked || isProducer || isDirectorProfile) && (
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
                {/* Сводка по агентству (для директора) */}
                {isDirectorProfile && (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-muted-foreground">Отработано смен</span>
                        <span className="text-sm font-semibold text-foreground">
                          {loadingShifts ? (
                            <Skeleton className="h-4 w-16 inline-block align-middle" />
                          ) : (
                            `${shiftData?.shifts_count ?? 0} / ${shiftData?.target ?? 0}`
                          )}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            attendancePercent >= 100
                              ? "bg-green-500"
                              : attendancePercent >= 70
                                ? "bg-primary"
                                : "bg-orange-500"
                          }`}
                          style={{ width: `${Math.min(100, attendancePercent)}%` }}
                        />
                      </div>
                      <p className="text-xs mt-2 text-muted-foreground/60">
                        {shiftData && shiftData.models_assigned > 0
                          ? `${attendancePercent}% нормы · ${shiftData.models_assigned} моделей работали`
                          : "Нет данных за период"}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-muted-foreground">Доход агентства</span>
                        <span className="text-sm font-semibold text-foreground">
                          {loadingShifts ? (
                            <Skeleton className="h-4 w-20 inline-block align-middle" />
                          ) : (
                            `$${(shiftData?.income_fact || 0).toFixed(0)}`
                          )}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500 transition-all duration-700 w-full" />
                      </div>
                      <p className="text-xs mt-2 text-muted-foreground/60">
                        Активных сотрудников: {shiftData?.active_staff ?? 0}
                      </p>
                    </div>
                  </>
                )}

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
                        {loadingShifts ? (
                          <Skeleton className="h-4 w-16 inline-block align-middle" />
                        ) : shiftData ? (
                          `${shiftData.shifts_count} / ${shiftData.target}`
                        ) : (
                          "0 / 10"
                        )}
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
                        Премия {(shiftData?.bonus_value ?? 5000).toLocaleString("ru-RU")} руб.
                      </p>
                    )}
                  </div>
                )}

                {/* План дохода (только для продюсера) */}
                {isProducer && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-muted-foreground">
                        План дохода
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {loadingShifts ? (
                          <Skeleton className="h-4 w-24 inline-block align-middle" />
                        ) : shiftData ? (
                          `$${(shiftData.income_fact || 0).toFixed(0)} / $${(shiftData.income_plan || 0).toFixed(0)}`
                        ) : (
                          "$0 / $0"
                        )}
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
                    {!shiftData?.income_plan && (
                      <p className="text-xs mt-1 text-muted-foreground/60">План не задан директором</p>
                    )}
                    <p
                      className={`text-xs mt-2 font-semibold transition-colors ${
                        shiftData?.bonus_ready ? "text-green-500" : "text-muted-foreground/60"
                      }`}
                    >
                      Премия {(shiftData?.bonus_value ?? 5000).toLocaleString("ru-RU")} руб.
                    </p>
                  </div>
                )}

                {isShiftTracked && !isProducer && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-muted-foreground">Посещаемость</span>
                      <span className="text-sm font-semibold text-foreground">
                        {loadingShifts ? (
                          <Skeleton className="h-4 w-12 inline-block align-middle" />
                        ) : (
                          `${attendancePercent}%`
                        )}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          attendancePercent >= 100
                            ? "bg-green-500"
                            : attendancePercent >= 70
                              ? "bg-primary"
                              : "bg-orange-500"
                        }`}
                        style={{ width: `${Math.min(100, attendancePercent)}%` }}
                      />
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground/60">
                      {shiftData
                        ? `Отработано ${shiftData.shifts_count} из ${shiftData.target} смен за период`
                        : "Нет данных за период"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Список сотрудников — виден в своём профиле */}
          {!viewingOther && <TeamDirectory currentUserEmail={currentUserEmail} />}

          {/* Блок управления планами продюсеров (только для директора в своём профиле) */}
          {showProducerPlansSection && (
            <ProducerPlansManager
              currentUserEmail={currentUserEmail}
              currentUserRole={currentUserRole}
            />
          )}

        </div>
      </div>

    </div>
  );
}
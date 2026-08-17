import { useQuery } from "@tanstack/react-query";
import funcUrls from "../../backend/func2url.json";
import { authenticatedFetchNoCreds } from "@/lib/api";

const PROFILE_URL = (funcUrls as Record<string, string>)["profile"];
const SHIFT_PROGRESS_URL = (funcUrls as Record<string, string>)["shift-progress"];

const formatIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export type ProfileData = {
  success?: boolean;
  cover_url?: string;
  photo_url?: string;
  email?: string;
  full_name?: string;
  role?: string;
  created_at?: string;
};

export type ShiftData = {
  shifts_count: number;
  target: number;
  models_assigned: number;
  bonus_ready: boolean;
  income_fact?: number;
  income_plan?: number;
  shifts_ready?: boolean;
  income_ready?: boolean;
  active_staff?: number;
  is_director?: boolean;
  bonus_value?: number;
  plan_type?: string;
};

export const useProfileData = (userEmail: string) => {
  return useQuery<ProfileData | null>({
    queryKey: ["profile", userEmail],
    enabled: !!userEmail && !!PROFILE_URL,
    queryFn: async () => {
      const r = await authenticatedFetchNoCreds(PROFILE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_profile", email: userEmail }),
      });
      return r.json();
    },
  });
};

export const useShiftProgress = (
  userEmail: string,
  userRole: string,
  startDate: Date,
  endDate: Date,
  enabled: boolean,
) => {
  const start = formatIsoDate(startDate);
  const end = formatIsoDate(endDate);
  return useQuery<ShiftData | null>({
    queryKey: ["shift-progress", userEmail, userRole, start, end],
    enabled: enabled && !!userEmail && !!SHIFT_PROGRESS_URL,
    queryFn: async () => {
      const url = `${SHIFT_PROGRESS_URL}?user_email=${encodeURIComponent(userEmail)}&role=${encodeURIComponent(userRole)}&period_start=${start}&period_end=${end}`;
      const r = await fetch(url);
      const data = await r.json();
      if (data && typeof data.shifts_count === "number") {
        return {
          shifts_count: data.shifts_count,
          target: data.target,
          models_assigned: data.models_assigned,
          bonus_ready: data.bonus_ready,
          income_fact: data.income_fact,
          income_plan: data.income_plan,
          shifts_ready: data.shifts_ready,
          income_ready: data.income_ready,
          active_staff: data.active_staff,
          is_director: data.is_director,
          bonus_value: data.bonus_value,
          plan_type: data.plan_type,
        };
      }
      return null;
    },
  });
};

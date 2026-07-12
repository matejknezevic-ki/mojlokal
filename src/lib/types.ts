export type Venue = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  owner_name: string | null;
  opening_days: number[];
  default_locale: "hr" | "de";
  currency: string;
  onboarded_at: string | null;
  created_at: string;
};

export type Waiter = {
  id: string;
  venue_id: string;
  name: string;
  target_shifts_per_week: number;
  availability: Record<string, boolean>;
  active: boolean;
  hourly_rate: number | null;
  calendar_token: string;
  created_at: string;
};

export type TimeOffRequest = {
  id: string;
  venue_id: string;
  waiter_id: string;
  off_date: string;
  note: string | null;
  status: "pending" | "approved" | "denied";
  created_at: string;
};

export type SwapRequest = {
  id: string;
  venue_id: string;
  shift_id: string;
  from_waiter_id: string;
  to_waiter_id: string | null;
  status: "open" | "accepted" | "approved" | "rejected" | "cancelled";
  created_at: string;
};

export type Tip = {
  id: string;
  venue_id: string;
  waiter_id: string;
  shift_session_id: string | null;
  amount: number;
  tip_date: string;
  created_at: string;
};

export type ShiftTemplate = {
  id: string;
  venue_id: string;
  name: string;
  start_time: string;
  end_time: string;
  position: number;
  active: boolean;
};

export type ChecklistItem = {
  id: string;
  venue_id: string;
  label: string;
  position: number;
  active: boolean;
};

export type Schedule = {
  id: string;
  venue_id: string;
  week_start: string;
  status: "draft" | "published";
  generated_by: "manual" | "ai" | "fallback";
  ai_notes: string | null;
  created_at: string;
};

export type Shift = {
  id: string;
  schedule_id: string;
  venue_id: string;
  waiter_id: string;
  template_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
};

export type ShiftSession = {
  id: string;
  venue_id: string;
  waiter_id: string;
  shift_id: string | null;
  started_at: string;
  ended_at: string | null;
  handover_note: string | null;
  created_at: string;
};

export type CashCount = {
  id: string;
  venue_id: string;
  waiter_id: string;
  shift_session_id: string;
  amount: number;
  note: string | null;
  counted_at: string;
};

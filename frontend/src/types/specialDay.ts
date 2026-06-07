export type SpecialDayType = 'hard_deadline' | 'milestone' | 'rest_day' | 'custom';

export interface SpecialDay {
  id: number;
  date: string;
  type: SpecialDayType;
  label: string;
  color: string;
  icon: string;
  reminder: boolean;
  note?: string | null;
}

export interface SpecialDayCreate {
  date: string;
  type: SpecialDayType;
  label?: string;
  color?: string;
  icon?: string;
  reminder?: boolean;
  note?: string | null;
}

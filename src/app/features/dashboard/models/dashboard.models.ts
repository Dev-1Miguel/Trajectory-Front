export type DashboardTone = 'success' | 'primary' | 'danger' | 'neutral';

export interface NavigationItem {
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
}

export interface MetricCard {
  title: string;
  amount: string;
  subtitle: string;
  tone: DashboardTone;
  icon: string;
  accentIcon: string;
}

export interface CategoryExpense {
  label: string;
  amount: string;
  percentage: number;
  color: string;
}

export interface SummaryItem {
  label: string;
  amount: string;
  tone: DashboardTone;
}

export interface Movement {
  title: string;
  category: string;
  date: string;
  amount: string;
  type: 'income' | 'expense';
}

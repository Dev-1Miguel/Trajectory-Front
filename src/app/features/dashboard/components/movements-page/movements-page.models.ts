export type MovementKind = 'income' | 'expense' | 'transfer';
export type MovementStep = 'list' | 'selector' | MovementKind | 'success';

export interface MovementFilter {
  id: MovementKind | 'all';
  label: string;
}

export interface MovementEntry {
  title: string;
  description: string;
  amount: string;
  time: string;
  kind: MovementKind;
}

export interface MovementGroup {
  label: string;
  items: MovementEntry[];
}

export interface MovementOption {
  kind: MovementKind;
  title: string;
  subtitle: string;
  icon: string;
}

export interface SuccessSummary {
  title: string;
  message: string;
  accent: MovementKind;
  rows: string[];
  amount: string;
}

export interface BottomNavigationItem {
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
}

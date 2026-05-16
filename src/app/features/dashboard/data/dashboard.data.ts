import { CategoryExpense, MetricCard, Movement, NavigationItem, SummaryItem } from '../models/dashboard.models';

export const dashboardNavigation: NavigationItem[] = [
  { label: 'Inicio', icon: 'home', active: true },
  { label: 'Movimientos', icon: 'swap-horizontal' },
  { label: 'Cuentas', icon: 'card-outline' },
  { label: 'Reportes', icon: 'bar-chart-outline' },
  { label: 'Presupuestos', icon: 'disc-outline' },
  { label: 'Metas', icon: 'flag-outline' },
  { label: 'Configuración', icon: 'settings-outline' },
];

export const metricCards: MetricCard[] = [
  {
    title: 'Dinero disponible',
    amount: '$450',
    subtitle: 'En todas tus cuentas',
    tone: 'success',
    icon: 'wallet',
    accentIcon: 'trending-up',
  },
  {
    title: 'Ingresos del mes',
    amount: '$800',
    subtitle: 'Total en mayo',
    tone: 'primary',
    icon: 'download',
    accentIcon: 'wallet-outline',
  },
  {
    title: 'Gastos del mes',
    amount: '$350',
    subtitle: 'Total en mayo',
    tone: 'danger',
    icon: 'arrow-up',
    accentIcon: 'pricetag',
  },
];

export const categoryExpenses: CategoryExpense[] = [
  { label: 'Alimentación', amount: '$122', percentage: 35, color: '#6257e8' },
  { label: 'Transporte', amount: '$88', percentage: 25, color: '#3f86e8' },
  { label: 'Servicios', amount: '$70', percentage: 20, color: '#61cf82' },
  { label: 'Entretenimiento', amount: '$35', percentage: 10, color: '#f7b819' },
  { label: 'Otros', amount: '$35', percentage: 10, color: '#a9b0c3' },
];

export const summaryItems: SummaryItem[] = [
  { label: 'Ingresos', amount: '$800', tone: 'success' },
  { label: 'Gastos', amount: '$350', tone: 'danger' },
  { label: 'Ahorro', amount: '$450', tone: 'success' },
];

export const latestMovements: Movement[] = [
  { title: 'Sueldo', category: 'Ingreso', date: '20 may. 2025', amount: '+$800', type: 'income' },
  { title: 'Supermercado', category: 'Alimentación', date: '19 may. 2025', amount: '-$45', type: 'expense' },
  { title: 'Transporte', category: 'Transporte', date: '19 may. 2025', amount: '-$20', type: 'expense' },
  { title: 'Internet', category: 'Servicios', date: '18 may. 2025', amount: '-$15', type: 'expense' },
  { title: 'Cine', category: 'Entretenimiento', date: '17 may. 2025', amount: '-$25', type: 'expense' },
];

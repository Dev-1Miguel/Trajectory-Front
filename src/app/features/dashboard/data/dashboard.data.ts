import { NavigationItem } from '../models/dashboard.models';

export const dashboardNavigation: NavigationItem[] = [
  { label: 'Inicio', icon: 'home', route: '/home', active: true },
  { label: 'Movimientos', icon: 'swap-horizontal', route: '/movimientos' },
  { label: 'Cuentas', icon: 'card-outline' },
  { label: 'Reportes', icon: 'bar-chart-outline' },
];

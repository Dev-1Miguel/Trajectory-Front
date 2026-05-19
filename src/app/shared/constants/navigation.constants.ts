import { NavigationItem } from '../models/navigation-item.model';

export const dashboardNavigation: NavigationItem[] = [
  { label: 'Inicio', icon: 'home', route: '/home' },
  { label: 'Movimientos', icon: 'swap-horizontal', route: '/movimientos' },
  { label: 'Cuentas', icon: 'card-outline' },
  { label: 'Reportes', icon: 'bar-chart-outline' },
];

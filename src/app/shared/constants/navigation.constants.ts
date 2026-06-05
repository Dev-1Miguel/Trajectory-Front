import { NavigationItem } from '../models/navigation-item.model';

export const dashboardNavigation: NavigationItem[] = [
  { label: 'Inicio', icon: 'home', route: '/home' },
  { label: 'Movimientos', icon: 'swap-horizontal', route: '/movimientos' },
  { label: 'Categor\u00edas', icon: 'pricetags-outline', route: '/categorias' },
  { label: 'Billeteras', icon: 'wallet-outline', route: '/billeteras' },
  { label: 'Reportes', icon: 'bar-chart-outline', route: '/reportes' },
];

import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  BottomNavigationItem,
  MovementFilter,
  MovementGroup,
  MovementKind,
  MovementOption,
  MovementStep,
  SuccessSummary,
} from './movements-page.models';

@Component({
  selector: 'app-movements-page',
  templateUrl: './movements-page.component.html',
  styleUrls: ['./movements-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementsPageComponent {
  readonly filters: MovementFilter[] = [
    { id: 'all', label: 'Todos' },
    { id: 'income', label: 'Ingresos' },
    { id: 'expense', label: 'Gastos' },
    { id: 'transfer', label: 'Transferencias' },
  ];

  readonly movementGroups: MovementGroup[] = [
    {
      label: 'Hoy, 17 de mayo',
      items: [
        {
          title: 'Sueldo',
          description: 'Ingreso - Banco Pichincha',
          amount: '+$800.00',
          time: '09:00',
          kind: 'income',
        },
        {
          title: 'Transporte',
          description: 'Gasto - Efectivo',
          amount: '-$20.00',
          time: '08:15',
          kind: 'expense',
        },
        {
          title: 'Alimentacion',
          description: 'Gasto - Efectivo',
          amount: '-$35.00',
          time: '13:20',
          kind: 'expense',
        },
      ],
    },
    {
      label: 'Ayer, 16 de mayo',
      items: [
        {
          title: 'Transferencia a Ahorros',
          description: 'Transferencia - Banco Pichincha',
          amount: '-$150.00',
          time: '16:45',
          kind: 'transfer',
        },
        {
          title: 'Freelance',
          description: 'Ingreso - Banco Pichincha',
          amount: '+$200.00',
          time: '11:30',
          kind: 'income',
        },
        {
          title: 'Internet',
          description: 'Gasto - Tarjeta de Credito',
          amount: '-$25.00',
          time: '10:10',
          kind: 'expense',
        },
      ],
    },
    {
      label: '15 de mayo',
      items: [
        {
          title: 'Cine',
          description: 'Gasto - Efectivo',
          amount: '-$15.00',
          time: '20:30',
          kind: 'expense',
        },
      ],
    },
  ];

  readonly movementOptions: MovementOption[] = [
    {
      kind: 'income',
      title: 'Ingreso',
      subtitle: 'Dinero que recibes',
      icon: 'download-outline',
    },
    {
      kind: 'expense',
      title: 'Gasto',
      subtitle: 'Dinero que pagas',
      icon: 'arrow-up-outline',
    },
    {
      kind: 'transfer',
      title: 'Transferencia',
      subtitle: 'Dinero entre cuentas',
      icon: 'swap-horizontal-outline',
    },
  ];

  readonly bottomNavigation: BottomNavigationItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/home' },
    { label: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movimientos', active: true },
    { label: 'Cuentas', icon: 'wallet-outline' },
    { label: 'Reportes', icon: 'bar-chart-outline' },
    { label: 'Mas', icon: 'ellipsis-horizontal-outline' },
  ];

  selectedFilter: MovementFilter['id'] = 'all';
  currentStep: MovementStep = 'list';
  lastSavedKind: MovementKind = 'income';

  get visibleGroups(): MovementGroup[] {
    if (this.selectedFilter === 'all') {
      return this.movementGroups;
    }

    return this.movementGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.kind === this.selectedFilter),
      }))
      .filter((group) => group.items.length > 0);
  }

  get activeFormTitle(): string {
    const titles: Record<MovementKind, string> = {
      income: 'Nuevo ingreso',
      expense: 'Nuevo gasto',
      transfer: 'Nueva transferencia',
    };

    return titles[this.currentStep as MovementKind] ?? 'Nuevo movimiento';
  }

  get successSummary(): SuccessSummary {
    const summaries: Record<MovementKind, SuccessSummary> = {
      income: {
        title: 'Ingreso guardado',
        message: 'Tu ingreso se ha registrado correctamente.',
        accent: 'income',
        rows: ['Sueldo', '17 de mayo de 2026', 'Banco Pichincha'],
        amount: '+$800.00',
      },
      expense: {
        title: 'Gasto guardado',
        message: 'Tu gasto se ha registrado correctamente.',
        accent: 'expense',
        rows: ['Transporte', '17 de mayo de 2026', 'Efectivo'],
        amount: '-$20.00',
      },
      transfer: {
        title: 'Transferencia guardada',
        message: 'Tu transferencia se ha realizado correctamente.',
        accent: 'transfer',
        rows: ['De: Banco Pichincha', 'A: Ahorros', '17 de mayo de 2026'],
        amount: '-$150.00',
      },
    };

    return summaries[this.lastSavedKind];
  }

  get formKind(): MovementKind {
    return this.currentStep as MovementKind;
  }

  setFilter(filter: MovementFilter['id']): void {
    this.selectedFilter = filter;
  }

  openSelector(): void {
    this.currentStep = 'selector';
    this.scrollToTop();
  }

  openForm(kind: MovementKind): void {
    this.currentStep = kind;
    this.scrollToTop();
  }

  showList(): void {
    this.currentStep = 'list';
    this.scrollToTop();
  }

  showSuccess(kind: MovementKind): void {
    this.lastSavedKind = kind;
    this.currentStep = 'success';
    this.scrollToTop();
  }

  private scrollToTop(): void {
    window.requestAnimationFrame(() => {
      const content = document.querySelector('ion-content') as { scrollToTop?: (duration?: number) => Promise<void> } | null;

      void content?.scrollToTop?.(0);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }
}

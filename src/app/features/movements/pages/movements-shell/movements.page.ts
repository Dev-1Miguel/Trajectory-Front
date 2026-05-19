import { Component, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-movements',
  templateUrl: './movements.page.html',
  styleUrls: ['./movements.page.scss'],
  standalone: false,
})
export class MovementsPage {
  private readonly toastController = inject(ToastController);
  private movementTipToast?: HTMLIonToastElement;

  async ionViewDidEnter(): Promise<void> {
    await this.presentMovementTip();
  }

  async ionViewDidLeave(): Promise<void> {
    await this.movementTipToast?.dismiss();
    this.movementTipToast = undefined;
  }

  private async presentMovementTip(): Promise<void> {
    if (this.movementTipToast) {
      return;
    }

    const toast = await this.toastController.create({
      header: 'Consejo',
      message: 'Manten tus movimientos actualizados para tener un mejor control de tus finanzas.',
      duration: 3000,
      position: 'top',
      cssClass: 'movement-tip-toast',
    });

    this.movementTipToast = toast;
    void toast.onDidDismiss().then(() => {
      if (this.movementTipToast === toast) {
        this.movementTipToast = undefined;
      }
    });

    await toast.present();
  }
}

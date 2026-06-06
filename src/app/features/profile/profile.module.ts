import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../../shared/shared.module';
import { PersonalInfoFormComponent } from './components/personal-info-form/personal-info-form.component';
import { ProfileAvatarComponent } from './components/profile-avatar/profile-avatar.component';
import { PersonalInfoPageComponent } from './pages/personal-info-page/personal-info-page.component';
import { SecurityPageComponent } from './pages/security-page/security-page.component';
import { ProfileRoutingModule } from './profile-routing.module';

@NgModule({
  declarations: [
    PersonalInfoFormComponent,
    PersonalInfoPageComponent,
    ProfileAvatarComponent,
    SecurityPageComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    SharedModule,
    ProfileRoutingModule,
  ],
})
export class ProfileModule {}

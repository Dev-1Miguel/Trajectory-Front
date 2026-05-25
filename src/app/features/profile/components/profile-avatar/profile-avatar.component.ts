import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-profile-avatar',
  templateUrl: './profile-avatar.component.html',
  styleUrls: ['./profile-avatar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAvatarComponent {
  @Input() fullName = '';
  @Input() avatarUrl?: string;

  @Output() changePhoto = new EventEmitter<void>();

  get initials(): string {
    const [firstName = '', lastName = ''] = this.fullName.trim().split(/\s+/);
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim();

    return initials.toUpperCase() || 'U';
  }
}

import { Component, HostListener } from "@angular/core";
import { Observable, of } from "rxjs";
import { switchMap } from "rxjs/operators";
import { UserService } from "../services/user.service";
import { AppService } from "../services/app.service";
import { MensagensService } from "../services/mensagens.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent {
  currentUser$ = this.userService.currentUser$;
  isDropdownOpen = false;
  isMobileMenuOpen = false;

  /** Quantidade de mensagens não lidas. Atualizado em tempo real quando o usuário está logado. */
  unreadCount$: Observable<number> = this.currentUser$.pipe(
    switchMap((user) =>
      user?.uid ? this.mensagensService.getUnreadCount(user.uid) : of(0)
    )
  );

  constructor(
    private userService: UserService,
    private appService: AppService,
    private mensagensService: MensagensService,
    public router: Router
  ) {}

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  @HostListener("document:click")
  onDocumentClick(): void {
    if (this.isDropdownOpen) this.closeDropdown();
    if (this.isMobileMenuOpen) this.closeMobileMenu();
  }

  logout(): void {
    this.closeDropdown();
    this.closeMobileMenu();
    this.appService.logout();
  }

  navTo(path: string): void {
    this.closeDropdown();
    this.closeMobileMenu();
    this.router.navigate([path]);
  }
}

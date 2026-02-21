import { Component, HostListener } from "@angular/core";
import { UserService } from "../services/user.service";
import { AppService } from "../services/app.service";
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

  constructor(
    private userService: UserService,
    private appService: AppService,
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
    this.closeMobileMenu();
    this.router.navigate([path]);
  }
}

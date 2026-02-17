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

  @HostListener("document:click")
  onDocumentClick(): void {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    }
  }

  logout(): void {
    this.closeDropdown();
    this.appService.logout();
  }
}

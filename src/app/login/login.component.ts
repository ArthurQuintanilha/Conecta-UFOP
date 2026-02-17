import {
  Component,
  OnInit,
  OnDestroy,
  Renderer2,
  HostBinding,
} from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { AppService } from "../services/app.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit, OnDestroy {
  @HostBinding("class") class = "login-box";
  loginForm: UntypedFormGroup;
  isAuthLoading = false;

  constructor(
    private renderer: Renderer2,
    private toastr: ToastrService,
    private appService: AppService,
  ) {
    this.loginForm = new UntypedFormGroup({
      email: new UntypedFormControl(null, Validators.required),
      password: new UntypedFormControl(null, Validators.required),
    });
  }

  ngOnInit(): void {
    this.renderer.addClass(document.querySelector("app-root"), "login-page");
  }

  async loginByAuth(): Promise<void> {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      this.isAuthLoading = true;
      try {
        await this.appService.loginByAuth(this.loginForm.value);
      } finally {
        this.isAuthLoading = false;
      }
    } else {
      this.toastr.error(
        "Os campos de e-mail e senha são obrigatórios.",
        "Dados incompletos",
      );
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.querySelector("app-root"), "login-page");
  }
}

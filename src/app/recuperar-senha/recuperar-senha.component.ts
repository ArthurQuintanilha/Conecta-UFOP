import { Component } from "@angular/core";
import { UntypedFormGroup, UntypedFormControl, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-recuperar-senha",
  templateUrl: "./recuperar-senha.component.html",
  styleUrls: ["./recuperar-senha.component.scss"],
})
export class RecuperarSenhaComponent {
  form: UntypedFormGroup;
  isLoading = false;

  constructor(
    private afAuth: AngularFireAuth,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.form = new UntypedFormGroup({
      email: new UntypedFormControl("", [
        Validators.required,
        Validators.email,
      ]),
    });
  }

  async enviarEmail(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isLoading) return;

    const email = this.form.get("email")?.value?.trim();
    if (!email) {
      this.toastr.warning("Digite um e-mail válido.", "E-mail obrigatório");
      return;
    }

    this.isLoading = true;
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      this.toastr.success(
        "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a pasta de spam.",
        "E-mail enviado"
      );
      this.router.navigate(["/login"]);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message =
        code === "auth/invalid-email"
          ? "O e-mail informado não é válido."
          : code === "auth/user-not-found"
          ? "Não há conta cadastrada com este e-mail."
          : code === "auth/too-many-requests"
          ? "Muitas tentativas. Tente novamente mais tarde."
          : "Não foi possível enviar o e-mail. Tente novamente.";
      this.toastr.error(message, "Erro ao recuperar senha");
    } finally {
      this.isLoading = false;
    }
  }
}

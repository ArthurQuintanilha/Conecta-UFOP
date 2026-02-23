import { Component } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { Router } from "@angular/router";
import { ApiService } from "../services/api.service";
import { AppService } from "../services/app.service";
import { ToastrService } from "ngx-toastr";
import type {
  CreateUserRequest,
  CreateUserResponse,
  UploadProfileRequest,
  UploadProfileResponse,
} from "../models/api.models";

function senhaForteValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string;
  if (!v || v.length === 0) return null;
  const errors: ValidationErrors = {};
  if (!/[A-Z]/.test(v)) errors["senhaMaiuscula"] = true;
  if (!/[0-9]/.test(v)) errors["senhaNumero"] = true;
  if (!/[^A-Za-z0-9]/.test(v)) errors["senhaEspecial"] = true;
  if (v.length < 8) errors["senhaMinLength"] = true;
  return Object.keys(errors).length ? errors : null;
}

function parseDdMmYyyy(value: string): { day: number; month: number; year: number } | null {
  const v = (value ?? "").toString().trim().replace(/\D/g, "");
  if (v.length !== 8) return null;
  const day = parseInt(v.slice(0, 2), 10);
  const month = parseInt(v.slice(2, 4), 10);
  const year = parseInt(v.slice(4, 8), 10);
  if (month < 1 || month > 12) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
    return null;
  return { day, month, year };
}

function dtAniversarioValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value as string)?.trim() ?? "";
  if (!v) return null;
  return parseDdMmYyyy(v) ? null : { dtAniversario: true };
}

@Component({
  selector: "app-cadastro",
  templateUrl: "./cadastro.component.html",
  styleUrls: ["./cadastro.component.scss"],
})
export class CadastroComponent {
  readonly cursosOcupacao: readonly string[] = [
    "Engenharia de Computação",
    "Engenharia de Produção",
    "Engenharia Elétrica",
    "Sistemas de Informação",
  ];
  readonly generos: readonly { value: string; label: string }[] = [
    { value: "Masculino", label: "Masculino" },
    { value: "Feminino", label: "Feminino" },
    { value: "Outro", label: "Outro" },
  ];
  step = 1;
  formStep1: FormGroup;
  formStep2: FormGroup;
  submittingStep1 = false;
  submittingStep2 = false;
  selectedPhotoFile: File | null = null;
  photoPreviewUrl: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private appService: AppService,
    private router: Router,
    private toastr: ToastrService,
  ) {
    this.formStep1 = this.fb.group({
      nome: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      curso_ocupacao: ["", Validators.required],
      genero: ["", Validators.required],
      dtAniversario: ["", [Validators.required, dtAniversarioValidator]],
      senha: ["", [Validators.required, senhaForteValidator]],
    });
    this.formStep2 = this.fb.group({
      descricao: ["", Validators.required],
    });
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  getErrorMessage(form: FormGroup, path: string): string {
    const c = form.get(path);
    if (!c?.invalid || !c?.touched) return "";
    const e = c.errors;
    if (e?.["required"]) return "Campo obrigatório.";
    if (e?.["email"]) return "E-mail inválido.";
    if (e?.["senhaMaiuscula"]) return "Pelo menos 1 letra maiúscula.";
    if (e?.["senhaNumero"]) return "Pelo menos um número.";
    if (e?.["senhaEspecial"]) return "Pelo menos um caractere especial.";
    if (e?.["senhaMinLength"]) return "Pelo menos 8 caracteres.";
    if (e?.["dtAniversario"]) return "Data inválida.";
    return "Valor inválido.";
  }

  prevStep(): void {
    this.step = 1;
  }

  async onSubmitStep1(): Promise<void> {
    this.formStep1.markAllAsTouched();
    if (this.formStep1.invalid || this.submittingStep1) return;
    this.submittingStep1 = true;
    try {
      const v = this.formStep1.value;
      let dtAniversario = "";
      const parsed = parseDdMmYyyy((v.dtAniversario ?? "").toString());
      if (parsed) {
        dtAniversario = new Date(parsed.year, parsed.month - 1, parsed.day).toISOString();
      }
      const body: CreateUserRequest = {
        nome: v.nome.trim(),
        email: v.email.trim(),
        senha: v.senha,
        curso_ocupacao: v.curso_ocupacao.trim(),
        dtAniversario,
        genero: v.genero?.trim() || undefined,
      };
      await this.api.post<CreateUserResponse>("/users", body);
      const loggedIn = await this.appService.loginByAuthForCadastro({
        email: v.email.trim(),
        password: v.senha,
      });
      if (loggedIn) {
        this.step = 2;
        this.toastr.success("Cadastro realizado. Complete seu perfil.");
      }
    } catch (err: any) {
      const msg =
        err?.error?.message ||
        "Não foi possível criar a conta. Tente novamente.";
      this.toastr.error(msg, "Erro no cadastro");
    } finally {
      this.submittingStep1 = false;
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    this.selectedPhotoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearPhoto(): void {
    this.selectedPhotoFile = null;
    this.photoPreviewUrl = null;
  }

  async onSubmitStep2(): Promise<void> {
    this.formStep2.markAllAsTouched();
    if (this.formStep2.invalid || this.submittingStep2) return;
    this.submittingStep2 = true;
    try {
      const descricao = this.formStep2.get("descricao")?.value?.trim() ?? "";
      let fotoBase64 = "";
      if (this.selectedPhotoFile) {
        fotoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Falha ao ler a imagem"));
          reader.readAsDataURL(this.selectedPhotoFile!);
        });
      }
      const body: UploadProfileRequest = {
        fotoBase64,
        descricao,
      };
      await this.api.post<UploadProfileResponse>("/users/perfil", body);
      this.toastr.success("Perfil atualizado com sucesso.");
      await this.router.navigate(["/caronas"]);
    } catch (err: any) {
      const msg =
        err?.error?.message ||
        "Não foi possível atualizar o perfil. Tente novamente.";
      this.toastr.error(msg, "Erro");
    } finally {
      this.submittingStep2 = false;
    }
  }
}

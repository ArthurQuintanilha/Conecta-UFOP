import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { UserService } from "../services/user.service";
import { ApiService } from "../services/api.service";
import { UsuariosService } from "../services/usuarios.service";
import { ToastrService } from "ngx-toastr";
import { Subscription, firstValueFrom } from "rxjs";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import type { UploadProfileRequest, UploadProfileResponse } from "../models/api.models";

/** Converte string dd/mm/yyyy em { day, month, year } ou null. */
function parseDdMmYyyy(
  value: string
): { day: number; month: number; year: number } | null {
  const v = (value ?? "").toString().trim().replace(/\D/g, "");
  if (v.length !== 8) return null;
  const day = parseInt(v.slice(0, 2), 10);
  const month = parseInt(v.slice(2, 4), 10);
  const year = parseInt(v.slice(4, 8), 10);
  if (month < 1 || month > 12) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return { day, month, year };
}

/** Converte data (ISO string, Firestore Timestamp com _seconds/.toDate(), ou Date) para dd/mm/yyyy. */
function dateToDdMmYyyy(
  val:
    | string
    | { _seconds?: number; _nanoseconds?: number; toDate?: () => Date }
    | Date
    | null
    | undefined
): string {
  if (val == null) return "";
  let d: Date;
  if (typeof val === "string") {
    d = new Date(val);
  } else if (typeof val === "object" && typeof (val as { toDate?: () => Date }).toDate === "function") {
    d = (val as { toDate: () => Date }).toDate();
  } else if (typeof val === "object" && "_seconds" in val && typeof (val as { _seconds?: number })._seconds === "number") {
    const t = val as { _seconds: number; _nanoseconds?: number };
    d = new Date(t._seconds * 1000 + (t._nanoseconds ?? 0) / 1e6);
  } else if (val instanceof Date) {
    d = val;
  } else {
    return "";
  }
  if (isNaN(d.getTime())) return "";
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

@Component({
  selector: "app-perfil",
  templateUrl: "./perfil.component.html",
  styleUrls: ["./perfil.component.scss"],
})
export class PerfilComponent implements OnInit, OnDestroy {
  constructor(
    private userService: UserService,
    private api: ApiService,
    private usuariosService: UsuariosService,
    private toastr: ToastrService,
    private afAuth: AngularFireAuth
  ) {}
  @ViewChild("fileInput") fileInput!: ElementRef;

  private subscription?: Subscription;

  readonly cursosOcupacao: readonly string[] = [
    "Engenharia de Computação",
    "Engenharia de Produção",
    "Engenharia Elétrica",
    "Sistemas de Informação",
  ];

  user = {
    nome: "",
    email: "",
    genero: "male",
    descricao: "",
    fotoUrl: "assets/default-profile.png",
    curso_ocupacao: "",
    dtAniversario: "",
  };

  carregando = false;
  salvando = false;
  /** Arquivo selecionado para nova foto; ao salvar será enviado em POST /users/perfil. */
  novaFotoFile: File | null = null;

  ngOnInit(): void {
    this.atualizarUsuario();
    this.subscription = this.userService.currentUser$.subscribe(
      (loggedUser) => {
        if (loggedUser) this.applyUserToForm(loggedUser);
      }
    );
  }

  /** Preenche o formulário com dados do usuário (aceita snake_case e camelCase da API). */
  private applyUserToForm(u: {
    nome?: string | null;
    email?: string | null;
    genero?: string | null;
    descricao?: string | null;
    fotoUrl?: string | null;
    curso_ocupacao?: string | null;
    cursoOcupacao?: string | null;
    dtAniversario?: string | { _seconds?: number; _nanoseconds?: number } | null;
    dt_aniversario?: string | { _seconds?: number; _nanoseconds?: number } | null;
  }): void {
    console.log("[Perfil] Usuário recebido (objeto bruto):", u);
    const curso =
      (u as { curso_ocupacao?: string }).curso_ocupacao ??
      (u as { cursoOcupacao?: string }).cursoOcupacao ??
      "";
    const dtRaw =
      (u as { dtAniversario?: unknown }).dtAniversario ??
      (u as { dt_aniversario?: unknown }).dt_aniversario;
    this.user = {
      nome: u.nome ?? "",
      email: u.email ?? "",
      genero: u.genero ?? "male",
      descricao: u.descricao ?? "",
      fotoUrl: u.fotoUrl ?? "assets/default-profile.png",
      curso_ocupacao: curso,
      dtAniversario: dateToDdMmYyyy(
        dtRaw as string | { _seconds?: number; _nanoseconds?: number } | null | undefined
      ),
    };
  }

  private async atualizarUsuario(): Promise<void> {
    this.carregando = true;
    try {
      const uid =
        this.userService.getCurrentUser()?.uid ??
        (await firstValueFrom(this.afAuth.authState))?.uid ??
        null;
      if (!uid) {
        this.carregando = false;
        return;
      }
      const userDoc = await this.usuariosService.getUsuarioDoc(uid);
      this.carregando = false;
      if (userDoc) {
        const userData = { uid, ...userDoc };
        this.userService.setCurrentUser(userData as import("../models/api.models").AuthenticatedUserResponse & { uid: string });
        this.applyUserToForm(userData as Parameters<PerfilComponent["applyUserToForm"]>[0]);
      }
    } catch {
      this.carregando = false;
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async alterarUser(): Promise<void> {
    const nome = this.user.nome?.trim() ?? "";
    if (!nome) {
      this.toastr.warning("Preencha o nome.", "Campos obrigatórios");
      return;
    }

    const dtStr = this.user.dtAniversario?.trim() ?? "";
    if (!dtStr) {
      this.toastr.warning("Preencha a data de nascimento.", "Campos obrigatórios");
      return;
    }
    const parsed = parseDdMmYyyy(dtStr);
    if (!parsed) {
      this.toastr.warning(
        "Data de nascimento inválida. Use dd/mm/aaaa.",
        "Validação"
      );
      return;
    }

    const dtAniversarioIso = new Date(
      parsed.year,
      parsed.month - 1,
      parsed.day
    ).toISOString();

    const descricao = this.user.descricao?.trim() ?? "";
    const curso_ocupacao = this.user.curso_ocupacao?.trim() ?? "";

    this.salvando = true;
    try {
      await this.userService.updateUser({
        nome,
        curso_ocupacao,
        dtAniversario: dtAniversarioIso,
        descricao,
      });
      this.toastr.success("Dados atualizados com sucesso.");

      if (this.novaFotoFile) {
        const fotoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Falha ao ler a imagem"));
          reader.readAsDataURL(this.novaFotoFile!);
        });
        const body: UploadProfileRequest = {
          fotoBase64,
          descricao,
        };
        const res = await this.api.post<UploadProfileResponse>(
          "/users/perfil",
          body
        );
        if (res?.fotoUrl) {
          this.user.fotoUrl = res.fotoUrl;
          const me = await this.userService.getMe();
          if (me) this.userService.setCurrentUser(me);
        }
        this.toastr.success("Foto e perfil atualizados.");
        this.novaFotoFile = null;
      } else {
        const me = await this.userService.getMe();
        if (me) this.userService.setCurrentUser(me);
      }
    } catch (err: unknown) {
      const msg =
        (err as { error?: { message?: string } })?.error?.message ??
        "Não foi possível atualizar. Tente novamente.";
      this.toastr.error(msg, "Erro");
    } finally {
      this.salvando = false;
    }
  }

  acionarInputArquivo(): void {
    this.fileInput.nativeElement.click();
  }

  aoMudarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (arquivo) {
      this.novaFotoFile = arquivo;
      const reader = new FileReader();
      reader.onload = () => {
        this.user.fotoUrl = reader.result as string;
      };
      reader.readAsDataURL(arquivo);
    }
  }

  voltar(): void {
    window.history.back();
  }
}

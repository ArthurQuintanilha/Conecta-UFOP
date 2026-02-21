import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { map, Observable } from "rxjs";
import { take } from "rxjs/operators";
import { UserService } from "./user.service";

@Injectable({
  providedIn: "root",
})
export class AppService {
  constructor(
    private router: Router,
    private toastr: ToastrService,
    public afAuth: AngularFireAuth,
    private userService: UserService,
  ) {}

  restoreSession(): void {
    this.afAuth.authState.pipe(take(1)).subscribe(async (firebaseUser) => {
      if (!firebaseUser || this.userService.getCurrentUser()) return;
      const me = await this.userService.getMe();
      if (me) {
        this.userService.setCurrentUser({ uid: firebaseUser.uid, ...me });
      }
    });
  }

  private getLoginErrorMessage(error: any): { title: string; message: string } {
    const code = error?.code || "";
    const defaults = {
      title: "Falha no login",
      message: "Não foi possível entrar. Tente novamente.",
    };
    const messages: Record<string, { title: string; message: string }> = {
      "auth/invalid-login-credentials": {
        title: "E-mail ou senha incorretos",
        message: "Verifique o e-mail e a senha e tente novamente.",
      },
      "auth/invalid-email": {
        title: "E-mail inválido",
        message: "Informe um endereço de e-mail válido.",
      },
      "auth/user-not-found": {
        title: "Conta não encontrada",
        message: "Nenhuma conta está vinculada a este e-mail.",
      },
      "auth/wrong-password": {
        title: "Senha incorreta",
        message: "A senha digitada está errada. Tente novamente.",
      },
      "auth/too-many-requests": {
        title: "Muitas tentativas",
        message:
          "Acesso temporariamente bloqueado. Tente novamente mais tarde.",
      },
      "auth/network-request-failed": {
        title: "Sem conexão",
        message: "Verifique sua internet e tente novamente.",
      },
      "auth/user-disabled": {
        title: "Conta desativada",
        message: "Esta conta foi desativada. Entre em contato com o suporte.",
      },
      "auth/operation-not-allowed": {
        title: "Login não disponível",
        message: "O login por e-mail e senha não está habilitado neste app.",
      },
    };
    return (
      messages[code] ?? {
        ...defaults,
        message: error?.message || defaults.message,
      }
    );
  }

  async loginByAuth({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> {
    try {
      const credential = await this.afAuth.signInWithEmailAndPassword(
        email,
        password,
      );

      const uid = credential.user!.uid;
      const me = await this.userService.getMe();

      if (!me) {
        this.toastr.error(
          "Seu e-mail está autenticado, mas não há um perfil cadastrado no sistema. Entre em contato com o suporte.",
          "Usuário não encontrado",
        );
        await new Promise((r) => setTimeout(r, 1500));
        await this.logout();
        return;
      }

      const user = { uid, ...me };
      this.userService.setCurrentUser(user);

      this.toastr.success(
        `Olá, ${user.nome || "usuário"}! Redirecionando...`,
        "Login realizado com sucesso",
      );
      await this.router.navigate(["/caronas"]);
    } catch (error: any) {
      const { title, message } = this.getLoginErrorMessage(error);
      this.toastr.error(message, title);
      await new Promise((r) => setTimeout(r, 1500));
      await this.logout();
    }
  }

  /**
   * Login sem redirecionar, para uso após cadastro (POST /users).
   * Retorna true em sucesso; em erro exibe toast e retorna false.
   */
  async loginByAuthForCadastro({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<boolean> {
    try {
      const credential = await this.afAuth.signInWithEmailAndPassword(
        email,
        password,
      );
      const uid = credential.user!.uid;
      const me = await this.userService.getMe();
      if (!me) {
        this.toastr.error(
          "Seu e-mail está autenticado, mas não há um perfil cadastrado no sistema.",
          "Usuário não encontrado",
        );
        await this.logout();
        return false;
      }
      this.userService.setCurrentUser({ uid, ...me });
      return true;
    } catch (error: any) {
      const { title, message } = this.getLoginErrorMessage(error);
      this.toastr.error(message, title);
      await this.logout();
      return false;
    }
  }

  getProfile(): Observable<boolean> {
    return this.afAuth.authState.pipe(map((user) => !!user));
  }

  async logout(): Promise<void> {
    this.userService.clearCurrentUser();
    await this.afAuth.signOut();
    localStorage.clear();
    await this.router.navigate(["/login"]);
  }
}

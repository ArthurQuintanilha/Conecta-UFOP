import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { UserService } from "../services/user.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-perfil",
  templateUrl: "./perfil.component.html",
  styleUrls: ["./perfil.component.scss"],
})
export class PerfilComponent implements OnInit, OnDestroy {
  constructor(private userService: UserService) {}
  @ViewChild("fileInput") fileInput!: ElementRef;

  private subscription?: Subscription;

  user = {
    nome: "",
    email: "",
    genero: "male",
    descricao: "",
    fotoUrl: "assets/default-profile.png",
  };

  exibirAviso = false;
  mensagemAviso = "";

  ngOnInit(): void {
    this.subscription = this.userService.currentUser$.subscribe(
      (loggedUser) => {
        if (loggedUser) {
          console.log(loggedUser.fotoUrl);
          this.user = {
            nome: loggedUser.nome ?? "",
            email: loggedUser.email ?? "",
            genero: loggedUser.genero ?? "male",
            descricao: loggedUser.descricao ?? "",
            fotoUrl: loggedUser.fotoUrl ?? "assets/default-profile.png",
          };
        }
      },
    );
    console.log(this.user.fotoUrl);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  mostrarErro(mensagem: string) {
    this.mensagemAviso = mensagem;
    this.exibirAviso = true;
    setTimeout(() => {
      this.exibirAviso = false;
    }, 5000);
  }

  alterarUser() {
    if (!this.user.nome || !this.user.email) {
      this.mostrarErro("Preencha os campos obrigatórios (*).");
      return;
    }

    if (!this.user.email.includes("@aluno.ufop.edu.br")) {
      this.mostrarErro("Use um e-mail institucional da UFOP.");
      return;
    }

    console.log("Dados salvos:", this.user);
    this.mensagemAviso = "Perfil atualizado com sucesso! 🎉";
    this.exibirAviso = true;
    setTimeout(() => (this.exibirAviso = false), 3000);
  }

  acionarInputArquivo() {
    this.fileInput.nativeElement.click();
  }

  aoMudarFoto(event: any) {
    const arquivo = event.target.files[0];
    if (arquivo) {
      const reader = new FileReader();
      reader.onload = () => {
        this.user.fotoUrl = reader.result as string;
      };
      reader.readAsDataURL(arquivo);
    }
  }

  voltar() {
    window.history.back();
  }
}

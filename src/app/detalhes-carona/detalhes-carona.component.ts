import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import firebase from "firebase/compat/app";
import { Carona, EnderecoCaronaDoc } from "../../types/Caronas";
import { UsuariosService } from "../services/usuarios.service";

export interface UsuarioExibicao {
  id: string;
  nome: string;
  foto?: string;
  curso?: string;
  avaliacoes?: number;
}

@Component({
  selector: "app-detalhes-carona",
  templateUrl: "./detalhes-carona.component.html",
  styleUrls: ["./detalhes-carona.component.scss"],
})
export class DetalhesCaronaComponent implements OnInit {
  caronaId = "";
  loading = true;
  notFound = false;
  carona: Carona | null = null;
  motorista: UsuarioExibicao | null = null;
  passageiros: UsuarioExibicao[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore,
    private usuariosService: UsuariosService,
  ) {}

  ngOnInit(): void {
    this.caronaId = this.route.snapshot.params["id"] || "";
    if (!this.caronaId) {
      this.loading = false;
      this.notFound = true;
      return;
    }
    this.loadCarona();
  }

  private async loadCarona(): Promise<void> {
    try {
      const snap = await this.firestore
        .collection("caronas")
        .doc(this.caronaId)
        .ref.get();

      if (!snap.exists) {
        this.notFound = true;
        this.loading = false;
        return;
      }

      this.carona = snap.data() as Carona;

      if (this.carona.motoristaId) {
        try {
          const user = await this.usuariosService.getUser(this.carona.motoristaId);
          this.motorista = this.toUsuarioExibicao(this.carona.motoristaId, user);
        } catch {
          this.motorista = this.toUsuarioExibicao(this.carona.motoristaId, {});
        }
      }

      if (this.carona.passageiros?.length) {
        this.passageiros = await Promise.all(
          this.carona.passageiros.map(async (id) => {
            try {
              const user = await this.usuariosService.getUser(id);
              return this.toUsuarioExibicao(id, user);
            } catch {
              return this.toUsuarioExibicao(id, {});
            }
          }),
        );
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes da carona:", err);
      this.notFound = true;
    } finally {
      this.loading = false;
    }
  }

  private toUsuarioExibicao(
    id: string,
    data: Record<string, unknown> & { avaliacoes?: number },
  ): UsuarioExibicao {
    return {
      id,
      nome: (data?.["nome"] as string) ?? (data?.["displayName"] as string) ?? "Usuário",
      foto: (data?.["foto"] as string) ?? (data?.["photoURL"] as string) ?? undefined,
      curso: (data?.["curso"] as string) ?? (data?.["curso_ocupacao"] as string) ?? undefined,
      avaliacoes: data?.["avaliacoes"],
    };
  }

  formatarEndereco(end: EnderecoCaronaDoc | undefined): string {
    if (!end) return "—";
    const partes = [
      end.nome,
      end.rua && end.numero != null ? `${end.rua}, ${end.numero}` : end.rua,
      end.bairro,
      end.cidade && end.estado ? `${end.cidade} - ${end.estado}` : end.cidade || end.estado,
    ].filter(Boolean);
    return partes.length ? partes.join(", ") : "—";
  }

  formatarData(ts: firebase.firestore.Timestamp | null | undefined): string {
    if (!ts || !(ts instanceof firebase.firestore.Timestamp)) return "—";
    return ts.toDate().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  formatarDataCompleta(ts: firebase.firestore.Timestamp | null | undefined): string {
    if (!ts || !(ts instanceof firebase.firestore.Timestamp)) return "—";
    const d = ts.toDate();
    const data = d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const hora = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${data}, ${hora}`;
  }

  formatarHora(ts: firebase.firestore.Timestamp | null | undefined): string {
    if (!ts || !(ts instanceof firebase.firestore.Timestamp)) return "—";
    return ts.toDate().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatarValor(valor: number | undefined): string {
    if (valor == null) return "0,00";
    return (valor ?? 0).toFixed(2).replace(".", ",");
  }

  get statusLabel(): string {
    if (!this.carona) return "";
    return this.carona.status === "FINALIZADA" ? "FINALIZADA" : "ABERTA";
  }

  get statusBadgeClass(): string {
    if (!this.carona) return "";
    return this.carona.status === "FINALIZADA" ? "badge-finalizada" : "badge-aberta";
  }

  irParaChat(): void {
    this.router.navigate(["/chat"], { queryParams: { caronaId: this.caronaId } });
  }

  voltar(): void {
    this.router.navigate(["/caronas"]);
  }
}

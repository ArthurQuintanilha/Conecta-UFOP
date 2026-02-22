import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { CaronasService } from "../services/caronas.service";
import { MensagensService } from "../services/mensagens.service";
import { UserService } from "../services/user.service";
import { UsuariosService } from "../services/usuarios.service";
import type { GetCaronaByIdResponse } from "../models/api.models";

export interface UsuarioExibicao {
  id?: string;
  nome: string;
  foto?: string;
  curso?: string;
  avaliacoes?: number;
}

/** Solicitação de carona para exibição (com dados do usuário). */
export interface SolicitacaoExibicao extends UsuarioExibicao {
  id: string;
}

/** Objeto de endereço para formatação (API usa nomeLocal, componente usa nome) */
interface EnderecoParaFormatar {
  nome?: string;
  nomeLocal?: string;
  rua?: string;
  numero?: number;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

/** Timestamp no formato Firestore serializado (API) */
interface FirestoreTimestampLike {
  _seconds?: number;
  _nanoseconds?: number;
}

/** Carona para exibição (normalizada a partir da API) */
interface CaronaExibicao {
  motoristaId?: string;
  valor?: number;
  dtPartida?: Date | string | FirestoreTimestampLike;
  dtChegada?: Date | string | FirestoreTimestampLike | null;
  origem?: EnderecoCaronaDoc;
  destino?: EnderecoCaronaDoc;
  veiculo?: string;
  placa?: string;
  vagas?: number;
  status?: string;
  passageiros?: UsuarioExibicao[];
}

interface EnderecoCaronaDoc {
  nome?: string;
  rua?: string;
  numero?: number;
  bairro?: string;
  cidade?: string;
  estado?: string;
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
  carona: CaronaExibicao | null = null;
  motorista: UsuarioExibicao | null = null;
  passageiros: UsuarioExibicao[] = [];
  solicitandoReserva = false;
  solicitacaoEnviada = false;
  /** Solicitações da carona (apenas para motorista); carregadas do Firestore. */
  solicitacoes: SolicitacaoExibicao[] = [];
  /** userId em processamento (aceitar/recusar) para desabilitar botões. */
  solicitacaoProcessando: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private caronasService: CaronasService,
    private mensagensService: MensagensService,
    private userService: UserService,
    private usuariosService: UsuariosService,
    private toastr: ToastrService,
    private firestore: AngularFirestore,
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
      const res = await this.caronasService.getCaronaById(this.caronaId);
      console.log(res)
      const veiculoObj =
        res.veiculo && typeof res.veiculo === "object"
          ? (res.veiculo as { modelo?: string; placa?: string })
          : null;
      const veiculoStr = veiculoObj
        ? (veiculoObj.modelo ?? "") +
          (veiculoObj.placa ? ` - ${veiculoObj.placa}` : "")
        : ((res.veiculo as string) ?? "—");
      const placaStr = veiculoObj?.placa ?? "—";

      let motoristaId =
        res.motoristaId ??
        res.motorista?.id ??
        ((res as Record<string, unknown>)["motorista_id"] as
          | string
          | undefined);

      if (!motoristaId) {
        const caronaSnap = await this.firestore
          .collection("caronas")
          .doc(this.caronaId)
          .ref.get();
        const data = caronaSnap.data() as { motoristaId?: string } | undefined;
        motoristaId = data?.motoristaId;
      }

      this.carona = {
        motoristaId,
        valor: res.valor,
        dtPartida: res.dtPartida,
        dtChegada: res.dtChegada ?? null,
        origem: this.normalizarEndereco(res.origem),
        destino: this.normalizarEndereco(
          res.destino as EnderecoParaFormatar | undefined,
        ),
        veiculo: veiculoStr,
        placa: placaStr,
        vagas: res.vagasDisponiveis ?? 0,
        status: "ABERTA",
        passageiros: [],
      };

      if (res.motorista) {
        this.motorista = {
          nome: res.motorista.nome ?? "Motorista",
          foto: res.motorista.fotoUrl ?? undefined,
          avaliacoes: res.motorista.notaMedia,
          curso: res.motorista.perfil,
        };
      }

      if (res.passageiros?.length) {
        this.passageiros = res.passageiros.map((p) => ({
          nome: p.nome ?? "Passageiro",
          foto: p.fotoUrl,
          curso: p.perfil,
        }));
      }
      if (this.carona) this.carona.passageiros = this.passageiros;

      if (this.isMotorista) {
        await this.loadSolicitacoes();
      } else {
        await this.checkUsuarioJaSolicitou();
      }

      await this.preloadImagens();
    } catch {
      this.notFound = true;
    } finally {
      this.loading = false;
    }
  }

  /** Coleta todas as URLs de foto (motorista, passageiros, solicitações) e aguarda carregarem ou timeout. */
  private async preloadImagens(): Promise<void> {
    const urls: string[] = [];
    if (this.motorista?.foto?.trim()) urls.push(this.motorista.foto.trim());
    this.passageiros.forEach((p) => {
      if (p.foto?.trim()) urls.push(p.foto.trim());
    });
    this.solicitacoes.forEach((s) => {
      if (s.foto?.trim()) urls.push(s.foto.trim());
    });
    if (urls.length === 0) return;
    const timeoutMs = 8000;
    await Promise.all(
      urls.map((url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          const done = () => resolve();
          img.onload = done;
          img.onerror = done;
          img.src = url;
          setTimeout(done, timeoutMs);
        })
      )
    );
  }

  /** True se o usuário logado é o motorista desta carona (compara por uid). */
  get isMotorista(): boolean {
    const user = this.userService.getCurrentUser();
    const uid = (user as { uid?: string })?.uid;
    return !!(uid && this.carona?.motoristaId && uid === this.carona.motoristaId);
  }

  /**
   * Para usuário que não é motorista: verifica se o uid está em solicitacoes ou recusados
   * no documento da carona e, se estiver, marca solicitacaoEnviada = true (exibe "Solicitado").
   */
  private async checkUsuarioJaSolicitou(): Promise<void> {
    if (!this.caronaId) return;
    const user = this.userService.getCurrentUser();
    const uid = (user as { uid?: string })?.uid;
    if (!uid) return;
    try {
      const doc = await this.firestore.collection("caronas").doc(this.caronaId).ref.get();
      const data = doc.data() as { solicitacoes?: string[]; recusados?: string[] } | undefined;
      const solicitacoes = data?.solicitacoes ?? [];
      const recusados = data?.recusados ?? [];
      if (solicitacoes.includes(uid) || recusados.includes(uid)) {
        this.solicitacaoEnviada = true;
      }
    } catch {
      // Ignora erro; solicitacaoEnviada permanece false
    }
  }

  /** Carrega lista de solicitações do Firestore e resolve dados dos usuários. */
  private async loadSolicitacoes(): Promise<void> {
    if (!this.caronaId) return;
    try {
      const doc = await this.firestore.collection("caronas").doc(this.caronaId).ref.get();
      const data = doc.data() as { solicitacoes?: string[] } | undefined;
      const ids = data?.solicitacoes ?? [];
      if (ids.length === 0) {
        this.solicitacoes = [];
        return;
      }
      const list: SolicitacaoExibicao[] = [];
      for (const id of ids) {
        try {
          const u = (await this.usuariosService.getUser(id)) as { nome?: string; fotoUrl?: string; curso_ocupacao?: string };
          list.push({
            id,
            nome: u.nome ?? "Usuário",
            foto: u.fotoUrl,
            curso: u.curso_ocupacao,
          });
        } catch {
          list.push({ id, nome: "Usuário" });
        }
      }
      this.solicitacoes = list;
    } catch {
      this.solicitacoes = [];
    }
  }

  /** Aceita a solicitação via API (endpoint cuida de remover de solicitações e adicionar aos passageiros). */
  async aceitarSolicitacao(userId: string): Promise<void> {
    if (!this.caronaId || this.solicitacaoProcessando) return;
    const solicitante = this.solicitacoes.find((s) => s.id === userId);
    this.solicitacaoProcessando = userId;
    try {
      await this.caronasService.responderSolicitacao(this.caronaId, userId, true);
      this.solicitacoes = this.solicitacoes.filter((s) => s.id !== userId);
      const novoPassageiro: UsuarioExibicao = solicitante
        ? { nome: solicitante.nome, foto: solicitante.foto, curso: solicitante.curso }
        : { nome: "Usuário" };
      this.passageiros = [...this.passageiros, novoPassageiro];
      if (this.carona) this.carona.passageiros = this.passageiros;
      this.toastr.success("Solicitação aceita. Passageiro confirmado na carona.");
      const detalhes = this.getDetalhesCaronaParaMensagem();
      this.mensagensService
        .enviarMensagemSistema(
          this.caronaId,
          userId,
          "Sua solicitação para esta carona foi aceita." + detalhes,
        )
        .catch(() => {});
    } catch (err: unknown) {
      const msg = (err as { error?: { message?: string } })?.error?.message ?? "Erro ao aceitar solicitação. Tente novamente.";
      this.toastr.error(msg);
    } finally {
      this.solicitacaoProcessando = null;
    }
  }

  /** Recusa a solicitação via API (endpoint remove das solicitações e adiciona aos recusados). */
  async recusarSolicitacao(userId: string): Promise<void> {
    if (!this.caronaId || this.solicitacaoProcessando) return;
    this.solicitacaoProcessando = userId;
    try {
      await this.caronasService.responderSolicitacao(this.caronaId, userId, false);
      this.solicitacoes = this.solicitacoes.filter((s) => s.id !== userId);
      this.toastr.info("Solicitação recusada.");
      const detalhes = this.getDetalhesCaronaParaMensagem();
      this.mensagensService
        .enviarMensagemSistema(
          this.caronaId,
          userId,
          "Sua solicitação para esta carona foi recusada." + detalhes,
        )
        .catch(() => {});
    } catch (err: unknown) {
      const msg = (err as { error?: { message?: string } })?.error?.message ?? "Erro ao recusar solicitação. Tente novamente.";
      this.toastr.error(msg);
    } finally {
      this.solicitacaoProcessando = null;
    }
  }

  private normalizarEndereco(
    e: EnderecoParaFormatar | undefined,
  ): EnderecoCaronaDoc | undefined {
    if (!e) return undefined;
    return {
      nome: e.nomeLocal ?? e.nome,
      rua: e.rua,
      numero: e.numero,
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.estado,
    };
  }

  formatarEndereco(end: EnderecoCaronaDoc | undefined): string {
    if (!end) return "—";
    const partes = [
      end.nome,
      end.rua && end.numero != null ? `${end.rua}, ${end.numero}` : end.rua,
      end.bairro,
      end.cidade && end.estado
        ? `${end.cidade} - ${end.estado}`
        : end.cidade || end.estado,
    ].filter(Boolean);
    return partes.length ? partes.join(", ") : "—";
  }

  /** Retorna texto com rota (origem → destino) e data da carona para incluir nas mensagens do SISTEMA (aceite/recusa). */
  private getDetalhesCaronaParaMensagem(): string {
    if (!this.carona) return "";
    const origem = this.formatarEndereco(this.carona.origem);
    const destino = this.formatarEndereco(this.carona.destino);
    const data = this.formatarDataCompleta(this.carona.dtPartida);
    return ` Rota: ${origem} → ${destino}. Data: ${data}.`;
  }

  private toDate(
    val: Date | string | FirestoreTimestampLike | undefined | null,
  ): Date | null {
    if (val == null) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    const asObj = val as FirestoreTimestampLike;
    if (typeof asObj._seconds === "number") {
      const ms = asObj._seconds * 1000 + (asObj._nanoseconds ?? 0) / 1e6;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? null : d;
  }

  formatarData(
    ts: Date | string | FirestoreTimestampLike | null | undefined,
  ): string {
    const d = this.toDate(ts);
    if (!d) return "—";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  formatarDataCompleta(
    ts: Date | string | FirestoreTimestampLike | null | undefined,
  ): string {
    const d = this.toDate(ts);
    if (!d) return "—";
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

  formatarHora(
    ts: Date | string | FirestoreTimestampLike | null | undefined,
  ): string {
    const d = this.toDate(ts);
    if (!d) return "—";
    return d.toLocaleTimeString("pt-BR", {
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
    return this.carona.status === "FINALIZADA"
      ? "badge-finalizada"
      : "badge-aberta";
  }

  /** Exibe o botão de chat apenas quando o usuário logado não é o motorista. Compara nome + foto + curso para evitar colisão de nomes iguais. */
  get showChatButton(): boolean {
    if (!this.carona || !this.motorista) return false;
    const user = this.userService.getCurrentUser();
    if (!user) return true;

    const nomeLogado = user.nome?.trim().toLowerCase();
    const nomeMotorista = this.motorista.nome?.trim().toLowerCase();
    if (!nomeLogado || !nomeMotorista || nomeLogado !== nomeMotorista) return true;

    const fotoLogado = (user.fotoUrl ?? "").trim();
    const fotoMotorista = (this.motorista.foto ?? "").trim();
    if (fotoLogado && fotoMotorista && fotoLogado !== fotoMotorista) return true;

    const cursoLogado = (user as { curso_ocupacao?: string }).curso_ocupacao?.trim().toLowerCase();
    const cursoMotorista = this.motorista.curso?.trim().toLowerCase();
    if (cursoLogado && cursoMotorista && cursoLogado !== cursoMotorista) return true;

    return false;
  }

  /** Exibe o card de solicitar reserva quando o usuário não é o motorista */
  get showSolicitarReservaCard(): boolean {
    return this.showChatButton;
  }

  async solicitarReserva(): Promise<void> {
    if (!this.caronaId || this.solicitandoReserva || this.solicitacaoEnviada)
      return;
    this.solicitandoReserva = true;
    try {
      const res = await this.caronasService.solicitarCarona(this.caronaId);
      this.toastr.success(res?.message ?? "Solicitação enviada com sucesso!");
      this.solicitacaoEnviada = true;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg =
        (err as { error?: { message?: string } })?.error?.message ??
        "Erro ao solicitar carona.";
      if (status === 400) this.toastr.error(msg);
      else if (status === 401)
        this.toastr.error(msg || "Faça login para solicitar.");
      else if (status === 404)
        this.toastr.error(msg || "Carona não encontrada.");
      else if (status === 409) {
        this.toastr.warning(
          msg || "Você já enviou uma solicitação para esta carona.",
        );
        this.solicitacaoEnviada = true;
      } else this.toastr.error(msg);
    } finally {
      this.solicitandoReserva = false;
    }
  }

  irParaChat(): void {
    const subtitle =
      this.carona?.origem && this.carona?.destino
        ? `${this.formatarEndereco(this.carona.origem)} → ${this.formatarEndereco(this.carona.destino)}`
        : undefined;
    this.router.navigate(["/chat"], {
      queryParams: {
        caronaId: this.caronaId,
        ...(this.carona?.motoristaId && {
          outroUsuarioId: this.carona.motoristaId,
        }),
        ...(this.motorista?.nome && {
          outroUsuarioNome: this.motorista.nome,
        }),
        ...(subtitle && { caronaSubtitle: subtitle }),
      },
    });
  }

  voltar(): void {
    this.router.navigate(["/caronas"]);
  }
}

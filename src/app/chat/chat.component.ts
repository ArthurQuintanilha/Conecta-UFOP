import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import {
  MensagensService,
  ConversaListItem,
  MensagemDoc,
} from "../services/mensagens.service";
import { UserService } from "../services/user.service";
import { CaronasService } from "../services/caronas.service";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import firebase from "firebase/compat/app";
import { Location } from "@angular/common";

export interface ChatMessageDisplay {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  /** Chave do dia (YYYY-MM-DD) para agrupar e mostrar divisor */
  dateKey: string;
  /** Rótulo do dia: "Hoje", "Ontem" ou data formatada */
  dateLabel: string;
  /** Se a mensagem foi vista pelo destinatário (apenas para mensagens enviadas) */
  visualizado: boolean;
}

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild("messagesContainer") messagesContainer!: ElementRef;

  searchTerm = "";
  newMessage = "";
  conversas: ConversaListItem[] = [];
  activeCaronaId: string | null = null;
  messages: ChatMessageDisplay[] = [];
  caronaFinalizada = false;
  loading = true;
  private shouldScroll = false;
  private mensagensSub: Subscription | null = null;
  private caronaStatusSub: Subscription | null = null;
  private currentUid: string | null = null;

  constructor(
    private mensagensService: MensagensService,
    private userService: UserService,
    private caronasService: CaronasService,
    private afAuth: AngularFireAuth,
    private route: ActivatedRoute,
    private location: Location,
    private firestore: AngularFirestore,
  ) {}

  get filteredConversas(): ConversaListItem[] {
    if (!this.searchTerm.trim()) return this.conversas;
    const term = this.searchTerm.toLowerCase();
    return this.conversas.filter(
      (c) =>
        (c.outroUsuarioNome?.toLowerCase().includes(term) ?? false) ||
        c.ultimaMensagem.toLowerCase().includes(term),
    );
  }

  get activeConversa(): ConversaListItem | null {
    if (!this.activeCaronaId) return null;
    return (
      this.conversas.find((c) => c.caronaId === this.activeCaronaId) ?? null
    );
  }

  get activeContactName(): string {
    return this.activeConversa?.outroUsuarioNome ?? "Conversa";
  }

  get activeContactSubtitle(): string {
    return this.activeConversa?.caronaSubtitle ?? "";
  }

  get activeContactAvatar(): string {
    const name = this.activeConversa?.outroUsuarioNome;
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  /** URL da foto do contato ativo (outro usuário da conversa). Null se não tiver foto. */
  get activeContactPhotoUrl(): string | null {
    const url = this.activeConversa?.outroUsuarioAvatar;
    return url && url.trim() ? url.trim() : null;
  }

  ngOnInit(): void {
    this.loadConversas();
  }

  ngOnDestroy(): void {
    this.mensagensSub?.unsubscribe();
    this.caronaStatusSub?.unsubscribe();
    console.log("[Chat] Componente destruído, subscriptions encerradas.");
  }

  private async loadConversas(): Promise<void> {
    this.loading = true;
    const user = this.userService.getCurrentUser();
    const uid = user?.uid ?? (await this.afAuth.currentUser)?.uid ?? null;
    this.currentUid = uid;
    if (!uid) {
      this.loading = false;
      this.conversas = [];
      return;
    }
    try {
      this.conversas = await this.mensagensService.getConversas(uid);
      const q = this.route.snapshot.queryParams;
      const caronaIdFromUrl = (q["caronaId"] as string)?.trim();
      const outroUsuarioIdFromUrl = (q["outroUsuarioId"] as string)?.trim();
      const outroUsuarioNomeFromUrl = (q["outroUsuarioNome"] as string)?.trim();
      const caronaSubtitleFromUrl = (q["caronaSubtitle"] as string)?.trim();

      if (caronaIdFromUrl) {
        const existing = this.conversas.find(
          (c) => c.caronaId === caronaIdFromUrl,
        );
        if (existing) {
          this.selectConversa(existing);
        } else if (
          outroUsuarioIdFromUrl &&
          outroUsuarioNomeFromUrl &&
          outroUsuarioIdFromUrl !== uid
        ) {
          const synthetic: ConversaListItem = {
            caronaId: caronaIdFromUrl,
            outroUsuarioId: outroUsuarioIdFromUrl,
            outroUsuarioNome: outroUsuarioNomeFromUrl,
            ultimaMensagem: "",
            criadoEm: new Date(),
            caronaSubtitle: caronaSubtitleFromUrl || undefined,
          };
          this.conversas = [synthetic, ...this.conversas];
          this.selectConversa(synthetic);
        } else {
          await this.selectOrCreateConversaByCaronaId(caronaIdFromUrl, uid);
        }
      } else if (this.conversas.length > 0 && !this.activeCaronaId) {
        this.selectConversa(this.conversas[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
      this.conversas = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Quando não há mensagens na carona ainda: busca dados da carona, cria item de conversa
   * com o motorista como "outro" e seleciona para permitir enviar a primeira mensagem.
   */
  private async selectOrCreateConversaByCaronaId(
    caronaId: string,
    uid: string,
  ): Promise<void> {
    try {
      const carona = await this.caronasService.getCaronaById(caronaId);
      let motoristaId = carona.motoristaId ?? carona.motorista?.id;
      if (!motoristaId) {
        const caronaSnap = await this.firestore
          .collection("caronas")
          .doc(caronaId)
          .ref.get();
        const data = caronaSnap.data() as { motoristaId?: string } | undefined;
        motoristaId = data?.motoristaId;
      }
      if (!motoristaId || motoristaId === uid) return;
      const origem =
        carona.origem &&
        typeof carona.origem === "object" &&
        "nomeLocal" in carona.origem
          ? String(carona.origem["nomeLocal"] ?? "Origem")
          : "Origem";
      const destino =
        carona.destino &&
        typeof carona.destino === "object" &&
        "nomeLocal" in carona.destino
          ? String(carona.destino["nomeLocal"] ?? "Destino")
          : "Destino";
      const caronaSubtitle = `${origem} → ${destino}`;
      const synthetic: ConversaListItem = {
        caronaId,
        outroUsuarioId: motoristaId,
        outroUsuarioNome: carona.motorista?.nome ?? "Motorista",
        ultimaMensagem: "",
        criadoEm: new Date(),
        caronaSubtitle,
      };
      this.conversas = [synthetic, ...this.conversas];
      this.selectConversa(synthetic);
    } catch {
      // Carona não encontrada ou erro de API: não adiciona conversa inicial
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  selectConversa(conversa: ConversaListItem): void {
    this.mensagensSub?.unsubscribe();
    this.mensagensSub = null;
    this.caronaStatusSub?.unsubscribe();
    this.caronaStatusSub = null;
    this.activeCaronaId = conversa.caronaId;
    this.caronaStatusSub = this.mensagensService
      .watchCaronaStatus(conversa.caronaId)
      .subscribe((finalizada) => {
        this.caronaFinalizada = finalizada;
      });
    if (!this.currentUid) return;
    console.log("[Chat] Marcando mensagens como vistas:", { caronaId: conversa.caronaId, destinatarioId: this.currentUid });
    this.mensagensService
      .marcarMensagensComoVistas(conversa.caronaId, this.currentUid)
      .then(() => console.log("[Chat] Mensagens marcadas como vistas com sucesso."))
      .catch((err) => console.error("[Chat] Erro ao marcar mensagens como vistas:", err));
    this.mensagensSub = this.mensagensService
      .getMensagensPorCarona(conversa.caronaId, this.currentUid)
      .subscribe((docs) => {
        const fromServer = docs.map((d) => this.toDisplayMessage(d));
        this.messages = this.mergeReplacingPending(fromServer);
        // Scroll até o fim ao abrir a conversa (após a view atualizar)
        setTimeout(() => this.scrollToBottom(), 0);
      });
  }

  /** Lista do servidor substitui a atual; evita duplicata removendo pendentes ao aplicar. */
  private mergeReplacingPending(fromServer: ChatMessageDisplay[]): ChatMessageDisplay[] {
    return fromServer;
  }

  private toDisplayMessage(
    d: MensagemDoc & { id?: string },
  ): ChatMessageDisplay {
    const date = this.timestampToDate(d.criadoEm);
    const time = this.formatCriadoEm(d.criadoEm);
    return {
      id: d.id ?? "",
      text: d.mensagem,
      sent: d.remetenteId === this.currentUid,
      time,
      dateKey: this.toDateKey(date),
      dateLabel: this.getDateLabel(date),
      visualizado: d.visualizado === true,
    };
  }

  private timestampToDate(
    v: firebase.firestore.Timestamp | firebase.firestore.FieldValue | undefined,
  ): Date {
    if (!v || !(v instanceof firebase.firestore.Timestamp)) return new Date();
    return v.toDate();
  }

  private formatCriadoEm(
    v: firebase.firestore.Timestamp | firebase.firestore.FieldValue | undefined,
  ): string {
    const d = this.timestampToDate(v);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /** Retorna "Hoje", "Ontem" ou data formatada (ex.: "20 de fev. de 2025"). */
  getDateLabel(d: Date): string {
    const today = new Date();
    const key = this.toDateKey(d);
    const todayKey = this.toDateKey(today);
    if (key === todayKey) return "Hoje";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (key === this.toDateKey(yesterday)) return "Ontem";
    return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /** True se deve exibir o divisor de dia antes desta mensagem (primeira do dia). */
  shouldShowDateDivider(index: number, msg: ChatMessageDisplay): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    return prev != null && prev.dateKey !== msg.dateKey;
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    if (
      !text ||
      !this.activeCaronaId ||
      !this.activeConversa ||
      this.caronaFinalizada
    )
      return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const optimistic: ChatMessageDisplay = {
      id: "pending-" + Date.now(),
      text,
      sent: true,
      time: timeStr,
      dateKey: this.toDateKey(now),
      dateLabel: this.getDateLabel(now),
      visualizado: false,
    };
    this.messages = [...this.messages, optimistic];
    this.newMessage = "";
    this.shouldScroll = true;

    this.mensagensService
      .enviarMensagem(
        this.activeCaronaId,
        this.activeConversa.outroUsuarioId,
        text,
      )
      .catch((err) => console.error("Erro ao enviar mensagem:", err));
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const el = this.messagesContainer?.nativeElement;
          if (el) el.scrollTop = el.scrollHeight;
        } catch {}
      });
    });
  }

  isLastMessageSent(conversa: ConversaListItem): boolean {
    return conversa.lastMessageSentByMe === true;
  }

  conversaAvatar(conversa: ConversaListItem): string {
    const name = conversa.outroUsuarioNome ?? "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  conversaTime(conversa: ConversaListItem): string {
    const d = conversa.criadoEm;
    if (!d) return "";
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  trackByCaronaId(_index: number, conversa: ConversaListItem): string {
    return conversa.caronaId;
  }

  trackByMessageId(_index: number, msg: ChatMessageDisplay): string {
    return msg.id;
  }

  voltar(): void {
    this.location.back();
  }
}

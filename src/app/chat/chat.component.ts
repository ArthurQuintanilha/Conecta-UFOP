import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { Subscription } from "rxjs";
import { MensagensService, ConversaListItem, MensagemDoc } from "../services/mensagens.service";
import { UserService } from "../services/user.service";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import firebase from "firebase/compat/app";
import { Location } from "@angular/common";

export interface ChatMessageDisplay {
  id: string;
  text: string;
  sent: boolean;
  time: string;
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
    private afAuth: AngularFireAuth,
    private location: Location
  ) {}

  get filteredConversas(): ConversaListItem[] {
    if (!this.searchTerm.trim()) return this.conversas;
    const term = this.searchTerm.toLowerCase();
    return this.conversas.filter(
      (c) =>
        (c.outroUsuarioNome?.toLowerCase().includes(term) ?? false) ||
        c.ultimaMensagem.toLowerCase().includes(term)
    );
  }

  get activeConversa(): ConversaListItem | null {
    if (!this.activeCaronaId) return null;
    return this.conversas.find((c) => c.caronaId === this.activeCaronaId) ?? null;
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

  ngOnInit(): void {
    this.loadConversas();
  }

  ngOnDestroy(): void {
    this.mensagensSub?.unsubscribe();
    this.caronaStatusSub?.unsubscribe();
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
      if (this.conversas.length > 0 && !this.activeCaronaId)
        this.selectConversa(this.conversas[0]);
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
      this.conversas = [];
    } finally {
      this.loading = false;
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
    this.mensagensSub = this.mensagensService
      .getMensagensPorCarona(conversa.caronaId)
      .subscribe((docs) => {
        this.messages = docs.map((d) => this.toDisplayMessage(d));
        this.shouldScroll = true;
      });
  }

  private toDisplayMessage(d: MensagemDoc & { id?: string }): ChatMessageDisplay {
    const time = this.formatCriadoEm(d.criadoEm);
    return {
      id: d.id ?? "",
      text: d.mensagem,
      sent: d.remetenteId === this.currentUid,
      time,
    };
  }

  private formatCriadoEm(
    v: firebase.firestore.Timestamp | firebase.firestore.FieldValue | undefined
  ): string {
    if (!v || !(v instanceof firebase.firestore.Timestamp)) return "";
    return v.toDate().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    if (!text || !this.activeCaronaId || !this.activeConversa || this.caronaFinalizada) return;

    this.mensagensService
      .enviarMensagem(
        this.activeCaronaId,
        this.activeConversa.outroUsuarioId,
        text
      )
      .then(() => {
        this.newMessage = "";
        this.shouldScroll = true;
      })
      .catch((err) => console.error("Erro ao enviar mensagem:", err));
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
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
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

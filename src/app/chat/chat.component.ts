import {
  Component,
  OnInit,
  AfterViewChecked,
  ViewChild,
  ElementRef,
} from '@angular/core';

export interface ChatMessage {
  id: number;
  text: string;
  sent: boolean; // true = enviada pelo usuário, false = recebida
  time: string;
  read?: boolean;
}

export interface Contact {
  id: number;
  name: string;
  subtitle: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unread: number;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  searchTerm = '';
  newMessage = '';
  activeContactId = 1;
  private shouldScroll = false;

  contacts: Contact[] = [
    {
      id: 1,
      name: 'John Doe',
      subtitle: 'ICEA/UFOP — Hiper hoje às 22:25',
      lastMessage: 'Oi! Tem vaga na carona amanhã?',
      time: '22:25',
      avatar: 'JD',
      unread: 3,
      messages: [
        { id: 1, text: 'Olá! Tem vaga na carona amanhã?', sent: false, time: '22:10' },
        { id: 2, text: 'Oi! Sim, tenho duas vagas disponíveis.', sent: true, time: '22:12', read: true },
        { id: 3, text: 'Que horas vai sair?', sent: false, time: '22:15' },
        { id: 4, text: 'Às 7h da manhã, saindo do ICEA.', sent: true, time: '22:18', read: true },
        { id: 5, text: 'Perfeito! Pode me incluir?', sent: false, time: '22:20' },
        { id: 6, text: 'Claro! Vou te adicionar na lista.', sent: true, time: '22:22', read: true },
        { id: 7, text: 'Oi! Tem vaga na carona amanhã?', sent: false, time: '22:25' },
      ],
    },
    {
      id: 2,
      name: 'Maria Silva',
      subtitle: 'DECEA/UFOP — Campus Morro do Cruzeiro',
      lastMessage: 'Obrigada pela carona!',
      time: '21:40',
      avatar: 'MS',
      unread: 0,
      messages: [
        { id: 1, text: 'Boa tarde! Você tem carona para o campus?', sent: false, time: '21:30' },
        { id: 2, text: 'Boa tarde! Sim, saio às 14h.', sent: true, time: '21:32', read: true },
        { id: 3, text: 'Posso ir junto?', sent: false, time: '21:35' },
        { id: 4, text: 'Pode sim! Te espero na entrada do DECEA.', sent: true, time: '21:37', read: true },
        { id: 5, text: 'Obrigada pela carona!', sent: false, time: '21:40' },
      ],
    },
    {
      id: 3,
      name: 'Carlos Mendes',
      subtitle: 'ICEB/UFOP — Ouro Preto',
      lastMessage: 'Até amanhã então!',
      time: '20:15',
      avatar: 'CM',
      unread: 1,
      messages: [
        { id: 1, text: 'E aí, vai ter carona sexta?', sent: false, time: '20:00' },
        { id: 2, text: 'Vou ter sim, saindo às 18h.', sent: true, time: '20:05', read: true },
        { id: 3, text: 'Show! Posso ir?', sent: false, time: '20:08' },
        { id: 4, text: 'Claro, tá na lista!', sent: true, time: '20:10', read: true },
        { id: 5, text: 'Até amanhã então!', sent: false, time: '20:15' },
      ],
    },
    {
      id: 4,
      name: 'Ana Beatriz',
      subtitle: 'ICSHU/UFOP — Mariana',
      lastMessage: 'Pode ser às 8h?',
      time: '19:50',
      avatar: 'AB',
      unread: 2,
      messages: [
        { id: 1, text: 'Oi! Você faz caronas para Mariana?', sent: false, time: '19:40' },
        { id: 2, text: 'Faço sim! Normalmente saio cedo.', sent: true, time: '19:43', read: true },
        { id: 3, text: 'Pode ser às 8h?', sent: false, time: '19:50' },
      ],
    },
    {
      id: 5,
      name: 'Pedro Oliveira',
      subtitle: 'EM/UFOP — Ouro Preto',
      lastMessage: 'Valeu pela info!',
      time: '18:30',
      avatar: 'PO',
      unread: 0,
      messages: [
        { id: 1, text: 'Olá! Quantas vagas tem na carona de hoje?', sent: false, time: '18:20' },
        { id: 2, text: 'Ainda tenho 1 vaga.', sent: true, time: '18:25', read: true },
        { id: 3, text: 'Valeu pela info!', sent: false, time: '18:30' },
      ],
    },
  ];

  get filteredContacts(): Contact[] {
    if (!this.searchTerm.trim()) return this.contacts;
    const term = this.searchTerm.toLowerCase();
    return this.contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.lastMessage.toLowerCase().includes(term)
    );
  }

  get activeContact(): Contact {
    return this.contacts.find((c) => c.id === this.activeContactId)!;
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  selectContact(contact: Contact): void {
    this.activeContactId = contact.id;
    contact.unread = 0;
    this.shouldScroll = true;
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const message: ChatMessage = {
      id: Date.now(),
      text,
      sent: true,
      time,
      read: false,
    };

    this.activeContact.messages.push(message);
    this.activeContact.lastMessage = text;
    this.activeContact.time = time;
    this.newMessage = '';
    this.shouldScroll = true;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  isLastMessageSent(contact: Contact): boolean {
    const msgs = contact.messages;
    return msgs.length > 0 && msgs[msgs.length - 1].sent;
  }

  trackByContact(index: number, contact: Contact): number {
    return contact.id;
  }

  trackByMessage(index: number, msg: ChatMessage): number {
    return msg.id;
  }
}

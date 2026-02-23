import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { CaronasService } from '../services/caronas.service';
import { UserService } from '../services/user.service';
import { AvaliacoesService } from '../services/avaliacoes.service';
import type { MinhasCaronasItem } from '../models/api.models';

@Component({
  selector: 'app-minhas-caronas',
  templateUrl: './minhas-caronas.component.html',
  styleUrls: ['./minhas-caronas.component.scss']
})
export class MinhasCaronasComponent implements OnInit {
  abaAtiva: 'proximas' | 'historico' = 'proximas';
  proximasCorridas: MinhasCaronasItem[] = [];
  historicoCorridas: MinhasCaronasItem[] = [];
  loading = false;
  erro: string | null = null;
  avaliarCaronaItem: MinhasCaronasItem | null = null;
  caronasJaAvaliadas = new Set<string>();
  /** motoristaId -> nota média (preenchido após carregar caronas) */
  notasPorMotorista = new Map<string, number>();

  constructor(
    private caronasService: CaronasService,
    private userService: UserService,
    private avaliacoesService: AvaliacoesService,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarMinhasCaronas();
  }

  carregarMinhasCaronas(): void {
    this.loading = true;
    this.erro = null;
    this.caronasService.getMinhasCaronas()
      .then(async res => {
        const todas = [...(res.comoMotorista ?? []), ...(res.comoPassageiro ?? [])];
        this.proximasCorridas = todas.filter(item => this.isProxima(item));
        this.historicoCorridas = todas.filter(item => !this.isProxima(item));
        console.log(todas)
        this.carregarCaronasJaAvaliadas();
        await this.carregarNotasMotoristas(todas);
      })
      .catch(err => {
        this.erro = err?.error?.message ?? 'Erro ao carregar minhas caronas. Tente de novo.';
      })
      .finally(() => { this.loading = false; });
  }

  private carregarCaronasJaAvaliadas(): void {
    const uid = this.userService.getCurrentUser()?.uid;
    if (!uid) return;
    this.avaliacoesService.getCaronaIdsAvaliadosByUser(uid).then(set => {
      this.caronasJaAvaliadas = set;
    });
  }

  /** Coleta motoristaId de cada item e preenche notasPorMotorista com a média do Firestore. */
  private async carregarNotasMotoristas(items: MinhasCaronasItem[]): Promise<void> {
    const uid = this.userService.getCurrentUser()?.uid;
    const ids = new Set<string>();
    for (const item of items) {
      const mid = item.usuarioEhPassageiro
        ? (item.motoristaId ?? (item.motorista as { id?: string } | undefined)?.id)
        : uid;
      if (mid) ids.add(mid);
    }
    this.notasPorMotorista.clear();
    await Promise.all(
      Array.from(ids).map(async (motoristaId) => {
        const media = await this.avaliacoesService.getNotaMediaMotorista(motoristaId);
        this.notasPorMotorista.set(motoristaId, media);
      })
    );
  }

  /** Retorna a nota do motorista para exibição. Preferência: API (motorista.notaMedia) e depois Firestore. */
  getNotaMotorista(item: MinhasCaronasItem): number | undefined {
    const notaApi = item.motorista?.notaMedia;
    if (typeof notaApi === 'number' && notaApi >= 0 && notaApi <= 5) return notaApi;
    const uid = this.userService.getCurrentUser()?.uid;
    const mid = item.usuarioEhPassageiro
      ? (item.motoristaId ?? (item.motorista as { id?: string } | undefined)?.id)
      : uid;
    return mid ? this.notasPorMotorista.get(mid) : undefined;
  }

  podeAvaliar(item: MinhasCaronasItem): boolean {
    return !!item.usuarioEhPassageiro && !this.caronasJaAvaliadas.has(item.id);
  }

  abrirAvaliar(item: MinhasCaronasItem): void {
    this.avaliarCaronaItem = item;
  }

  fecharAvaliar(): void {
    this.avaliarCaronaItem = null;
    this.carregarMinhasCaronas();
  }

  /** Carona é "próxima" se não está finalizada e a data de partida é hoje ou futura. */
  private isProxima(item: MinhasCaronasItem): boolean {
    if (item.status === 'FINALIZADA') return false;
    const dt = item.dtPartida ? new Date(item.dtPartida) : null;
    if (!dt || isNaN(dt.getTime())) return item.status !== 'FINALIZADA';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return dt >= hoje;
  }

  get listaAtiva(): MinhasCaronasItem[] {
    return this.abaAtiva === 'proximas' ? this.proximasCorridas : this.historicoCorridas;
  }

  /** Texto de origem para exibição (nomeLocal, cidade ou rota) */
  origemTexto(item: MinhasCaronasItem): string {
    const o = item.origem as { nomeLocal?: string; cidade?: string } | undefined;
    if (o?.nomeLocal) return o.nomeLocal;
    if (o?.cidade) return o.cidade;
    return item.rota?.split(' → ')[0] ?? '—';
  }

  /** Texto de destino para exibição */
  destinoTexto(item: MinhasCaronasItem): string {
    const d = item.destino as { nomeLocal?: string; cidade?: string } | undefined;
    if (d?.nomeLocal) return d.nomeLocal;
    if (d?.cidade) return d.cidade;
    return item.rota?.split(' → ')[1] ?? '—';
  }

  /** Horário de partida formatado (apenas hora se for ISO) */
  horarioPartida(item: MinhasCaronasItem): string {
    const dt = item.dtPartida;
    if (!dt) return '—';
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    return isNaN(d.getTime()) ? String(dt) : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /** Valor formatado (R$) */
  valorTexto(item: MinhasCaronasItem): string {
    const v = item.valor;
    if (v == null) return '—';
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(n) ? String(v) : `R$ ${n.toFixed(2).replace('.', ',')}`;
  }

  /** Nome do motorista (quando usuário é passageiro) */
  nomeMotorista(item: MinhasCaronasItem): string {
    return (item.motorista?.nome as string) ?? 'Motorista';
  }

  /** Foto do motorista (quando passageiro) ou placeholder */
  fotoMotorista(item: MinhasCaronasItem): string {
    const url = item.motorista?.fotoUrl;
    return (url && url !== '') ? url : 'https://i.pravatar.cc/150?u=driver';
  }

  /** Veículo formatado (formatado, modelo ou placa) */
  veiculoTexto(item: MinhasCaronasItem): string {
    const v = item.veiculo as { formatado?: string; modelo?: string; placa?: string } | undefined;
    return v?.formatado ?? v?.modelo ?? v?.placa ?? '—';
  }

  /** Label do badge conforme status (exibe o status real: FINALIZADA, INICIADA, ABERTA, etc.) */
  statusLabel(item: MinhasCaronasItem): string {
    const s = item.status;
    if (!s) return 'AGENDADA';
    if (s === 'ABERTA') return 'AGENDADA';
    return s.toUpperCase();
  }

  /** Se a partida é hoje (para exibir "hoje" ao lado do horário) */
  isHoje(item: MinhasCaronasItem): boolean {
    const dt = item.dtPartida ? new Date(item.dtPartida) : null;
    if (!dt || isNaN(dt.getTime())) return false;
    const hoje = new Date();
    return dt.getDate() === hoje.getDate() &&
           dt.getMonth() === hoje.getMonth() &&
           dt.getFullYear() === hoje.getFullYear();
  }

  /** Vagas disponíveis (para exibição no card) */
  vagasDisponiveis(item: MinhasCaronasItem): number {
    const v = item.vagasDisponiveis;
    return v != null && typeof v === 'number' ? v : 0;
  }

  voltar(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/caronas']);
    }
  }
}

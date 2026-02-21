import { Component, OnInit } from '@angular/core';
import { CaronasService } from '../services/caronas.service';
import type { MinhasCaronasItem } from '../models/api.models';

@Component({
  selector: 'app-minhas-caronas',
  templateUrl: './minhas-caronas.component.html',
  styleUrls: ['./minhas-caronas.component.scss']
})
export class MinhasCaronasComponent implements OnInit {
  abaAtiva: 'motorista' | 'passageiro' = 'motorista';
  comoMotorista: MinhasCaronasItem[] = [];
  comoPassageiro: MinhasCaronasItem[] = [];
  loading = false;
  erro: string | null = null;

  constructor(private caronasService: CaronasService) {}

  ngOnInit(): void {
    this.carregarMinhasCaronas();
  }

  carregarMinhasCaronas(): void {
    this.loading = true;
    this.erro = null;
    this.caronasService.getMinhasCaronas()
      .then(res => {
        this.comoMotorista = res.comoMotorista ?? [];
        this.comoPassageiro = res.comoPassageiro ?? [];
      })
      .catch(err => {
        this.erro = err?.error?.message ?? 'Erro ao carregar minhas caronas. Tente de novo.';
      })
      .finally(() => { this.loading = false; });
  }

  get listaAtiva(): MinhasCaronasItem[] {
    return this.abaAtiva === 'motorista' ? this.comoMotorista : this.comoPassageiro;
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
}

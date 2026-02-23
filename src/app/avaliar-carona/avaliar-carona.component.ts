import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { AvaliacoesService } from "../services/avaliacoes.service";
import type { MinhasCaronasItem } from "../models/api.models";

@Component({
  selector: "app-avaliar-carona",
  templateUrl: "./avaliar-carona.component.html",
  styleUrls: ["./avaliar-carona.component.scss"],
})
export class AvaliarCaronaComponent {
  @Input() item: MinhasCaronasItem | null = null;
  @Output() close = new EventEmitter<void>();

  nota = 0;
  comentario = "";
  enviando = false;
  erro: string | null = null;

  constructor(
    private avaliacoesService: AvaliacoesService,
    private toastr: ToastrService
  ) {}

  onClose(): void {
    this.close.emit();
  }

  setNota(n: number): void {
    this.nota = n;
    this.erro = null;
  }

  get nomeMotorista(): string {
    return this.item?.motorista?.nome ?? "Motorista";
  }

  get fotoMotorista(): string {
    const url = this.item?.motorista?.fotoUrl;
    return url && url !== "" ? url : "assets/default-profile.png";
  }

  get veiculoTexto(): string {
    const v = this.item?.veiculo as { formatado?: string; modelo?: string; placa?: string } | undefined;
    return v?.formatado ?? v?.modelo ?? v?.placa ?? "—";
  }

  get rotaTexto(): string {
    return this.item?.rota ?? "—";
  }

  get dataHoraTexto(): string {
    const dt = this.item?.dtPartida;
    if (!dt) return "—";
    const d = typeof dt === "string" ? new Date(dt) : dt;
    if (isNaN(d.getTime())) return String(dt);
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${hora}h ${data}`;
  }

  enviar(): void {
    if (!this.item || this.enviando || this.nota < 1 || this.nota > 5) return;
    this.enviando = true;
    this.erro = null;
    this.avaliacoesService
      .criarAvaliacao({
        caronaID: this.item.id,
        nota: this.nota,
        comentario: this.comentario.trim() || "",
      })
      .then(() => {
        this.toastr.success("Avaliação enviada com sucesso.");
        this.close.emit();
      })
      .catch((err) => {
        this.erro =
          err?.error?.message ??
          "Não foi possível enviar a avaliação. Tente novamente.";
        this.enviando = false;
      });
  }
}

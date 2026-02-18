import { Component, OnInit } from "@angular/core";
import { CaronasService } from "../services/caronas.service";
import type { ListCaronaItem, OrigemCarona } from "../models/api.models";

@Component({
  selector: "app-caronas",
  templateUrl: "./caronas.component.html",
  styleUrls: ["./caronas.component.scss"],
})
export class CaronasComponent implements OnInit {
  caronas: ListCaronaItem[] = [];

  constructor(private caronasService: CaronasService) {}

  async ngOnInit() {
    try {
      this.caronas = await this.caronasService.getCaronas();
      console.log(this.caronas);
    } catch (error) {
      console.error("Erro ao buscar caronas:", error);
    }
  }

  formatarEndereco(endereco: OrigemCarona | Record<string, unknown> | undefined): string {
    if (!endereco || typeof endereco !== "object") return "";
    const nome = (endereco as any).nomeLocal ?? (endereco as any).nome ?? "";
    const cidade = (endereco as any).cidade ?? "";
    const estado = (endereco as any).estado ?? "";
    if (nome && cidade && estado) return `${nome}, ${cidade} - ${estado}`;
    if (cidade && estado) return `${cidade} - ${estado}`;
    return nome || cidade || String(estado) || "—";
  }

  private toDate(data: string | number | Date | null | undefined): Date | null {
    if (data == null) return null;
    if (data instanceof Date) return data;
    if (typeof data === "string") return new Date(data);
    if (typeof data === "number") {
      const ms = data < 1e10 ? data * 1000 : data;
      return new Date(ms);
    }
    return null;
  }

  formatarData(data: string | null | undefined): string {
    const date = this.toDate(data);
    return date ? date.toLocaleDateString("pt-BR") : "";
  }

  formatarHora(data: string | null | undefined): string {
    const date = this.toDate(data);
    return date
      ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "";
  }

  vagasDisponiveis(carona: ListCaronaItem): number {
    return carona.vagasDisponiveis ?? 0;
  }
}

import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import type { ListCaronaItem, MinhasCaronasResponse } from "../models/api.models";

@Injectable({
  providedIn: "root",
})
export class CaronasService {
  constructor(private api: ApiService) {}

  /** GET /caronas - Listar caronas disponíveis */
  async getCaronas(): Promise<ListCaronaItem[]> {
    const list = await this.api.get<ListCaronaItem[]>("/caronas");
    return Array.isArray(list) ? list : [];
  }

  /** GET /caronas/minhasCaronas - Listar minhas caronas (como motorista e como passageiro) */
  async getMinhasCaronas(): Promise<MinhasCaronasResponse> {
    const res = await this.api.get<MinhasCaronasResponse>("/caronas/minhasCaronas");
    return {
      comoMotorista: Array.isArray(res?.comoMotorista) ? res.comoMotorista : [],
      comoPassageiro: Array.isArray(res?.comoPassageiro) ? res.comoPassageiro : [],
    };
  }
}

import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import type { ListCaronaItem } from "../models/api.models";

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
}

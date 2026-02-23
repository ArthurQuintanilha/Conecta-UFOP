import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import type {
  ListCaronaItem,
  MinhasCaronasItem,
  MinhasCaronasResponse,
  CreateCaronaRequest,
  CreateCaronaResponse,
  GetCaronaByIdResponse,
} from "../models/api.models";

@Injectable({
  providedIn: "root",
})
export class CaronasService {
  constructor(private api: ApiService) {}

  /** GET /carona/:id - Buscar carona por ID */
  async getCaronaById(id: string): Promise<GetCaronaByIdResponse> {
    return this.api.get<GetCaronaByIdResponse>(`/carona/${id}`);
  }

  /** POST /carona/solicitar/:caronaID - Solicitar carona como passageiro */
  async solicitarCarona(caronaID: string): Promise<{ message: string }> {
    return this.api.post<{ message: string }>(
      `/carona/solicitar/${caronaID}`,
      {},
    );
  }

  /** PATCH /carona/:caronaID/solicitacao/:passageiroID - Aceitar ou recusar solicitação (motorista) */
  async responderSolicitacao(
    caronaID: string,
    passageiroID: string,
    aceite: boolean
  ): Promise<{ message: string }> {
    return this.api.patch<{ message: string }>(
      `/carona/${caronaID}/solicitacao/${passageiroID}`,
      { aceite },
    );
  }

  /** GET /caronas - Listar caronas disponíveis */
  async getCaronas(): Promise<ListCaronaItem[]> {
    const list = await this.api.get<ListCaronaItem[]>("/caronas");
    console.log(list)
    return Array.isArray(list) ? list : [];
  }

  /** POST /carona - Criar nova carona */
  async createCarona(body: CreateCaronaRequest): Promise<CreateCaronaResponse> {
    return this.api.post<CreateCaronaResponse>("/carona", body);
  }

  /** PATCH /carona/:caronaID - Alterar status da carona (INICIADA, FINALIZADA ou CANCELADA). Apenas motorista. */
  async alterarStatusCarona(
    caronaID: string,
    status: "INICIADA" | "FINALIZADA" | "CANCELADA"
  ): Promise<{ message: string; status: string }> {
    return this.api.patch<{ message: string; status: string }>(
      `/carona/${caronaID}/status`,
      { status },
    );
  }

  /** Cancelar corrida (motorista). Status atual deve ser ABERTA. */
  async cancelarCorrida(caronaID: string): Promise<{ message: string; status?: string }> {
    return this.alterarStatusCarona(caronaID, "CANCELADA");
  }

  /** Passageiro cancela sua própria solicitação (remove-se do array solicitacoes). */
  async cancelarSolicitacao(caronaID: string): Promise<{ message: string }> {
    return this.api.delete<{ message: string }>(`/carona/${caronaID}/solicitacao`);
  }

  /** Passageiro cancela sua reserva (remove-se do array passageiros). */
  async cancelarReserva(caronaID: string): Promise<{ message: string }> {
    return this.api.delete<{ message: string }>(`/carona/${caronaID}/reserva`);
  }

  /** GET /caronas/minhasCaronas - Listar minhas caronas (como motorista e como passageiro).
   * Normaliza eMotorista da API para usuarioEhPassageiro (usuarioEhPassageiro = !eMotorista). */
  async getMinhasCaronas(): Promise<MinhasCaronasResponse> {
    const res = await this.api.get<MinhasCaronasResponse>(
      "/caronas/minhasCaronas",
    );
    const normalize = (item: MinhasCaronasItem): MinhasCaronasItem => ({
      ...item,
      usuarioEhPassageiro: item.eMotorista === false,
    });
    return {
      comoMotorista: Array.isArray(res?.comoMotorista)
        ? res.comoMotorista.map(normalize)
        : [],
      comoPassageiro: Array.isArray(res?.comoPassageiro)
        ? res.comoPassageiro.map(normalize)
        : [],
    };
  }
}

import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { ApiService } from "./api.service";
import type {
  CreateAvaliacaoRequest,
  CreateAvaliacaoResponse,
  GetAvaliacoesResponse,
} from "../models/api.models";

@Injectable({
  providedIn: "root",
})
export class AvaliacoesService {
  constructor(
    private api: ApiService,
    private firestore: AngularFirestore
  ) {}

  criarAvaliacao(
    body: CreateAvaliacaoRequest
  ): Promise<CreateAvaliacaoResponse> {
    return this.api.post<CreateAvaliacaoResponse>("/avaliacao", body);
  }

  /** GET /avaliacao/{userId} - Resumo do motorista e avaliações recebidas. */
  getAvaliacoesByUserId(userId: string): Promise<GetAvaliacoesResponse> {
    return this.api.get<GetAvaliacoesResponse>(`/avaliacao/${userId}`);
  }

  /**
   * Retorna a média das notas do motorista (collection avaliacoes, campo motoristaId).
   * Documento: { motoristaId, nota, userId, caronaID, comentario, criadoEm }.
   */
  async getNotaMediaMotorista(motoristaId: string): Promise<number> {
    const snapshot = await this.firestore
      .collection("avaliacoes")
      .ref.where("motoristaId", "==", motoristaId)
      .get();
    if (snapshot.empty) return 0;
    let soma = 0;
    snapshot.docs.forEach((doc) => {
      const nota = (doc.data() as { nota?: number }).nota;
      if (typeof nota === "number" && nota >= 0 && nota <= 5) soma += nota;
    });
    return snapshot.size > 0 ? soma / snapshot.size : 0;
  }

  /**
   * Retorna os IDs das caronas que o usuário já avaliou (collection avaliacoes).
   * Considera campos caronaID ou caronaId no documento.
   */
  async getCaronaIdsAvaliadosByUser(userId: string): Promise<Set<string>> {
    const snapshot = await this.firestore
      .collection("avaliacoes")
      .ref.where("userId", "==", userId)
      .get();
    const ids = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as { caronaID?: string; caronaId?: string };
      const id = data.caronaID ?? data.caronaId;
      if (id) ids.add(id);
    });
    return ids;
  }
}

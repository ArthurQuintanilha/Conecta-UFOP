import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UsuariosService {
  constructor(private ngFirestore: AngularFirestore) {}

  /** Retorna apenas o documento do usuário na collection usuarios (sem avaliações). */
  async getUsuarioDoc(userId: string): Promise<Record<string, unknown> | null> {
    const userDoc = await firstValueFrom(
      this.ngFirestore.collection("usuarios").doc(userId).valueChanges(),
    );
    return userDoc ? (userDoc as Record<string, unknown>) : null;
  }

  async getUser(userId: string) {
    try {
      // Buscar dados do usuário
      const userDoc = await firstValueFrom(
        this.ngFirestore.collection("usuarios").doc(userId).valueChanges(),
      );

      if (!userDoc) {
        throw new Error(`Usuário com ID ${userId} não encontrado`);
      }

      // Buscar todas as avaliações onde o usuário é o motorista avaliado (collection: motoristaId)
      const avaliacoesSnapshot = await this.ngFirestore
        .collection("avaliacoes", (ref) =>
          ref.where("motoristaId", "==", userId),
        )
        .ref.get();

      let mediaAvaliacoes = 0;
      if (avaliacoesSnapshot && !avaliacoesSnapshot.empty) {
        let somaNotas = 0;
        avaliacoesSnapshot.docs.forEach((doc) => {
          const nota = (doc.data() as { nota?: number }).nota;
          if (typeof nota === "number" && nota >= 0 && nota <= 5)
            somaNotas += nota;
        });
        mediaAvaliacoes = somaNotas / avaliacoesSnapshot.docs.length;
      }

      // Retornar usuário com campo avaliacoes
      return {
        id: userId,
        ...userDoc,
        avaliacoes: mediaAvaliacoes,
      };
    } catch (error) {
      console.error(`Erro ao buscar usuário ${userId}:`, error);
      throw error;
    }
  }
}

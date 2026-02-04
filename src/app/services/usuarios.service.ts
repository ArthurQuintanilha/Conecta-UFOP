import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private ngFirestore: AngularFirestore) { }

  async getUser(userId: string) {
    try {
      // Buscar dados do usuário
      const userDoc = await firstValueFrom(
        this.ngFirestore.collection('usuarios').doc(userId).valueChanges()
      );

      if (!userDoc) {
        throw new Error(`Usuário com ID ${userId} não encontrado`);
      }

      // Buscar todas as avaliações onde o usuário é o alvo
      const avaliacoesSnapshot = await firstValueFrom(
        this.ngFirestore.collection('avaliacoes', ref => 
          ref.where('alvoId', '==', userId)
        ).snapshotChanges()
      );

      // Calcular média das notas
      let mediaAvaliacoes = 0;
      if (avaliacoesSnapshot && avaliacoesSnapshot.length > 0) {
        const somaNotas = avaliacoesSnapshot.reduce((soma: number, change: any) => {
          const nota = change.payload.doc.data().nota || 0;
          return soma + nota;
        }, 0);
        mediaAvaliacoes = somaNotas / avaliacoesSnapshot.length;
      }

      // Retornar usuário com campo avaliacoes
      return {
        id: userId,
        ...userDoc,
        avaliacoes: mediaAvaliacoes
      };
    } catch (error) {
      console.error(`Erro ao buscar usuário ${userId}:`, error);
      throw error;
    }
  }
}

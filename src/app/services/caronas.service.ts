import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CaronasService {

  constructor(private ngFirestore: AngularFirestore) { }

  async getCaronas(){
   const snapshot = await firstValueFrom(this.ngFirestore.collection('caronas').snapshotChanges());
   const caronas = await Promise.all(snapshot.map(async (change: any) => {
    const doc = change.payload.doc;
    const data = doc.data();
    
    // Buscar dados do motorista
    let motorista = null;
    if (data.motoristaId) {
      try {
        const motoristaDoc = await firstValueFrom(
          this.ngFirestore.collection('usuarios').doc(data.motoristaId).valueChanges()
        );
        motorista = motoristaDoc;
      } catch (error) {
        console.error(`Erro ao buscar motorista ${data.motoristaId}:`, error);
      }
    }
    
    return {
      id: doc.id,
      ...data,
      motorista: motorista || {
        nome: 'Motorista',
        foto: 'https://via.placeholder.com/150',
        avaliacao: 0
      }
    };
   }));
   
   return caronas;
  }
}

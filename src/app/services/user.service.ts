import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserDashSubject = new BehaviorSubject<any>(null);
  currentUserDash$ = this.currentUserDashSubject.asObservable();

  constructor(private firestore: AngularFirestore) {}

//TODO trocar tudo por chamadas da API

  async getUserById(uid: string): Promise<any> {
    const doc = await firstValueFrom(
      this.firestore.collection('users').doc(uid).valueChanges()
    );
    return doc ? { uid, ...doc } : null;
  }

  setCurrentUser(userDash: any): void {
    this.currentUserDashSubject.next(userDash);
    if (userDash) {
      localStorage.setItem('currentUserDash', JSON.stringify(userDash));
    }
  }

  clearCurrentUser(): void {
    this.currentUserDashSubject.next(null);
    localStorage.removeItem('currentUserDash');
  }

  getCurrentUser(): any {
    return this.currentUserDashSubject.value;
  }
}

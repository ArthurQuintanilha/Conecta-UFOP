import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<any>(this.loadUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();
  collection = 'usuarios';

  constructor(private firestore: AngularFirestore) {}

  private loadUserFromStorage(): any {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

//TODO trocar tudo por chamadas da API

  async getUserById(uid: string): Promise<any> {
    const ref = this.firestore.collection(this.collection).doc(uid);
    const doc = await firstValueFrom(ref.valueChanges());
    return doc ? { uid, ...doc } : null;
  }

  setCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map, Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(
    private router: Router,
    private toastr: ToastrService,
    public afAuth: AngularFireAuth,
    private userService: UserService
  ) {}

  async loginByAuth({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> {
    try {
      const credential = await this.afAuth.signInWithEmailAndPassword(
        email,
        password
      );

      const idTokenResult = await credential.user!.getIdTokenResult();
      const claims = idTokenResult.claims as { role?: string };

      if (claims.role !== 'admin') {
        this.toastr.error('Não autorizado');
        await this.logout();
        return;
      }

      const uid = credential.user!.uid;
      const user = await this.userService.getUserById(uid);

      if (!user) {
        this.toastr.error('Usuário não encontrado no sistema');
        await this.logout();
        return;
      }

      this.userService.setCurrentUser(user);

      await this.router.navigate(['/caronas']);
      this.toastr.success('Login realizado com sucesso');
    } catch (error: any) {
      this.toastr.error(error?.message || 'Erro ao fazer login');
      await this.logout();
    }
  }

  getProfile(): Observable<boolean> {
    return this.afAuth.authState.pipe(map((user) => !!user));
  }

  async logout(): Promise<void> {
    this.userService.clearCurrentUser();
    await this.afAuth.signOut();
    localStorage.clear();
    await this.router.navigate(['/login']);
  }
}

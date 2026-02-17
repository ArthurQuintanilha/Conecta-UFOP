import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppService } from '../services/app.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private router: Router,
    private appService: AppService,
    private userService: UserService
  ) {}

  canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.appService.getProfile().pipe(
      take(1),
      switchMap((isLoggedIn) => {
        if (!isLoggedIn) {
          return of(this.router.parseUrl('/login'));
        }
        return this.appService.afAuth.authState.pipe(
          take(1),
          switchMap((user) => {
            if (!user) {
              return of(this.router.parseUrl('/login'));
            }
            return from(this.ensureUserDataLoaded(user.uid)).pipe(
              map((allowed) =>
                allowed ? true : this.router.parseUrl('/login')
              )
            );
          })
        );
      })
    );
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }

  private async ensureUserDataLoaded(uid: string): Promise<boolean> {
    if (this.userService.getCurrentUser()) {
      return true;
    }
    try {
      const userData = await this.userService.getUserById(uid);
      if (userData) {
        this.userService.setCurrentUser(userData);
        return true;
      }
    } catch {
      // ignore
    }
    await this.appService.logout();
    return false;
  }
}

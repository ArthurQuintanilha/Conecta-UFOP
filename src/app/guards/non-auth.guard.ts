import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { map, Observable, take } from 'rxjs';
import { AppService } from '../services/app.service';

@Injectable({
  providedIn: 'root',
})
export class NonAuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private router: Router,
    private appService: AppService
  ) {}

  canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.appService.getProfile().pipe(
      take(1),
      map((isLoggedIn) =>
        isLoggedIn ? this.router.parseUrl('/minhas-caronas') : true
      )
    );
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }
}

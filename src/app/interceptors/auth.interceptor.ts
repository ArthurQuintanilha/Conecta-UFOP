import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { from, switchMap, Observable } from "rxjs";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { environment } from "../../environments/environment";

/**
 * Adiciona o header Authorization: Bearer <Firebase ID Token> em requisições
 * para a API Conecta UFOP quando o usuário está logado.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private afAuth: AngularFireAuth) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith(environment.apiUrl)) {
      return next.handle(req);
    }

    return from(this.getIdToken()).pipe(
      switchMap((token) => {
        const request = token
          ? req.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
            })
          : req;
        return next.handle(request);
      })
    );
  }

  private async getIdToken(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.getIdToken() : null;
  }
}

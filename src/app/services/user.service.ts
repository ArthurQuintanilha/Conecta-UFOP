import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ApiService } from "./api.service";
import type { AuthenticatedUserResponse } from "../models/api.models";

export type CurrentUser = AuthenticatedUserResponse & { uid?: string };

@Injectable({
  providedIn: "root",
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiService) {}

  /** GET /users/me - Busca e armazena o usuário autenticado */
  async getMe(): Promise<AuthenticatedUserResponse | null> {
    try {
      const me = await this.api.get<AuthenticatedUserResponse>("/users/me");
      return me ?? null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: CurrentUser | null): void {
    this.currentUserSubject.next(user);
  }

  clearCurrentUser(): void {
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }
}

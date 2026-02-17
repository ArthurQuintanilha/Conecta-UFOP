import { Injectable, Injector } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import { AppService } from "./app.service";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private afAuth: AngularFireAuth,
    private injector: Injector
  ) {}

  /** Resolve AppService só no 401 para evitar dependência circular (ApiService → AppService → UserService → ApiService). */
  private onUnauthorized(): void {
    this.injector.get(AppService).logout();
  }

  private async getHeaders(): Promise<HttpHeaders> {
    const token = await firstValueFrom(this.afAuth.idToken);
    let headers = new HttpHeaders({
      "Content-Type": "application/json",
    });
    if (token) {
      headers = headers.set("Authorization", "Bearer " + token);
    }
    return headers;
  }

  async get<T = any>(
    url: string,
    query: Record<string, string | number | boolean> = {},
    responseType: "json" | "text" | "blob" = "json",
    useApiUrl = true
  ): Promise<T> {
    const headers = await this.getHeaders();
    const params = new HttpParams({ fromObject: query as Record<string, string> });
    const fullUrl = useApiUrl ? this.apiUrl + url : url;
    const options: any = { headers, params };
    if (responseType !== "json") options.responseType = responseType;

    return new Promise((resolve, reject) => {
      this.http
        .get<T>(fullUrl, options)
        .subscribe({
          next: (data) => resolve(data as T),
          error: (error) => {
            if (error.status === 401) {
              this.onUnauthorized();
            }
            reject(error);
          },
        });
    });
  }

  async post<T = any>(
    url: string,
    data: any,
    responseType: "json" | "text" | "blob" = "json",
    useApiUrl = true
  ): Promise<T> {
    const headers = await this.getHeaders();
    const fullUrl = useApiUrl ? this.apiUrl + url : url;
    const options: any = { headers };
    if (responseType !== "json") options.responseType = responseType;

    return new Promise((resolve, reject) => {
      this.http
        .post<T>(fullUrl, data, options)
        .subscribe({
          next: (data) => resolve(data as T),
          error: (error) => {
            if (error.status === 401) {
              this.onUnauthorized();
            }
            reject(error);
          },
        });
    });
  }

  async put<T = any>(
    url: string,
    data: any,
    responseType: "json" | "text" | "blob" = "json",
    useApiUrl = true
  ): Promise<T> {
    const headers = await this.getHeaders();
    const fullUrl = useApiUrl ? this.apiUrl + url : url;
    const options: any = { headers };
    if (responseType !== "json") options.responseType = responseType;

    return new Promise((resolve, reject) => {
      this.http
        .put<T>(fullUrl, data, options)
        .subscribe({
          next: (data) => resolve(data as T),
          error: (error) => {
            if (error.status === 401) {
              this.onUnauthorized();
            }
            reject(error);
          },
        });
    });
  }

  async delete<T = any>(
    url: string,
    responseType: "json" | "text" | "blob" = "json",
    useApiUrl = true
  ): Promise<T> {
    const headers = await this.getHeaders();
    const fullUrl = useApiUrl ? this.apiUrl + url : url;
    const options: any = { headers };
    if (responseType !== "json") options.responseType = responseType;

    return new Promise((resolve, reject) => {
      this.http
        .delete<T>(fullUrl, options)
        .subscribe({
          next: (data) => resolve(data as T),
          error: (error) => {
            if (error.status === 401) {
              this.onUnauthorized();
            }
            reject(error);
          },
        });
    });
  }

  /** Debug: requisição POST com API Key customizada no header Authorization */
  async postWithApiKey<T = any>(
    url: string,
    data: any,
    apiKey: string,
    responseType: "json" | "text" | "blob" = "json"
  ): Promise<T> {
    const headers = new HttpHeaders({
      Authorization: apiKey,
      "Content-Type": "application/json",
    });

    const options: any = { headers };
    if (responseType !== "json") options.responseType = responseType;
    return new Promise((resolve, reject) => {
      this.http
        .post<T>(this.apiUrl + url, data, options)
        .subscribe({
          next: (data) => resolve(data as T),
          error: (error) => reject(error),
        });
    });
  }
}

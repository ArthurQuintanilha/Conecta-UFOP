import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ViaCepService {
  private readonly baseUrl = "https://viacep.com.br/ws";

  constructor(private http: HttpClient) {}


  async buscar(cep: string): Promise<ViaCepResponse | null> {
    const digits = (cep ?? "").replace(/\D/g, "");
    if (digits.length !== 8) return null;
    try {
      const res = await firstValueFrom(
        this.http.get<ViaCepResponse>(`${this.baseUrl}/${digits}/json/`)
      );
      if (res?.erro === true) return null;
      return res;
    } catch {
      return null;
    }
  }
}

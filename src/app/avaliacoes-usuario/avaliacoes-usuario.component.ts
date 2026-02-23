import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { AvaliacoesService } from "../services/avaliacoes.service";
import type { GetAvaliacoesResponse } from "../models/api.models";

type StarType = "full" | "half" | "empty";

/** Firestore timestamp serializado como { _seconds, _nanoseconds } */
interface FirestoreTimestampLike {
  _seconds: number;
  _nanoseconds?: number;
}

function toDate(value: string | FirestoreTimestampLike | null | undefined): Date | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && typeof (value as FirestoreTimestampLike)._seconds === "number") {
    const ts = value as FirestoreTimestampLike;
    return new Date(ts._seconds * 1000 + ((ts._nanoseconds ?? 0) / 1e6));
  }
  return null;
}

@Component({
  selector: "app-avaliacoes-usuario",
  templateUrl: "./avaliacoes-usuario.component.html",
  styleUrls: ["./avaliacoes-usuario.component.scss"],
})
export class AvaliacoesUsuarioComponent implements OnInit {
  loading = true;
  notFound = false;
  usuario: GetAvaliacoesResponse["usuario"] = undefined;
  avaliacoes: NonNullable<GetAvaliacoesResponse["avaliacoes"]> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private avaliacoesService: AvaliacoesService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get("userId");
    if (!userId) {
      this.loading = false;
      this.notFound = true;
      return;
    }
    this.load(userId);
  }

  private async load(userId: string): Promise<void> {
    try {
      const res = await this.avaliacoesService.getAvaliacoesByUserId(userId);
      this.usuario = res.usuario;
      this.avaliacoes = res.avaliacoes ?? [];
    } catch (err: any) {
      if (err?.status === 404 || err?.error?.message) {
        this.notFound = true;
      } else {
        this.notFound = true;
      }
    } finally {
      this.loading = false;
    }
  }

  voltar(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(["/caronas"]);
    }
  }

  /** Formata data (ISO ou timestamp Firestore) para "dd/MM/yyyy às HH:mm". */
  formatarDataHora(value: string | FirestoreTimestampLike | null | undefined): string {
    const d = toDate(value);
    if (!d) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} às ${h}:${min}`;
  }

  /** Formata data (ISO ou timestamp Firestore) para "Entrou em MMM/yyyy" (ex.: jan/2026). */
  formatarEntrouEm(value: string | FirestoreTimestampLike | null | undefined): string {
    const d = toDate(value);
    if (!d) return "";
    const meses = "jan/fev/mar/abr/mai/jun/jul/ago/set/out/nov/dez".split("/");
    const mes = meses[d.getMonth()];
    const ano = d.getFullYear();
    return `Entrou em ${mes}/${ano}`;
  }

  /** Retorna array de 5 itens: 'full' | 'half' | 'empty' para exibir estrelas. */
  getStars(nota: number | null | undefined): StarType[] {
    const n = typeof nota === "number" && !isNaN(nota) ? Math.max(0, Math.min(5, nota)) : 0;
    const full = Math.floor(n);
    const hasHalf = n - full >= 0.25 && n - full < 0.75;
    const result: StarType[] = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) result.push("full");
      else if (i === full && hasHalf) result.push("half");
      else result.push("empty");
    }
    return result;
  }

  iniciais(nome: string | undefined): string {
    if (!nome || !nome.trim()) return "?";
    const parts = nome.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return nome.charAt(0).toUpperCase();
  }
}

import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { CaronasService } from "../services/caronas.service";
import { ViaCepService } from "../services/viacep.service";
import type { OrigemCarona } from "../models/api.models";

const UFS = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

@Component({
  selector: "app-cadastrar-carona",
  templateUrl: "./cadastrar-carona.component.html",
  styleUrls: ["./cadastrar-carona.component.scss"],
})
export class CadastrarCaronaComponent {
  form: FormGroup;
  saving = false;
  readonly ufs = UFS;

  constructor(
    private fb: FormBuilder,
    private caronasService: CaronasService,
    private toastr: ToastrService,
    private router: Router,
    private location: Location,
    private viaCep: ViaCepService
  ) {
    this.form = this.buildForm();
  }

  private buildForm(): FormGroup {
    const endereco = () =>
      this.fb.group({
        nome: ["", Validators.required],
        cep: ["", Validators.required],
        logradouro: ["", Validators.required],
        numero: ["", Validators.required],
        bairro: ["", Validators.required],
        cidade: ["", Validators.required],
        uf: ["", Validators.required],
      });

    return this.fb.group({
      dataPartidaData: ["", Validators.required],
      dataPartidaHora: ["", Validators.required],
      previsaoChegadaData: ["", Validators.required],
      previsaoChegadaHora: ["", Validators.required],
      vagasDisponiveis: [1, [Validators.required, Validators.min(1)]],
      valorPassagem: ["0,00", [Validators.required, this.valorDecimalMin(0)]],
      origem: endereco(),
      destino: endereco(),
      modeloAno: ["", Validators.required],
      placa: ["", Validators.required],
    });
  }

  get placaMask(): string {
    const v = (this.form.get("placa")?.value ?? "").toString();
    const clean = v.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length >= 4 && /\d/.test(clean.charAt(3))) return "AAA0A00";
    return "AAA-0000";
  }

  getControl(path: string) {
    return this.form.get(path);
  }

  getErrorMessage(path: string): string {
    const c = this.form.get(path);
    if (!c?.invalid || !c?.touched) return "";
    const e = c.errors;
    if (e?.["required"]) return "Campo obrigatório.";
    if (e?.["min"]) return `Valor mínimo: ${(e["min"] as { min: number }).min}.`;
    return "Valor inválido.";
  }

  parseValorDecimal(value: string | number): number {
    if (typeof value === "number" && !isNaN(value)) return value;
    const s = String(value ?? "").trim().replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  private valorDecimalMin(min: number) {
    return (c: { value: unknown }) => {
      const n = this.parseValorDecimal(c.value as string);
      if (n < min) return { min: { min } };
      return null;
    };
  }

  /** Busca endereço pelo CEP (ViaCEP) e preenche logradouro, bairro, cidade e UF. */
  async buscarCep(group: "origem" | "destino"): Promise<void> {
    const formGroup = this.form.get(group) as FormGroup | null;
    if (!formGroup) return;
    const cepControl = formGroup.get("cep");
    const cep = (cepControl?.value ?? "").toString().trim();
    const res = await this.viaCep.buscar(cep);
    if (!res) {
      const digits = cep.replace(/\D/g, "");
      if (digits.length === 8) {
        this.toastr.info("CEP não encontrado.");
      }
      return;
    }
    formGroup.patchValue({
      logradouro: res.logradouro ?? "",
      bairro: res.bairro ?? "",
      cidade: res.localidade ?? "",
      uf: (res.uf ?? "").toUpperCase(),
    });
  }

  clampTimeField(controlName: string): void {
    const c = this.form.get(controlName);
    if (!c) return;
    const raw = (c.value ?? "").toString().trim().replace(/\D/g, "");
    if (raw.length < 2) return;
    const parsedH = raw.length >= 4 ? parseInt(raw.slice(0, 2), 10) : parseInt(raw.slice(0, 2), 10);
    const parsedM = raw.length >= 4 ? parseInt(raw.slice(2, 4), 10) : 0;
    const hours = Math.min(23, Math.max(0, isNaN(parsedH) ? 0 : parsedH));
    const minutes = Math.min(59, Math.max(0, isNaN(parsedM) ? 0 : parsedM));
    const needFix = parsedH !== hours || parsedM !== minutes;
    if (needFix) {
      const corrected = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      setTimeout(() => c.setValue(corrected, { emitEvent: true }), 0);
    }
  }

  private toOrigemCarona(o: {
    nome: string;
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
  }): OrigemCarona {
    return {
      nomeLocal: o.nome?.trim() ?? "",
      cep: (o.cep ?? "").toString().trim(),
      rua: o.logradouro?.trim() ?? "",
      numero: Number(o.numero) || 0,
      bairro: o.bairro?.trim() ?? "",
      cidade: o.cidade?.trim() ?? "",
      estado: o.uf?.trim() ?? "",
    };
  }

  private parseTimeToMinutes(timeStr: string): number | null {
    if (!timeStr?.trim()) return null;
    const raw = (timeStr ?? "").toString().trim().replace(/\D/g, "");
    if (raw.length < 2) return null;
    const h = raw.length >= 4 ? parseInt(raw.slice(0, 2), 10) : parseInt(raw.slice(0, 2), 10);
    const m = raw.length >= 4 ? parseInt(raw.slice(2, 4), 10) : 0;
    const hours = Math.min(23, Math.max(0, isNaN(h) ? 0 : h));
    const minutes = Math.min(59, Math.max(0, isNaN(m) ? 0 : m));
    return hours * 60 + minutes;
  }

  private parseDdMmYyyy(value: string): { day: number; month: number; year: number } | null {
    const v = (value ?? "").toString().trim().replace(/\D/g, "");
    if (v.length !== 8) return null;
    const day = parseInt(v.slice(0, 2), 10);
    const month = parseInt(v.slice(2, 4), 10);
    const year = parseInt(v.slice(4, 8), 10);
    if (month < 1 || month > 12) return null;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
      return null;
    return { day, month, year };
  }

  private dateAndTimeToISO(dateStr: string, timeStr: string): string | null {
    if (!dateStr?.trim() || !timeStr?.trim()) return null;
    const parsed = this.parseDdMmYyyy(dateStr);
    if (!parsed) return null;
    const mins = this.parseTimeToMinutes(timeStr);
    if (mins === null) return null;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const d = new Date(parsed.year, parsed.month - 1, parsed.day, hours, minutes, 0, 0);
    return d.toISOString();
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving) {
      if (this.form.invalid) {
        this.toastr.warning("Preencha todos os campos obrigatórios corretamente.");
      }
      return;
    }

    const v = this.form.value;
    const dtPartidaISO = this.dateAndTimeToISO(v.dataPartidaData, v.dataPartidaHora);
    const dtChegadaISO = this.dateAndTimeToISO(v.previsaoChegadaData, v.previsaoChegadaHora);

    if (!dtPartidaISO) {
      this.form.get("dataPartidaData")?.setErrors({ required: true });
      this.form.get("dataPartidaHora")?.setErrors({ required: true });
      this.toastr.warning("Informe data e hora de partida.");
      return;
    }

    if (!dtChegadaISO) {
      this.form.get("previsaoChegadaData")?.setErrors({ required: true });
      this.form.get("previsaoChegadaHora")?.setErrors({ required: true });
      this.toastr.warning("Informe data e hora de chegada.");
      return;
    }

    // Validação separada: data e hora
    const dataPartida = this.parseDdMmYyyy(v.dataPartidaData);
    const dataChegada = this.parseDdMmYyyy(v.previsaoChegadaData);
    const horaPartida = this.parseTimeToMinutes(v.dataPartidaHora);
    const horaChegada = this.parseTimeToMinutes(v.previsaoChegadaHora);

    if (dataPartida && dataChegada && horaPartida !== null && horaChegada !== null) {
      const dataPartidaVal = dataPartida.year * 10000 + dataPartida.month * 100 + dataPartida.day;
      const dataChegadaVal = dataChegada.year * 10000 + dataChegada.month * 100 + dataChegada.day;

      // Erro: dataChegada < dataPartida (chegada antes da partida)
      if (dataChegadaVal < dataPartidaVal) {
        this.toastr.warning("A data de chegada não pode ser anterior à data de partida.");
        return;
      }
      // Erro: mesma data E horaChegada <= horaPartida
      if (dataChegadaVal === dataPartidaVal && horaChegada <= horaPartida) {
        this.toastr.warning("A hora de chegada deve ser posterior à hora de partida.");
        return;
      }
    }

    const origem = this.toOrigemCarona(v.origem);
    const destino = this.toOrigemCarona(v.destino);

    this.saving = true;
    try {
      const res = await this.caronasService.createCarona({
        veiculo: { modelo: v.modeloAno?.trim() ?? "", placa: (v.placa?.trim() ?? "").toUpperCase() },
        vagas: Number(v.vagasDisponiveis) || 1,
        valor: this.parseValorDecimal(v.valorPassagem) || 0,
        dtPartida: dtPartidaISO,
        dtChegada: dtChegadaISO,
        origem,
        destino,
      });
      this.toastr.success("Carona criada com sucesso.");
      this.router.navigate(["/detalhes-carona", res.id]);
    } catch (err: unknown) {
      const msg = (err as { error?: { message?: string } })?.error?.message ?? "Não foi possível criar a carona. Tente novamente.";
      this.toastr.error(msg);
    } finally {
      this.saving = false;
    }
  }

  voltar(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(["/caronas"]);
    }
  }
}

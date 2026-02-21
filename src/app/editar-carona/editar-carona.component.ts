import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import firebase from "firebase/compat/app";
import { ToastrService } from "ngx-toastr";
import { Carona, EnderecoCaronaDoc } from "../../types/Caronas";

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
  selector: "app-editar-carona",
  templateUrl: "./editar-carona.component.html",
  styleUrls: ["./editar-carona.component.scss"],
})
export class EditarCaronaComponent implements OnInit {
  form: FormGroup;
  caronaId: string;
  loading = true;
  saving = false;
  notFound = false;
  readonly ufs = UFS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore,
    private toastr: ToastrService,
  ) {
    this.caronaId = this.route.snapshot.params["id"] || "";
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

  ngOnInit(): void {
    if (!this.caronaId) {
      this.loading = false;
      this.notFound = true;
      this.toastr.warning("Carona não identificada.");
      return;
    }
    this.loadCarona();
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

  formatValorDecimal(n: number): string {
    const s = (typeof n === "number" && !isNaN(n) ? n : 0).toFixed(2);
    return s.replace(".", ",");
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

  private async loadCarona(): Promise<void> {
    try {
      const snap = await this.firestore
        .collection("caronas")
        .doc(this.caronaId)
        .ref.get();
      console.log(snap);
      if (!snap.exists) {
        this.notFound = true;
        this.toastr.error("Carona não encontrada.");
        return;
      }

      const data = snap.data() as Carona;
      const origem = data.origem ?? ({} as EnderecoCaronaDoc);
      const destino = data.destino ?? ({} as EnderecoCaronaDoc);

      this.form.patchValue({
        ...this.timestampToDateAndTime(data.dtPartida, "dataPartidaData", "dataPartidaHora"),
        ...(data.dtChegada
          ? this.timestampToDateAndTime(data.dtChegada, "previsaoChegadaData", "previsaoChegadaHora")
          : { previsaoChegadaData: "", previsaoChegadaHora: "" }),
        vagasDisponiveis: data.vagas ?? 1,
        valorPassagem: this.formatValorDecimal(data.valor ?? 0),
        origem: {
          nome: origem.nome ?? "",
          cep: origem.cep ?? "",
          logradouro: origem.rua ?? "",
          numero: origem.numero != null ? String(origem.numero) : "",
          bairro: origem.bairro ?? "",
          cidade: origem.cidade ?? "",
          uf: origem.estado ?? "",
        },
        destino: {
          nome: destino.nome ?? "",
          cep: destino.cep ?? "",
          logradouro: destino.rua ?? "",
          numero: destino.numero != null ? String(destino.numero) : "",
          bairro: destino.bairro ?? "",
          cidade: destino.cidade ?? "",
          uf: destino.estado ?? "",
        },
        modeloAno: data.veiculo ?? "",
        placa: data.placa ?? "",
      });
    } catch (err) {
      console.error("Erro ao carregar carona:", err);
      this.notFound = true;
      this.toastr.error("Erro ao carregar os dados da carona. Tente novamente.");
    } finally {
      this.loading = false;
    }
  }

  private formatDdMmYyyy(d: Date): string {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private timestampToDateAndTime(
    ts: firebase.firestore.Timestamp | undefined,
    dateKey: string,
    timeKey: string,
  ): Record<string, string> {
    if (!ts || !(ts instanceof firebase.firestore.Timestamp))
      return { [dateKey]: "", [timeKey]: "" };
    const d = ts.toDate();
    const dateStr = this.formatDdMmYyyy(d);
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return { [dateKey]: dateStr, [timeKey]: timeStr };
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

  private dateAndTimeToTimestamp(
    dateStr: string,
    timeStr: string,
  ): firebase.firestore.Timestamp | null {
    if (!dateStr?.trim() || !timeStr?.trim()) return null;
    const parsed = this.parseDdMmYyyy(dateStr);
    if (!parsed) return null;
    const mins = this.parseTimeToMinutes(timeStr);
    if (mins === null) return null;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const d = new Date(parsed.year, parsed.month - 1, parsed.day, hours, minutes, 0, 0);
    return firebase.firestore.Timestamp.fromDate(d);
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving || !this.caronaId) {
      if (this.form.invalid) {
        this.toastr.warning("Preencha todos os campos obrigatórios corretamente.");
      }
      return;
    }

    const v = this.form.value;
    const dtPartida = this.dateAndTimeToTimestamp(v.dataPartidaData, v.dataPartidaHora);

    if (!dtPartida) {
      this.form.get("dataPartidaData")?.setErrors({ required: true });
      this.form.get("dataPartidaHora")?.setErrors({ required: true });
      this.toastr.warning("Informe data e hora de partida.");
      return;
    }

    const dtChegada = this.dateAndTimeToTimestamp(v.previsaoChegadaData, v.previsaoChegadaHora);
    // Validação separada: data e hora (só quando dtChegada foi preenchido)
    if (dtChegada) {
      const dataPartida = this.parseDdMmYyyy(v.dataPartidaData);
      const dataChegada = this.parseDdMmYyyy(v.previsaoChegadaData);
      const horaPartida = this.parseTimeToMinutes(v.dataPartidaHora);
      const horaChegada = this.parseTimeToMinutes(v.previsaoChegadaHora);

      if (dataPartida && dataChegada && horaPartida !== null && horaChegada !== null) {
        const dataPartidaVal = dataPartida.year * 10000 + dataPartida.month * 100 + dataPartida.day;
        const dataChegadaVal = dataChegada.year * 10000 + dataChegada.month * 100 + dataChegada.day;

        if (dataChegadaVal < dataPartidaVal) {
          this.toastr.warning("A data de chegada não pode ser anterior à data de partida.");
          return;
        }
        if (dataChegadaVal === dataPartidaVal && horaChegada <= horaPartida) {
          this.toastr.warning("A hora de chegada deve ser posterior à hora de partida.");
          return;
        }
      }
    }

    const origem: EnderecoCaronaDoc = {
      nome: v.origem.nome,
      cep: v.origem.cep,
      rua: v.origem.logradouro,
      numero: Number(v.origem.numero) || 0,
      bairro: v.origem.bairro || undefined,
      cidade: v.origem.cidade,
      estado: v.origem.uf,
    };

    const destino: EnderecoCaronaDoc = {
      nome: v.destino.nome,
      cep: v.destino.cep,
      rua: v.destino.logradouro,
      numero: Number(v.destino.numero) || 0,
      bairro: v.destino.bairro || undefined,
      cidade: v.destino.cidade,
      estado: v.destino.uf,
    };

    this.saving = true;
    try {
      await this.firestore
        .collection("caronas")
        .doc(this.caronaId)
        .update({
          dtPartida,
          dtChegada: dtChegada ?? null, // dtChegada definido acima
          vagas: Number(v.vagasDisponiveis) || 0,
          valor: this.parseValorDecimal(v.valorPassagem) || 0,
          origem,
          destino,
          placa: (v.placa ?? "").toString().trim().toUpperCase(),
          veiculo: v.modeloAno,
        });
      this.toastr.success("Carona atualizada com sucesso.");
    } catch (err) {
      console.error("Erro ao salvar carona:", err);
      this.toastr.error("Não foi possível salvar. Tente novamente.");
    } finally {
      this.saving = false;
    }
  }
}

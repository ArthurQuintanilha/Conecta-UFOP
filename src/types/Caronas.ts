import type firebase from "firebase/compat/app";

/** Endereço (origem/destino) de carona — documento Firestore */
export interface EnderecoCaronaDoc {
  bairro?: string;
  cep: string;
  cidade: string;
  estado: string;
  nome: string;
  numero: number;
  rua: string;
}

/** Status possível da carona */
export type StatusCarona = "ABERTA" | "FINALIZADA";

/** Veículo no documento Firestore (objeto com modelo e placa) */
export interface VeiculoCaronaDoc {
  modelo: string;
  placa: string;
}

/** Documento da collection Firestore "caronas" — campos de data são Timestamp */
export interface Carona {
  criadoEm: firebase.firestore.Timestamp;
  destino: EnderecoCaronaDoc;
  dtChegada: firebase.firestore.Timestamp | null;
  dtPartida: firebase.firestore.Timestamp;
  motoristaId: string;
  origem: EnderecoCaronaDoc;
  passageiros: string[];
  status: StatusCarona;
  vagas: number;
  valor: number;
  veiculo: VeiculoCaronaDoc;
}

/** Modelos da API Conecta UFOP (baseados no Swagger) */

export interface ErrorResponse {
  message: string;
}

export interface MessageResponse {
  message: string;
}

/** GET /users/me */
export interface AuthenticatedUserResponse {
  fotoUrl?: string | null;
  nome?: string | null;
  descricao?: string | null;
  email?: string | null;
  genero?: string | null;
  curso_ocupacao?: string | null;
  dtAniversario?: string | null;
}

/** POST /users/perfil */
export interface UploadProfileRequest {
  fotoBase64: string;
  descricao: string;
}

export interface UploadProfileResponse {
  message: string;
  fotoUrl?: string;
}

/** POST /users */
export interface CreateUserRequest {
  nome: string;
  email: string;
  senha: string;
  curso_ocupacao: string;
  dtAniversario: string;
}

export interface CreateUserResponse {
  message: string;
  id: string;
}

/** PUT /users */
export interface UpdateUserRequest {
  nome: string;
  curso_ocupacao: string;
  dtAniversario: string;
  descricao: string;
}

/** Origem/destino de carona */
export interface OrigemCarona {
  nomeLocal: string;
  cep: string;
  rua: string;
  numero: number;
  bairro: string;
  cidade: string;
  estado: string;
}

/** Tipo para campos dt da API: date-time (string) ou timestamp já convertido (Date) */
export type DateTimeLike = string | Date;

/** Veículo na resposta de carona (GET /caronas, GET /carona/{id}) */
export interface VeiculoCaronaResponse {
  modelo?: string;
  placa?: string;
  cor?: string;
  [key: string]: unknown;
}

/** POST /carona */
export interface CreateCaronaRequest {
  veiculo: { modelo: string; placa: string };
  vagas: number;
  valor: number;
  dtPartida: string;
  dtChegada: string;
  origem: OrigemCarona;
  destino: OrigemCarona;
}

export interface CreateCaronaResponse {
  message: string;
  id: string;
}

/** Item da listagem GET /caronas */
export interface ListCaronaItem {
  id: string;
  /** ID do motorista (quando enviado pela API, usado para buscar média de avaliações no Firestore). */
  motoristaId?: string;
  criadoEm?: DateTimeLike;
  motorista?: {
    nome?: string;
    notaMedia?: number;
    fotoUrl?: string | null;
  };
  veiculo?: string | VeiculoCaronaResponse;
  valor?: number;
  vagasDisponiveis?: number;
  origem?: OrigemCarona;
  destino?: Record<string, unknown>;
  dtPartida?: DateTimeLike;
  dtChegada?: DateTimeLike;
}

/** GET /caronas/minhasCaronas - Item de carona (como motorista ou passageiro).
 * Backend envia eMotorista (true = motorista, false = passageiro).
 * usuarioEhPassageiro é derivado no front como !eMotorista. */
export interface MinhasCaronasItem {
  id: string;
  /** ID do motorista da carona (API ou Firestore); usado para exibir avaliação. */
  motoristaId?: string;
  /** Enviado pela API: true = usuário é motorista, false = passageiro */
  eMotorista?: boolean;
  /** Derivado no front: true quando eMotorista === false (usuário é passageiro) */
  usuarioEhPassageiro?: boolean;
  status?: string;
  motorista?: {
    nome?: string;
    fotoUrl?: string | null;
    notaMedia?: number;
    [key: string]: unknown;
  };
  veiculo?: {
    modelo?: string;
    placa?: string;
    formatado?: string;
    [key: string]: unknown;
  };
  origem?: OrigemCarona | Record<string, unknown>;
  destino?: OrigemCarona | Record<string, unknown>;
  rota?: string;
  dtPartida?: string;
  dtChegada?: string;
  valor?: string | number;
  vagasDisponiveis?: number;
}

/** GET /caronas/minhasCaronas - Resposta completa */
export interface MinhasCaronasResponse {
  comoMotorista: MinhasCaronasItem[];
  comoPassageiro: MinhasCaronasItem[];
}

/** GET /carona/{id} */
export interface GetCaronaByIdResponse {
  criadoEm?: DateTimeLike;
  motoristaId?: string;
  motorista?: {
    id?: string;
    createdAt?: string | null;
    nome?: string;
    notaMedia?: number;
    fotoUrl?: string;
    descricao?: string | null;
    caronasCont?: number;
    perfil?: string;
  };
  veiculo?: string | VeiculoCaronaResponse;
  valor?: number;
  vagasDisponiveis?: number;
  origem?: OrigemCarona;
  destino?: Record<string, unknown>;
  dtPartida?: DateTimeLike;
  dtChegada?: DateTimeLike;
  passageiros?: Array<{
    nome?: string;
    fotoUrl?: string;
    perfil?: string;
  }>;
}

/** POST /avaliacao */
export interface CreateAvaliacaoRequest {
  caronaID: string;
  nota: number;
  comentario: string;
}

export interface CreateAvaliacaoResponse {
  id: string;
  caronaID: string;
  nota: number;
  comentario: string;
  userId: string;
  motoristaId: string;
  criadoEm?: string | null;
}

/** GET /avaliacao/{userId} */
export interface GetAvaliacoesResponse {
  usuario?: {
    id?: string;
    fotoUrl?: string;
    nome?: string;
    notaMedia?: number;
    perfil?: string;
    descricao?: string;
    createdAt?: string | null;
    contCaronas?: number;
  };
  avaliacoes?: Array<{
    nome?: string;
    fotoUrl?: string;
    createdAt?: string | null;
    nota?: number;
    comentario?: string;
  }>;
}

export interface MigrationResponse {
  message: string;
}

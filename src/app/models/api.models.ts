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

/** POST /carona */
export interface CreateCaronaRequest {
  veiculo: string;
  vagas: number;
  valor: number;
  dtPartida: string;
  dtChegada: string;
  origem: OrigemCarona;
}

export interface CreateCaronaResponse {
  message: string;
  id: string;
}

/** Item da listagem GET /caronas */
export interface ListCaronaItem {
  id: string;
  criadoEm?: string;
  motorista?: {
    nome?: string;
    notaMedia?: number;
    fotoUrl?: string | null;
  };
  veiculo?: string;
  valor?: number;
  vagasDisponiveis?: number;
  origem?: OrigemCarona;
  destino?: Record<string, unknown>;
  dtPartida?: string;
  dtChegada?: string;
}

/** GET /carona/{id} */
export interface GetCaronaByIdResponse {
  criadoEm?: string;
  motorista?: {
    createdAt?: string | null;
    nome?: string;
    notaMedia?: number;
    fotoUrl?: string;
    descricao?: string | null;
    caronasCont?: number;
    perfil?: string;
  };
  veiculo?: string;
  valor?: number;
  vagasDisponiveis?: number;
  origem?: OrigemCarona;
  destino?: Record<string, unknown>;
  dtPartida?: string;
  dtChegada?: string;
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

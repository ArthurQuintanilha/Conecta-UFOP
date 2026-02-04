import { Component, OnInit } from '@angular/core';
import { CaronasService } from '../services/caronas.service';
import { Timestamp } from "@firebase/firestore";

interface Endereco {
  cep: string;
  cidade: string;
  estado: string;
  nome: string;
  numero: number;
  rua: string;
}

interface Carona {
  id: string;
  valor: number;
  motoristaId: string;
  motorista?: {
    nome: string;
    foto?: string;
    avaliacao?: number;
  };
  veiculo: string;
  placa: string;
  origem: Endereco;
  destino: Endereco;
  dtPartida: any;
  dtChegada: any;
  vagas: number;
  passageiros: string[];
  status: string;
  criadoEm: Timestamp;
}

@Component({
  selector: 'app-caronas',
  templateUrl: './caronas.component.html',
  styleUrls: ['./caronas.component.scss']
})
export class CaronasComponent implements OnInit {
  caronas: Carona[] = [];

  constructor(private caronasService: CaronasService) { }

  async ngOnInit(){
    try {
      this.caronas = await this.caronasService.getCaronas();
      console.log(this.caronas);
    } catch (error) {
      console.error('Erro ao buscar caronas:', error);
    }
  }

  formatarEndereco(endereco: Endereco): string {
    return `${endereco.nome}, ${endereco.cidade} - ${endereco.estado}`;
  }

  formatarData(data: any): string {
    if (!data) return '';
    if (data.__time__) {
      const date = new Date(data.__time__);
      return date.toLocaleDateString('pt-BR');
    }
    if (data instanceof Date) {
      return data.toLocaleDateString('pt-BR');
    }
    return '';
  }

  formatarHora(data: any): string {
    if (!data) return '';
    if (data.__time__) {
      const date = new Date(data.__time__);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (data instanceof Date) {
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  }

  vagasDisponiveis(carona: Carona): number {
    return carona.vagas - (carona.passageiros?.length || 0);
  }
}

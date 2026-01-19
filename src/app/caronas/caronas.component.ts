import { Component } from '@angular/core';

interface Carona {
  id: number;
  preco: number;
  motorista: {
    nome: string;
    foto: string;
    avaliacao: number;
  };
  veiculo: string;
  rota: {
    origem: string;
    destino: string;
  };
  horario: string;
  data: string;
  vagasDisponiveis: number;
}

@Component({
  selector: 'app-caronas',
  templateUrl: './caronas.component.html',
  styleUrls: ['./caronas.component.scss']
})
export class CaronasComponent {
  caronas: Carona[] = [
    {
      id: 1,
      preco: 28.0,
      motorista: {
        nome: 'John Doe',
        foto: 'https://i.pravatar.cc/150?img=12',
        avaliacao: 4.5
      },
      veiculo: 'Santana Quantum 2000',
      rota: {
        origem: 'Hiper Comercial',
        destino: 'UFOP'
      },
      horario: '09:30h',
      data: 'hoje',
      vagasDisponiveis: 2
    },
    {
      id: 2,
      preco: 28.0,
      motorista: {
        nome: 'John Doe',
        foto: 'https://i.pravatar.cc/150?img=12',
        avaliacao: 4.5
      },
      veiculo: 'Santana Quantum 2000',
      rota: {
        origem: 'Hiper Comercial',
        destino: 'UFOP'
      },
      horario: '09:30h',
      data: 'hoje',
      vagasDisponiveis: 2
    },
    {
      id: 3,
      preco: 28.0,
      motorista: {
        nome: 'John Doe',
        foto: 'https://i.pravatar.cc/150?img=12',
        avaliacao: 4.5
      },
      veiculo: 'Santana Quantum 2000',
      rota: {
        origem: 'Hiper Comercial',
        destino: 'UFOP'
      },
      horario: '09:30h',
      data: 'amanhã',
      vagasDisponiveis: 2
    },
    {
      id: 4,
      preco: 28.0,
      motorista: {
        nome: 'John Doe',
        foto: 'https://i.pravatar.cc/150?img=12',
        avaliacao: 4.5
      },
      veiculo: 'Santana Quantum 2000',
      rota: {
        origem: 'Hiper Comercial',
        destino: 'UFOP'
      },
      horario: '09:30h',
      data: '18/01/25',
      vagasDisponiveis: 2
    },
    {
      id: 5,
      preco: 28.0,
      motorista: {
        nome: 'John Doe',
        foto: 'https://i.pravatar.cc/150?img=12',
        avaliacao: 4.5
      },
      veiculo: 'Santana Quantum 2000',
      rota: {
        origem: 'Hiper Comercial',
        destino: 'UFOP'
      },
      horario: '09:30h',
      data: '18/01/25',
      vagasDisponiveis: 2
    },
    {
      id: 6,
      preco: 28.0,
      motorista: {
        nome: 'John Doe',
        foto: 'https://i.pravatar.cc/150?img=12',
        avaliacao: 4.5
      },
      veiculo: 'Santana Quantum 2000',
      rota: {
        origem: 'Hiper Comercial',
        destino: 'UFOP'
      },
      horario: '09:30h',
      data: '19/01/25',
      vagasDisponiveis: 2
    },
    {
      id: 7,
      preco: 28.0,
      motorista: {
        nome: 'John Doe',
        foto: 'https://i.pravatar.cc/150?img=12',
        avaliacao: 4.5
      },
      veiculo: 'Santana Quantum 2000',
      rota: {
        origem: 'Hiper Comercial',
        destino: 'UFOP'
      },
      horario: '09:30h',
      data: '20/01/25',
      vagasDisponiveis: 2
    },
    {
      id: 8,
      preco: 28.0,
      motorista: {
        nome: 'John Doe',
        foto: 'https://i.pravatar.cc/150?img=12',
        avaliacao: 4.5
      },
      veiculo: 'Santana Quantum 2000',
      rota: {
        origem: 'Hiper Comercial',
        destino: 'UFOP'
      },
      horario: '09:30h',
      data: '20/01/25',
      vagasDisponiveis: 2
    }
  ];
}

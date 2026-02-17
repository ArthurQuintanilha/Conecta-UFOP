import { Component } from '@angular/core';

interface Carona {
  id: number;
  origem: string;
  destino: string;
  motorista: string;
  veiculo: string;
  horario: string;
  status: 'disponivel' | 'solicitada' | 'confirmada' | 'historico';
  fotoMotorista: string;
}

@Component({
  selector: 'app-minhas-caronas',
  templateUrl: './minhas-caronas.component.html',
  styleUrls: ['./minhas-caronas.component.scss']
})
export class MinhasCaronasComponent {
  abaAtiva: string = 'proximas'; // 'disponiveis' | 'proximas' | 'historico'

  todasCaronas: Carona[] = [
    { 
      id: 1, origem: 'Centro', destino: 'UFOP ICEA', motorista: 'Marcos Silva', 
      veiculo: 'Celta Prata', horario: '07:30h', status: 'disponivel', 
      fotoMotorista: 'https://i.pravatar.cc/150?u=1' 
    },
    { 
      id: 2, origem: 'República', destino: 'UFOP ICEA', motorista: 'Ana Julia', 
      veiculo: 'Onix Branco', horario: '13:15h', status: 'confirmada', 
      fotoMotorista: 'https://i.pravatar.cc/150?u=2' 
    },
    { 
      id: 3, origem: 'João Monlevade', destino: 'Nova Era', motorista: 'Ricardo', 
      veiculo: 'Civic Preto', horario: '18:00h', status: 'historico', 
      fotoMotorista: 'https://i.pravatar.cc/150?u=3' 
    }
  ];

  // Getter para filtrar as caronas baseadas na aba selecionada
  get caronasFiltradas() {
    if (this.abaAtiva === 'disponiveis') {
      return this.todasCaronas.filter(c => c.status === 'disponivel');
    } else if (this.abaAtiva === 'proximas') {
      return this.todasCaronas.filter(c => c.status === 'solicitada' || c.status === 'confirmada');
    } else {
      return this.todasCaronas.filter(c => c.status === 'historico');
    }
  }
  showToast: boolean = false;
  toastMsg: string = '';

  solicitarCarona(carona: Carona) {
    carona.status = 'solicitada';
    
    // Disparar o Toast
    this.toastMsg = `Solicitação enviada para ${carona.motorista}!`;
    this.showToast = true;

    // Esconder após 3 segundos
    setTimeout(() => {
      this.showToast = false;
    }, 3000);

    // Opcional: muda de aba após um pequeno delay
    setTimeout(() => { this.abaAtiva = 'proximas'; }, 800);
  }
}
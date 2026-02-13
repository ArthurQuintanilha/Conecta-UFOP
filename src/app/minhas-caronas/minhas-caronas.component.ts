import { Component } from '@angular/core';

@Component({
  selector: 'app-minhas-caronas',
  templateUrl: './minhas-caronas.component.html',
  styleUrls: ['./minhas-caronas.component.scss']
})
export class MinhasCaronasComponent {
  caronas = [
    { id: 1, destino: 'ICEA - João Monlevade', motorista: 'João', vagas: 3 },
    { id: 2, destino: 'Nova Era', motorista: 'Maria', vagas: 2 }
  ];
}

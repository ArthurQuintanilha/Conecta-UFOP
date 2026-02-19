import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-avaliar-carona',
  templateUrl: './avaliar-carona.component.html',
  styleUrls: ['./avaliar-carona.component.scss']
})
export class AvaliarCaronaComponent {

  // @Output permite avisar ao componente pai que o modal deve fechar
  @Output() close = new EventEmitter<void>();

  reviews = [
    {
      userName: 'Karina',
      rating: 4.5,
      date: '28/01/2026 às 15:26',
      comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus bibendum arcu et metus iaculis ullamcorper. Suspendisse efficitur augue sed sem posuere pulvinar.',
      avatar: 'assets/avatar-karina.jpg'
    },
    {
      userName: 'Karina',
      rating: 4.5,
      date: '28/01/2026 às 15:26',
      comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus bibendum arcu et metus iaculis ullamcorper.',
      avatar: 'assets/avatar-karina.jpg'
    },
    {
      userName: 'Karina',
      rating: 4.5,
      date: '28/01/2026 às 15:26',
      comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      avatar: 'assets/avatar-karina.jpg'
    }
  ];

  constructor() {}

  onClose(): void {
    this.close.emit(); // Emite o evento para o componente que chamou este dialog
  }
}
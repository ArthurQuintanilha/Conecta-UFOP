import { Component } from '@angular/core';

@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.component.html',
  styleUrls: ['./recuperar-senha.component.scss']
})
export class RecuperarSenhaComponent {
  email: string = '';       // armazena o email digitado
  mensagem: string = '';    // armazena mensagem de retorno

  enviarEmail() {
    // Aqui você colocaria a lógica de envio de email via Firebase
    // Por enquanto, apenas exibe uma mensagem simulada
    if (this.email) {
      this.mensagem = `Instruções enviadas para ${this.email}`;
    } else {
      this.mensagem = 'Digite um e-mail válido.';
    }
  }
}

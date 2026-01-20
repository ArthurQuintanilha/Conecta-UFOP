import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  usuario = {
    email: '',
    senha: ''
  };

  fazerLogin(){
    console.log('Tentando logar com:', this.usuario);
    if(this.usuario.email==='aluno@ufop.br' && this.usuario.senha === '123'){
      alert('login realizado com sucesso');
    }else{
      alert('usuario ou senha invalidos.');
    }
  }
}

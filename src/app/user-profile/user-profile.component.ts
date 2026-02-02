import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  user = {
    nome: '',
    email: '',
    genero: 'male',
    descricao: '',
    fotoUrl: 'assets/default-avatar.png'
  };

  //variáveis para o controle do aviso customizado
  exibirAviso = false;
  mensagemAviso = '';

  ngOnInit(): void {
    console.log('Perfil Conecta UFOP carregado.');
  }

  mostrarErro(mensagem: string) {
    this.mensagemAviso = mensagem;
    this.exibirAviso = true;
    
    //esconde o aviso automaticamente após 5 segundos
    setTimeout(() => {
      this.exibirAviso = false;
    }, 5000);
  }

  //validação básica usando toast
  alterarUser() {
    if (!this.user.nome || !this.user.email) {
      this.mostrarErro('Preencha os campos obrigatórios (*).');
      return;
    }

    if (!this.user.email.includes('@aluno.ufop.edu.br')) {
      this.mostrarErro('Use um e-mail institucional da UFOP.');
      return;
    }

    console.log('Dados salvos:', this.user);
    this.mensagemAviso = 'Perfil atualizado com sucesso! 🎉';
    this.exibirAviso = true;
    setTimeout(() => this.exibirAviso = false, 3000);
  }
  acionarInputArquivo() {
    this.fileInput.nativeElement.click();
  }
  //preview da foto escolhida
  aoMudarFoto(event: any) {
    const arquivo = event.target.files[0];
    if (arquivo) {
      const reader = new FileReader();
      reader.onload = () => {
        this.user.fotoUrl = reader.result as string;
      };
      reader.readAsDataURL(arquivo);
    }
  }

  voltar() {
    window.history.back();
  }
}
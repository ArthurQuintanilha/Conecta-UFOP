import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { AngularFireModule } from "@angular/fire/compat";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { ToastrModule } from "ngx-toastr";
import { environment } from "../environments/environment";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login/login.component";
import { CadastroComponent } from "./cadastro/cadastro.component";
import { CaronasComponent } from "./caronas/caronas.component";
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from "./footer/footer.component";
import { PerfilComponent } from "./perfil/perfil.component";
import { RecuperarSenhaComponent } from "./recuperar-senha/recuperar-senha.component";
import { MinhasCaronasComponent } from "./minhas-caronas/minhas-caronas.component";

import { CadastrarCaronaComponent } from "./cadastrar-carona/cadastrar-carona.component";
import { ChatComponent } from "./chat/chat.component";
import { AvaliarCaronaComponent } from './avaliar-carona/avaliar-carona.component';
import { DetalhesCaronaComponent } from './detalhes-carona/detalhes-carona.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CadastroComponent,
    CaronasComponent,
    HeaderComponent,
    FooterComponent,
    PerfilComponent,
    RecuperarSenhaComponent,
    MinhasCaronasComponent,
    CadastrarCaronaComponent,
    ChatComponent,
    AvaliarCaronaComponent,
    DetalhesCaronaComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: "toast-top-right",
      preventDuplicates: true,
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { CadastroComponent } from "./cadastro/cadastro.component";
import { CaronasComponent } from "./caronas/caronas.component";
import { PerfilComponent } from "./perfil/perfil.component";
import { MinhasCaronasComponent } from "./minhas-caronas/minhas-caronas.component";
import { RecuperarSenhaComponent } from "./recuperar-senha/recuperar-senha.component";
import { CadastrarCaronaComponent } from "./cadastrar-carona/cadastrar-carona.component";
import { ChatComponent } from "./chat/chat.component";
import { AuthGuard } from "./guards/auth.guard";
import { NonAuthGuard } from "./guards/non-auth.guard";
import { AvaliarCaronaComponent } from "./avaliar-carona/avaliar-carona.component";
import { EditarCaronaComponent } from "./editar-carona/editar-carona.component";
import { DetalhesCaronaComponent } from "./detalhes-carona/detalhes-carona.component";

const routes: Routes = [
  { path: "", redirectTo: "/login", pathMatch: "full" },

  { path: "login", component: LoginComponent, canActivate: [NonAuthGuard] },
  {
    path: "cadastro",
    component: CadastroComponent,
    canActivate: [NonAuthGuard],
  },
  {
    path: "recuperar-senha",
    component: RecuperarSenhaComponent,
    canActivate: [NonAuthGuard],
  },
  { path: "caronas", component: CaronasComponent },

  {
    path: "minhas-caronas",
    component: MinhasCaronasComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "cadastrar-carona",
    component: CadastrarCaronaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "editar-carona/:id",
    component: EditarCaronaComponent,
    canActivate: [AuthGuard],
  },
  { path: "perfil", component: PerfilComponent, canActivate: [AuthGuard] },
  { path: "chat", component: ChatComponent, canActivate: [AuthGuard] },
  { path: "avaliar-carona", component: AvaliarCaronaComponent },
  { path: "detalhes-carona/:id", component: DetalhesCaronaComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

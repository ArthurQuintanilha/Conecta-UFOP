# Conecta UFOP 🚗

> Plataforma web de caronas voltada para a comunidade acadêmica da Universidade Federal de Ouro Preto (UFOP)

## Sobre o Projeto 📝

O **Conecta UFOP** é uma plataforma web que conecta motoristas e passageiros da comunidade acadêmica da UFOP, facilitando o compartilhamento de trajetos até o campus do **ICEA**. 

O sistema promove uma mobilidade mais **sustentável**, **econômica** e **colaborativa**, reduzindo custos de transporte e incentivando o uso coletivo de veículos entre estudantes e servidores da universidade.

## Objetivos 🎯

- Facilitar o transporte entre estudantes e servidores da UFOP
- Reduzir custos de deslocamento para o campus
- Incentivar o uso coletivo de veículos
- Promover mobilidade sustentável na comunidade acadêmica

## Tecnologias 🦾

- **Angular** - Framework frontend
- **Firebase** - Backend como serviço (Authentication, Firestore, Clound Functions, Hosting)

## Funcionalidades Principais ⚙️

### Autenticação e Perfil
- Cadastro de usuários
- Login e logout
- Edição de dados pessoais
- Recuperação de senha
- Gerenciamento de perfil

### Sistema de Caronas 🚗
- **Fornecimento de caronas**: Motoristas podem oferecer trajetos
- **Solicitação de caronas**: Passageiros podem solicitar caronas
- **Aceitação/Recusa**: Motoristas podem aceitar ou recusar solicitações
- **Cancelamento**: Usuários podem cancelar suas solicitações
- **Visualização de motoristas disponíveis**: Lista de motoristas com caronas disponíveis

### Avaliações ✅
- Sistema de avaliação bidirecional:
  - Motorista → Caroneiro
  - Caroneiro → Motorista

### Comunicação 💬
- Chat interno para comunicação entre usuários

### Histórico e Gestão 🗒️
- Visualização de histórico de caronas
- Visualização de solicitações de carona realizadas para uma viagem

## Backlog do Produto

- [ ] Como usuário, eu gostaria de pedir uma carona
- [ ] Como usuário, eu gostaria de fornecer uma carona
- [ ] Como usuário, eu gostaria de aceitar ou recusar um pedido de carona
- [ ] Como usuário, eu gostaria de editar e deletar minhas solicitações
- [ ] Como usuário, eu gostaria de visualizar os motoristas disponíveis para carona
- [ ] Como usuário, eu gostaria de visualizar as solicitações de carona realizadas para uma viagem
- [ ] Como usuário, eu gostaria de me cadastrar no sistema e ter uma página de perfil
- [ ] Como usuário, eu gostaria de avaliar as minhas caronas
- [ ] Como usuário, eu gostaria de visualizar meu histórico de caronas
- [ ] Como usuário, eu quero trocar mensagens com outros usuários pelo chat interno

---

## Backlog da Sprint

### História #1 – Cadastro e perfil do usuário

**Como usuário, eu gostaria de me cadastrar no sistema e ter uma página de perfil.**

#### Critérios de aceitação

- O cadastro deve ser feito usando o e-mail institucional da UFOP
- O usuário pode editar suas informações pessoais
- O perfil exibe o histórico de caronas e avaliações do usuário

#### Tarefas 📌

- Configurar Firebase Authentication (login com e-mail/senha e validação do domínio @ufop.edu.br)
- Criar estrutura de usuário no Firestore (coleção users)
- Implementar tela de login/cadastro em Angular
- Criar página de perfil do usuário e integração com Firestore

---

### História #2 – Oferecer e gerenciar caronas

**Como usuário, eu gostaria de fornecer uma carona e gerenciar as caronas que criei.**

#### Critérios de aceitação

- O usuário pode criar uma carona informando origem, destino, horário e vagas
- O usuário pode editar ou deletar suas caronas
- As caronas criadas aparecem nas buscas para outros usuários

#### Tarefas 📌

- Criar coleção rides no Firestore com dados das caronas
- Implementar telas de criação, edição e exclusão de caronas no Angular
- Exibir lista de "Minhas Caronas" para o usuário logado
- Garantir que apenas o criador da carona possa editá-la ou removê-la

---

### História #3 – Solicitar e aceitar caronas

**Como usuário, eu gostaria de pedir uma carona e o motorista gostaria de aceitar ou recusar o pedido.**

#### Critérios de aceitação

- O usuário pode solicitar uma carona existente
- O motorista recebe a solicitação e pode aceitar ou recusar
- O passageiro visualiza o status da solicitação
- O motorista pode visualizar todas as solicitações para cada viagem

#### Tarefas 📌

- Criar coleção requests no Firestore para armazenar pedidos de carona
- Implementar interface de solicitação e resposta (aceitar/recusar)
- Exibir status de cada solicitação (pendente, aceita, recusada)
- Integrar com a lista de caronas e perfis de usuários

---

### História #4 – Chat e comunicação

**Como usuário, quero trocar mensagens com outros usuários pelo chat interno.**

#### Critérios de aceitação

- O chat permite troca de mensagens entre motorista e passageiro
- As mensagens aparecem em tempo real
- O histórico da conversa é salvo e pode ser visualizado depois

#### Tarefas 📌

- Configurar Firebase Realtime Database para armazenar as mensagens
- Criar interface de chat em Angular com atualização em tempo real
- Exibir notificações visuais de novas mensagens
- Associar as conversas às caronas ou solicitações

---

### História #5 – Avaliação e histórico de caronas

**Como usuário, eu gostaria de avaliar minhas caronas e visualizar meu histórico de viagens.**

#### Critérios de aceitação

- O usuário pode avaliar o motorista e/ou passageiros após uma viagem
- As avaliações são salvas no perfil do usuário
- O histórico de caronas exibe viagens anteriores com data e status

#### Tarefas 📌

- Criar coleção reviews no Firestore para armazenar as avaliações
- Implementar tela de histórico de viagens e formulário de avaliação
- Exibir avaliações médias nos perfis dos usuários
- Conectar a tela de histórico ao perfil do usuário logado

---

### Observações gerais

- Todas as funcionalidades utilizam Firebase como backend (Auth, Firestore e Realtime Database)
- O frontend é totalmente implementado em Angular (HTML, CSS, TypeScript)
- O projeto pode ser hospedado diretamente no Firebase Hosting
- As histórias cobrem todas as principais funcionalidades do sistema e distribuem bem as tarefas entre os membros

---

## Equipe 👥

### Fullstack
- **👨🏻‍💻 Arthur Quintanilha 24.1.8064**
- **👨🏻‍💻 Adryan Martins 24.1.8072**

### Backend
- **👨🏻‍💻 Talles Lima 24.1.8057** 
- **👨🏻‍💻 Mateus Peixoto 24.1.8060** 

### Frontend
- **👨🏽‍💻 Lucas Caixeta 24.1.8065** 
- **👩🏻‍💻 Christiane Giestas 24.1.8071** 

---

## 🔗 Links Úteis

Acompanhe também: 

- **Backend (API):** [Repositório no GitHub](https://github.com/ArthurQuintanilha/conecta-ufop-backend.git)
- **Protótipos (Design):** [Projeto no Figma](https://www.figma.com/design/ZfC7qHVXzI8CoXiLLALVLT/Conecta-UFOP?node-id=0-1&t=lNsGxbOKnYaZsUgN-1)
- **Diagramas UML:** [Pasta no Drive](https://drive.google.com/drive/folders/1rWb60OV3qecViAoZ159EBYQEI9luDLnJ?usp=sharing)
- **Gerenciamento de tarefas:** [Quadro no Trello](https://trello.com/invite/b/6910c5f7ceb11383ae405f6a/ATTI0e3a6863da4a5d147d50e8fc0d70972614598756/eng-software)

---

# Cleaning SaaS Platform

Você é um desenvolvedor sênior especialista em **SaaS escalável**, com domínio em **React.js com TypeScript (frontend)** e **Node.js com Express e TypeScript (backend)**, aplicando arquitetura limpa, tipagem forte e boas práticas de desenvolvimento. Sua tarefa é criar uma aplicação completa, profissional e pronta para produção de um sistema SaaS para empresas de limpeza (House Cleaning).

---

# CRITICAL

Leia todo o arquivo antes de executar a requisição.
Atenção às requisições marcadas como: OBRIGATÓRIO

---

# OBJETIVO

Criar um sistema SaaS multi-tenant onde tenants (assinantes) possam:

- Configurar seus preços
- Receber orçamentos automáticos
- Receber agendamentos
- Gerenciar usuários (CRM simples)
- Automatizar comunicação
- Acompanhar métricas
- Personalizar sua marca (white-label)

---

# INTERNACIONALIZAÇÃO

## Idiomas suportados:

- Português (PT-BR)
- Inglês (EN)
- Espanhol (ES)

## Requisitos:

- Sistema de tradução (i18n)
- Arquivos JSON por idioma
- Detecção automática + opção manual

---

# 💱 MOEDAS

- USD ($)
- BRL (R$)

## Regras:

- Cada tenant define sua moeda padrão
- NÃO realizar conversão automática
- Apenas formatação correta por moeda

---

# 🧱 ARQUITETURA

## FRONTEND

- React.js + TypeScript
- Pasta `/frontend`
- Tipagem forte para componentes, props e estados
- Uso de hooks tipados
- Responsivo (mobile-first)
- UI moderna estilo SaaS

## BACKEND

- Node.js + Express + TypeScript
- Pasta `/backend`
- API REST
- Tipagem para:
  - Requests e Responses
  - Models
  - Services
- Autenticação JWT
- Recuperação de senha, verificação de e-mail e expiração de token
- Roles: admin (dono do SaaS), tenant (assinante), staff (colaborador subordinado ao tenant), user (usuário final)

## BANCO DE DADOS

- PostgreSQL (prioritário) ou MongoDB como alternativa
- Modelo de dados multi-tenant com `tenantId` em entidades compartilhadas
- Estratégia de isolamento: banco único com schemas/tabelas separadas ou coluna `tenantId`
- Uso de ORM com suporte a TypeScript:
  - Prisma (recomendado) ou Sequelize

## COMUNICAÇÃO FRONT ↔ BACK

- Uso de interfaces compartilhadas (DTOs)
- Padronização de respostas da API
- Tratamento de erros tipado

## COMPARTILHAMENTO DE TIPOS (RECOMENDADO)

- Criar uma pasta `/shared` na raiz do projeto
- Centralizar tipos e interfaces utilizados por frontend e backend
- Garantir consistência entre dados enviados e recebidos
- Evitar divergência de estrutura entre API e interface

Exemplos:

- Tipos de usuário
- Estrutura de orçamento
- Modelos de agendamento
- Status (enums)

## BOAS PRÁTICAS TYPESCRIPT

- Interfaces e types bem definidos
- Separação de camadas (controller, service, model)
- Evitar uso de `any`
- Uso de enums para valores fixos

## 🌐 ROTEAMENTO E MULTI-TENANT

O sistema deve suportar arquitetura multi-tenant baseada em rotas dinâmicas.

### Rotas públicas:

- `/` → Landing institucional do SaaS
- `/login` → Login global
- `/app` → Redirecionamento automático baseado no role

### Rotas do Admin:

- `/admin/dashboard`
- `/admin/tenants`
- `/admin/analytics`

### Rotas do Tenant (white-label):

- `/t/:tenantSlug` → Landing da empresa (logo, cores, descrição, contato)
- `/t/:tenantSlug/orcamento` → Início do fluxo de orçamento
- `/t/:tenantSlug/orcamento/agendar`
- `/t/:tenantSlug/orcamento/pagamento`
- `/t/:tenantSlug/orcamento/confirmacao`

### Rotas internas do Tenant:

- `/t/:tenantSlug/dashboard`
- `/t/:tenantSlug/services`
- `/t/:tenantSlug/crm`
- `/t/:tenantSlug/scheduling`
- `/t/:tenantSlug/team`
- `/t/:tenantSlug/settings`

### Rotas da equipe (staff):

- `/t/:tenantSlug/staff/agenda`
- `/t/:tenantSlug/staff/tasks`

---

## Regras obrigatórias:

- Isolamento total entre tenants
- Identificação via `tenantSlug`
- Controle de acesso por role (RBAC)
- Separação entre interface pública e autenticada
- Estrutura preparada para white-label

---

# 🔐 MULTI-TENANT

Cada tenant deve ter:

- Login e senha
- Dados isolados
- Identificação única por `tenantId`
- Acesso via rota de empresa ou subdomínio configurável (ex: meudominio.com/tenant)
- Tenant-aware em todas as APIs e no frontend
- Dados separados por `tenantId` em cada registro
- Página pública para contratação/agendamento: meudominio.com/tenant

---

# 👨‍💼 PAINEL ADMIN (DONO DO SAAS)

- Gestão de tenants:
  - Nome
  - Tipo de plano
  - Data de início
  - Vencimento
  - Status
  - Gateway ativo (Sim/Não)
  - Tipo (manual/automático)
  - Risco operacional
- Histórico de tenants
- Logs de atividade
- Analytics:
  - Número de tenants
  - Receita estimada
  - Taxa de uso
  - Status de onboarding

---

# 👤 PAINEL TENANT (ASSINANTE)

## Personalização:

- Nome da empresa
- Logo
- Cores
- Contato
- Redes sociais
- Endereço (Google Maps)

## Precificação:

- Valor por m²:
  - Limpeza padrão
  - Limpeza pesada
  - Pós-obra
  - Escritório

- Extras:
  - Vidros
  - Carpetes
  - Estofados

- Campo adicional:
  - Pets
  - Limpeza de piscina
  - Higienização de colchão
  - Organização de armário
  - "Outros" (customizável)

- Taxa de deslocamento
- Valor mínimo

## Serviços Personalizados (CRUD)

- Criar novos serviços
- Editar/remover serviços
- Definir preço por m² ou valor fixo
- Campo livre "Outros"

## Regras Inteligentes:

- Desconto por área grande
- Multiplicador por tipo
- Adicional fim de semana

## CRM:

- Armazenar usuários
- Histórico de orçamentos
- Status:
  - Pendente
  - Aprovado
  - Cancelado
  - Expirado (após 24h sem confirmação de pagamento)

## Analytics:

- Número de agendamentos
- Conversão
- Receita gerada
- Serviços mais solicitados

---

# 🧱 GESTÃO DE EQUIPE (TENANT)

## Tipos de Usuário Interno

### Dono (Tenant)
- Acesso total ao sistema
- Gerencia configurações gerais
- Controla pagamentos e integrações
- Gerencia equipe (CRUD de staff)
- Visualiza todos os logs de atividade

### Colaborador (Staff)
- Acesso restrito, focado em operação diária
- Restrições determinadas por permissions-based model

## Permissões do Staff (Colaborador)

### ✅ Permissões Permitidas:
- Confirmar ou cancelar agendamentos (manuais)
- Criar e editar agenda do tenant
- Enviar mensagens manuais (confirmação de pagamento/agendamento)
- Visualizar histórico de clientes:
  - Nome, telefone, e-mail
  - Endereço, referências geográficas
  - Histórico de agendamentos passados
  - **Excluído**: dados financeiros, valores de orçamentos, métodos de pagamento
- Gerar novos orçamentos:
  - Usar regras de preço já configuradas pelo tenant
  - Não alterar configurações de preço
  - Visualizar resultado final do orçamento
  - Enviar para usuário final
- Visualizar dashboard operacional:
  - Agendamentos do dia/semana
  - Taxa de confirmação
  - **Excluído**: receita, métricas financeiras

### ❌ Permissões Bloqueadas:
- Alterar dados da empresa
- Modificar formas de pagamento
- Configurar ou acessar integrações (ex: Stripe, Google Maps)
- Acessar dados financeiros sensíveis:
  - Valores de orçamentos
  - Histórico financeiro do tenant
  - Dados de pagamento de usuários
- Modificar regras de preços e serviços
- Gerenciar outros staff
- Acessar ou modificar configurações gerais
- Exportar dados (exceto dados não-sensíveis por staff)

## Gerenciamento de Staff

### Cadastro Manual de Staff (Dono apenas):
- Tenant acessa painel "Gerenciar Equipe"
- Clica em "Adicionar Staff"
- Insere manualmente:
  - Nome completo
  - E-mail (verificação de e-mail obrigatória)
  - Telefone (opcional)
  - Permissões (checkboxes ou flags)
- Tenant define primeira senha (autogenerada ou inserta manualmente)
  - **Senha forte obrigatória**: mínimo 8 dígitos, com números, letras maiúsculas/minúsculas e caracteres especiais
  - Lembrete: "A senha deve conter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos especiais"
- Sistema envia e-mail com credenciais (e-mail + senha temporária)
- Staff faz login com e-mail + senha temporária
- **Primeira autenticação**: Deve ativar 2FA (obrigatório)
  - Escanear QR code do Google Authenticator
  - Salvar backup codes
  - Confirmar com código 6 dígitos

### Exclusão Manual de Staff:
- Tenant seleciona staff na lista
- Clica "Remover Staff"
- Confirmação com checkbox "Tenho certeza"
- Staff é soft-deleted (apenas acesso cortado, dados e logs mantidos)
- Sessão do staff é terminada imediatamente
- Logs históricos preservados
- **Log do tenant**: Registrar ação de criação/remoção de staff (quem, quando, staff afetado)

### Convite e Onboarding:
- Enviar convite via e-mail
- Link único de ativação com expiração (24h)
- Nova staff define sua própria senha
- Confirmação de e-mail obrigatória

## Controle de Acesso (RBAC)

### Implementação:
- Implementar controle baseado em papéis (RBAC)
- Validar permissions em **todas as rotas** e **ações**
- Garantir isolamento de permissões por tenant
- Usar permission flags (bits) para granularidade:
  - `CONFIRM_SCHEDULE` (confirmar agendamento)
  - `SEND_MESSAGE` (enviar mensagem)
  - `VIEW_CUSTOMERS` (visualizar clientes)
  - `CREATE_QUOTE` (gerar orçamento)
  - Exemplo: staff com flags `0b0111` = 3 primeiras permissões

### Middleware de Autenticação/Autorização:
- Validar JWT token
- Verificar role (tenant vs staff)
- Verificar permission flags para action específica
- Rejeitar com HTTP 403 se sem permissão

## Logs de Atividade do Staff

### Registrar Ações:
- Confirmações de agendamento (agendamento ID, novo status)
- Cancelamentos (agendamento ID, motivo se fornecido)
- Envio de mensagens (user ID, tipo de mensagem, conteúdo resumido)
- Geração de orçamentos (user ID, valor, serviços selecionados)
- Login/logout
- Modificações em agenda

### Estrutura de Log:
- `staffId`: ID do colaborador
- `tenantId`: ID do tenant (isolamento)
- `action`: tipo de ação (enum)
- `resourceType`: tipo de recurso afetado (schedule, message, quote)
- `resourceId`: ID do recurso
- `timestamp`: quando aconteceu
- `ipAddress`: IP do login
- `userAgent`: navegador/app
- `details`: dados adicionais (JSON)

### Acesso aos Logs:
- Dono (tenant) pode visualizar todos os logs do tenant
- Staff pode visualizar apenas seus próprios logs
- Admin pode visualizar logs de todos os tenants
- Filtrar por: data, staff, tipo de ação, recurso
- Exportar logs (para dono)

## Segurança do Staff

### Proteção de Dados Críticos:
- Nunca retornar valores de orçamento, preços ou dados financeiros em responses para staff
- Sanitizar histórico de cliente (remover valores)
- Usar sub-permissões para VIEW_CUSTOMERS:
  - `VIEW_CUSTOMER_BASIC` (nome, contato, endereço)
  - `VIEW_CUSTOMER_HISTORY` (agendamentos passados)
  - Nunca incluir valores de pagamento
- Validação de permissão em **nível de query** (não trocar dados na aplicação)

### Sessão e Expiração:
- JWT token expira em 8 horas
- Logout automático ao mudar tenant context
- Sessão terminada se staff for desativado
- Rate limiting em login (máx 5 tentativas/5min)

### Auditoria de Risco:
- Alertar admin se staff:
  - Tenta acessar recurso sem permissão (HTTP 403)
  - Realiza múltiplas ações incomuns em pouco tempo
  - Acessa dados de múltiplos tenants (violação)
- Log de tentativas de acesso não-autorizado

---

# 👤 INTERFACE DO USUÁRIO (USER)

## Simulador:

- Tipo de imóvel
- Tipo de limpeza
- Área (m²)
- Quartos / banheiros
- Extras
- Serviços personalizados
- Campo "Outros"
- Endereço (autocomplete)

## Resultado:

- Exibir apenas valor final
- Mensagem:
  "Valor estimado. Pode variar após avaliação."

## Autenticação do Usuário Final

### Simulação e Orçamento (Anônimo):
- User pode acessar todo simulador SEM login
- Não requer e-mail/cadastro
- Resultado final exibe "Continuar para Agendamento → Login Obrigatório"

### Confirmação de Agendamento (LOGIN OBRIGATÓRIO):
- User deve fazer login/cadastro **somente na tela de confirmação**
- **Dados preenchidos anteriormente são preservados** (endereço, tipo de limpeza, área, etc.)
- Duas opções:
  
  **Opção 1: Social Login (Recomendado)**
  - Google Sign-In
  - Facebook Sign-In
  - Apple Sign-In (opcional)
  - Fluxo OAuth automático
  - Extrai e-mail, nome, foto (opcional)
  - Cadastro automático se primeira vez
  - Sensível à privacidade: pedir consentimento LGPD

  **Opção 2: Login Manual (Fallback)**
  - E-mail + Senha
  - Telefone + Código SMS (opcional)
  - Verificação de e-mail obrigatória (link ou código)
  - Sem 2FA obrigatória (simplificar UX)
  - **Senha forte obrigatória**: mínimo 8 dígitos, com números, letras maiúsculas/minúsculas e caracteres especiais
  - Lembrete: "A senha deve conter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos especiais"

### Fluxo de Agendamento:
1. User preenche simulador (anônimo)
2. Clica "Confirmar Agendamento"
3. Modal aparece: "Confirme seus dados"
4. Exibe: [Login com Google] [Login com Facebook] [Login Manual]
5. User escolhe método
6. Se social login: dados auto-preenchidos
7. Se manual: cadastra e-mail, cria senha, verifica e-mail
8. Após autenticação: volta ao agendamento com dados preenchidos
9. User completa: data, horário, recorrência
10. Confirmação enviada por e-mail

### Dados do User:
- Nome (obrigatório)
- E-mail (obrigatório)
- Telefone (obrigatório para contato)
- Endereço (obrigatório)
- Foto (opcional, de social login)

### Consentimento LGPD (na confirmação):
- "Li e concordo com a Política de Privacidade"
- "Autorizo contato para confirmação/lembretes"
- Registro de consentimento com timestamp e IP

---

# 📅 AGENDAMENTO

- Data
- Horário
- Recorrência:
  - Único
  - Semanal
  - Quinzenal
  - Mensal

---

# 📲 AUTOMAÇÃO E COMUNICAÇÃO

## Comunicação tenant/user:

- Apenas sentido tenant/user (nunca o inverso)
- Mensagens editáveis:
  - Automática quando com integração com gateway (orçamento, confirmação de agendamento, lembrete)
  - Manual quando sem integração com gateway (somente no âmbito de confirmação de pagamento/agendamento, sem bate-papo)

## Chat interno:
- Apenas entre admin e tenant (suporte)
- Envio de mensagens automáticas ou manuais (tenant para user) realizado por staff conforme permissões
- Sem tempo real
- Registro de mensagens
- Histórico acessível
- Logs de quem enviou cada mensagem (auditoria de staff)

---

# 💳 PAGAMENTOS

- Integração com gateway de pagamento (Stripe obrigatório/primário)
- Pagamento recorrente para planos SaaS
- Pagamento único para setup e serviços opcionais
- Segurança PCI compliance básica (tokenização, sem armazenar dados do cartão)

## Para tenants (SaaS):

- Plano mensal (0 staff inclusos)
- Plano semestral (até 3 staff inclusos)
- Plano anual (até 10 staff inclusos)
- Trial gratuito de 7 dias (0 staff)
- Pagamento único (setup opcional)

## Limite de Staff por Plano:

- **Plano Mensal**: 0 staff (apenas tenant)
- **Plano Semestral**: até 3 staff
- **Plano Anual**: até 10 staff
- Adicionar 1 staff extra: tarifa adicional mensal
- Upgrade automático de plano: tentar adicionar staff além do limite oferece opção de upgrade

**Staff (Colaborador)**: Membro da equipe do tenant com acesso restrito para operações diárias

## Para usuários finais:

- Pagamento simples do serviço (sem split)
- Integração básica com gateway de pagamento
- Cobrança opcional após aprovação do orçamento

## Fluxo híbrido:

- Automatizado: com gateway
- Manual: sem gateway (controle manual, registro manual, modal obrigatório avisando responsabilidade total do tenant)

---

# 📊 DASHBOARD

- Total de orçamentos
- Taxa de conversão
- Receita estimada
- Serviços mais solicitados

---

# 🛠️ QUALIDADE & INFRAESTRUTURA

- Testes unitários e de integração
- Validação de dados no backend e frontend
- Logging e monitoramento básico
- Deploy orientado a cloud (Vercel/Netlify para frontend, Heroku/Render/AWS para backend)
- CI/CD simples para build e deploy

---

# 🔁 RECORRÊNCIA

Suporte completo para serviços recorrentes
Lembrar último pedido do usuário

---

# 🗺️ GOOGLE MAPS

- Autocomplete de endereço
- Cálculo simples de distância

---

# 🔔 NOTIFICAÇÕES INTERNAS

- Novo orçamento
- Novo agendamento

---

# 📥 EXPORTAÇÃO

- Exportar dados em CSV/Excel

---

## 🎨 WHITE-LABEL (TENANT)

Cada tenant deve possuir:

- Landing própria em `/t/:tenantSlug`
- Personalização de:
  - Logo
  - Cores
  - Nome da empresa
- Link público para divulgação
- CTA levando para `/orcamento`

---

# 🔒 LGPD E PRIVACIDADE

- Consentimento obrigatório (checkbox)
- Política de privacidade acessível
- Registro de consentimento (data, IP)
- Direito de exclusão de dados
- Portabilidade de dados
- Transparência no uso de dados
- Opção de opt-out (EUA)
- Criptografia básica de dados sensíveis
- Controle de acesso por nível

---

# 🛡️ SEGURANÇA

## Autenticação
- Autenticação segura via JWT
- Hash seguro de senhas (bcrypt com salt)
- Verificação de e-mail obrigatória
- Recuperação de senha com token temporário (1 hora)
- **Senhas fortes obrigatórias para todos os níveis** (admin, tenant, staff, user):
  - Mínimo 8 dígitos
  - Deve conter: números, letras maiúsculas, letras minúsculas, caracteres especiais
  - Lembrete: "A senha deve conter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos especiais"
  - Validação em tempo real no frontend
  - Rejeitar senhas fracas com mensagem explicativa
- 2FA opcional para tenant/admin (biblioteca speakeasy)
- **2FA obrigatória para staff** (não opcional) - aumenta segurança de dados críticos do tenant
  - Usar Google Authenticator, Microsoft Authenticator ou Authy
  - Fluxo:
    1. Staff faz login com e-mail + senha
    2. Sistema exibe QR code (específico do staff)
    3. Staff escaneia com app autenticador
    4. Sistema solicita código 6 dígitos
    5. Staff confirma e gera 10 backup codes
    6. Acesso liberado apenas após confirmação
  - Backup codes:
    - Importante para recuperação de acesso
    - Mostrar durante setup para armazenar em local seguro
    - Cada código é válido apenas 1 vez
  - Redefinir 2FA:
    - Apenas tenant pode resetar 2FA do staff
    - Requer autenticação do tenant
    - Staff perde acesso até novo setup

## Autorização por Perfil (RBAC)
- **Admin** (dono do SaaS):
  - Acesso total ao painel de administração
  - Gestão de tenants
  - Acesso a logs globais
  - Suporte a tenants

- **Tenant** (Dono da Empresa):
  - Acesso total ao painel do tenant
  - Configurações, preços, serviços
  - Gestão de staff
  - Visualização de todos os dados e logs
  - Integrações de pagamento

- **Staff** (Colaborador):
  - Acesso restrito via permission flags
  - Operações diárias (agendamentos, mensagens)
  - Sem acesso a dados financeiros ou configurações

- **User** (Usuário Final):
  - Acesso público/anônimo à página de contratação
  - Engenharia de orçamentos e agendamentos

## Validação de Permissões
- Validar permissions em **todas as rotas** (middleware)
- Usar permission flags (bitwise) para granularidade
- Exemplo de implementação:
  ```typescript
  // Staff pode confirmar agendamento?
  const canConfirm = (staff.permissions & PermissionFlag.CONFIRM_SCHEDULE) !== 0;
  // Bloquear se sem permissão
  if (!canConfirm) return res.status(403).json({ error: 'Forbidden' });
  ```
- Validação em nível de query (não retornar dados sensíveis)

## Proteção contra Ataques Comuns
- Validação de inputs (XSS prevention)
- Proteção contra SQL injection (usar Prisma/ORM)
- Rate limiting em endpoints críticos
- CSRF tokens para ações sensíveis
- CORS configurado por tenant
- Headers de segurança (CSP, X-Frame-Options, etc)

## Logs de Acesso
- Registrar todos os logins/logouts
- Log de tentativas falhadas de acesso
- Auditoria de ações críticas (mudança de preços, integração com Stripe)
- Retenção de logs por 1 ano
- Correlate logs com IP e user agent

---

# 📁 ESTRUTURA DE PASTAS

- /frontend
  - /components
  - /hooks
  - /services
  - /styles
  - /public
- /backend
  - /integrations
  - /services
  - /utils
- /shared (tipos e interfaces)
- /admin (painel admin)
- /tenant (painel tenant)
- /user (interface user)

---

# 📋 ONBOARDING DO TENANT

- Dados pessoais e empresariais
- Nome da empresa (utilizado para geração automática do slug)
- Logo da empresa (upload)
- Descrição da empresa (campo livre para apresentação)
- Definição de serviços
- Duração dos serviços (obrigatório)
- Configuração de agenda
- Integração com Stripe (opcional)

---

## 🔗 IDENTIDADE DA EMPRESA (SLUG)

- O sistema deve gerar automaticamente um slug a partir do nome da empresa
- O slug será utilizado nas URLs públicas do tenant:
  - `/t/:tenantSlug`
  - `/t/:tenantSlug/orcamento`

### Regras do slug:

- Converter para minúsculas
- Remover acentos e caracteres especiais
- Substituir espaços por hífens

**Exemplo:**
`"Limpeza Top RS"` → `limpeza-top-rs`

---

## ✏️ EDIÇÃO DO SLUG

- O tenant pode editar o slug manualmente durante o onboarding
- O sistema deve validar em tempo real:
  - Disponibilidade
  - Formato válido

### Caso o slug já exista:

Sugerir automaticamente variações disponíveis:

- `limpeza-top-rs-1`
- `limpeza-top-poa`
- `limpeza-top-br`

---

## 🌐 LANDING PAGE AUTOMÁTICA DO TENANT

Cada tenant terá uma página pública automática baseada no slug:

- Exibição da logo
- Nome da empresa
- Descrição (jabá)
- Botão principal: **“Solicitar orçamento”**
- Serviços oferecidos

---

## ⭐ PROVA SOCIAL (OPCIONAL)

- Campo para exibir avaliações de clientes
- Possibilidade de integração futura com o Google Meu Negócio
- Exibir:
  - Nota média
  - Quantidade de avaliações
  - Comentários (quando disponível)

---

## 📅 HORÁRIOS DISPONÍVEIS

- Exibição automática baseada na agenda do tenant
- Visualização em formato:
  - Calendário semanal ou mensal
- Mostrar apenas:
  - Datas disponíveis
  - Horários livres
- Atualização em tempo real conforme agendamentos

---

## ⚠️ REGRAS IMPORTANTES

- O slug deve ser único no sistema
- Não permitir duplicidade
- Caso o slug seja alterado após publicação:
  - Exibir aviso sobre impacto em links já divulgados
  - Implementar redirecionamento automático (recomendado)

---

## 🔐 SEGURANÇA

- **Senha forte obrigatória** no cadastro: mínimo 8 dígitos, com números, letras maiúsculas/minúsculas e caracteres especiais

**Lembrete:**
"A senha deve conter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos especiais"

---

### Modal obrigatório (caso não integre Stripe)

Aviso:

- Pagamentos serão manuais
- Confirmações serão manuais
- Responsabilidade total do tenant

---

# 💬 CHAT INTERNO

- Comunicação entre admin e tenant
- Registro de mensagens
- Histórico acessível

---

# 📈 ANALYTICS

### Para Admin

- Número de tenants
- Receita estimada
- Taxa de uso
- Status de onboarding

### Para Tenant

- Número de agendamentos
- Conversão
- Receita gerada

---

# 🧾 CRM

### Para Admin

- Dados do tenant:
  - Nome
  - Tipo de plano
  - Data de início
  - Vencimento
  - Status

- Operação:
  - Gateway ativo (Sim/Não)
  - Tipo (manual/automático)
  - Risco operacional

- Acesso a histórico
- Logs de atividade

---

# PARTE 1 — CONFIABILIDADE, SEGURANÇA E ESCALABILIDADE

> Este sistema deve operar com alta confiabilidade, previsibilidade e segurança, mesmo sob concorrência, falhas externas e uso intensivo.

---

## 🔐 SEGURANÇA MULTI-TENANT

### Isolamento de dados

- Cada tenant deve ter isolamento total de dados
- Nenhuma requisição pode acessar dados de outro tenant
- Todas as queries devem obrigatoriamente filtrar por `tenant_id`

---

### Controle de acesso (RBAC)

**Perfis:**

- `admin` — controle total do SaaS
- `tenant` — dono da conta
- `staff` — acesso operacional limitado
- `user` — cliente final

**Regras:**

- `staff` NÃO pode:
  - alterar dados financeiros
  - alterar configurações críticas (pagamento, empresa)
- A validação de permissão deve ocorrer **no backend** (obrigatório)
- Nunca confiar apenas no frontend

---

### Proteções obrigatórias

**Sanitização de inputs:**
- formulários
- slug
- parâmetros de rota

**Proteção contra:**
- XSS
- SQL Injection
- CSRF

**Rate limit:**
- aplicar em endpoints públicos (`/t/:slug/orcamento`)

**Criptografia:**
- senhas: bcrypt ou argon2
- dados sensíveis: protegidos em repouso e em trânsito (HTTPS obrigatório)

---

## 🧪 TESTES

### Testes unitários

- Geração e validação de slug
- Regras de duração de serviços
- Validação de horários disponíveis
- Transições de status de agendamento

### Testes de integração

- Fluxo completo: orçamento → agendamento → pagamento → confirmação
- Fluxo sem gateway: solicitação → confirmação manual
- Integração com Stripe (webhooks)

### Testes de concorrência (CRÍTICO)

- Impedir dois usuários de agendar o mesmo horário simultaneamente
- Simular múltiplas requisições concorrentes no mesmo slot

### Testes de rotas públicas

- `/t/:tenantSlug`
- `/t/:tenantSlug/orcamento`

---

## ⚠️ TRATAMENTO DE ERROS

### Regras gerais

- Nenhum erro pode ser silencioso
- Todo erro deve retornar:
  - mensagem clara para o usuário
  - log técnico no backend

### Cenários obrigatórios

- **Falha no pagamento:** manter status como `pendente` e permitir ação manual
- **Horário indisponível:** impedir confirmação e sugerir novo horário
- **Falha em integração externa:** fallback automático para modo manual

### Padrão de resposta

- Mensagens amigáveis para o usuário (sem stack trace)
- Logs detalhados no backend para diagnóstico

---

## 🔄 CONSISTÊNCIA DE DADOS

### Status de agendamento

| Status | Descrição |
|--------|-----------|
| `pendente` | Aguardando confirmação ou pagamento |
| `confirmado` | Pagamento aprovado ou confirmação manual |
| `cancelado` | Cancelado pelo tenant ou pelo sistema |
| `expirado` | Prazo esgotado sem pagamento ou confirmação |

### Regras de integridade

- Um agendamento só pode ser `confirmado` se:
  - pagamento aprovado via gateway **ou**
  - confirmação manual (modo sem gateway)
- Nunca permitir estados ambíguos ou duplicados

### Transações (ACID)

Operações que devem ser atômicas:
- criação de agendamento
- confirmação de pagamento
- alteração de status

### Idempotência em pagamentos

- Uso de webhooks confiáveis (Stripe)
- Implementar retry automático
- Garantir que o mesmo evento não seja processado duas vezes (`provider_payment_id` como UNIQUE)

---

## 📊 OBSERVABILIDADE

### Logs obrigatórios

- Criação de agendamento
- Alteração de status
- Pagamentos (sucesso e falha)
- Erros de sistema
- Ações de usuários (`tenant` e `staff`)

### Auditoria

Registrar para cada ação crítica:
- quem fez
- quando fez
- o que foi alterado (campo a campo, quando aplicável)

### Monitoramento e alertas

- Falhas de pagamento
- Erros em APIs externas
- Falhas em integrações (Stripe, webhooks)
- Picos de erro

### Histórico de agendamento

- Cada agendamento deve possuir histórico completo de eventos ao longo do seu ciclo de vida

---

## 🔄 VERSIONAMENTO E EVOLUÇÃO SEGURA

### API

- Todas as rotas devem ser versionadas: `/api/v1/...`

### Compatibilidade

Não quebrar:
- URLs públicas (`/t/:slug`)
- fluxos existentes de tenants ativos

### Controle de mudanças

- Implementar **feature flags** por tenant (ativar/desativar funcionalidades)
- Registrar mudanças críticas no sistema

### Coexistência de versões

- Novas versões devem coexistir com versões antigas quando necessário
- Garantir migração segura de dados (migrations reversíveis)

---

## 🎯 OBJETIVO FINAL (PARTE 1)

Garantir que o sistema:
- Seja seguro contra acessos indevidos
- Seja confiável sob uso real e concorrência
- Seja resiliente a falhas externas
- Seja consistente em seus dados
- Seja monitorável em tempo real
- Evolua sem quebrar funcionalidades existentes

---

# PARTE 2 — MODELAGEM DO BANCO DE DADOS

> O banco de dados deve garantir isolamento multi-tenant, consistência ACID, integridade referencial, prevenção de duplicidade e rastreabilidade completa.

---

## 🧩 PRINCÍPIOS GERAIS

- Todas as tabelas relevantes devem conter `tenant_id`
- Utilizar chaves primárias UUID
- Aplicar constraints: NOT NULL, UNIQUE, FOREIGN KEY
- Criar índices para performance
- Garantir integridade no nível do banco (não confiar apenas no backend)
- Definir `ON DELETE` apropriado (CASCADE ou RESTRICT conforme contexto)

---

## 🏢 TABELA: `tenants`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| slug | VARCHAR | UNIQUE, NOT NULL |
| email | VARCHAR | NOT NULL |
| phone | VARCHAR | |
| logo_url | TEXT | |
| description | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Regras:** slug único com índice único em `slug`.

---

## 👤 TABELA: `users`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, nullable para admin global |
| name | VARCHAR | NOT NULL |
| email | VARCHAR | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| role | ENUM | admin, tenant, staff, user |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Regras:** staff sempre vinculado a um tenant. Admin global tem `tenant_id = NULL`.

---

## 🧑‍🔧 TABELA: `staff_permissions`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| can_manage_schedule | BOOLEAN | default false |
| can_manage_customers | BOOLEAN | default false |
| can_view_reports | BOOLEAN | default false |
| created_at | TIMESTAMP | |

> ⚠️ `tenant_id` é obrigatório para garantir isolamento multi-tenant.

---

## 🛎️ TABELA: `services`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| name | VARCHAR | NOT NULL |
| description | TEXT | |
| duration_minutes | INTEGER | NOT NULL |
| price | DECIMAL | opcional |
| active | BOOLEAN | default true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 📅 TABELA: `schedules` (agenda base do tenant)

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| day_of_week | INTEGER | 0 (domingo) a 6 (sábado) |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| active | BOOLEAN | default true |

---

## 📆 TABELA: `appointments`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| user_id | UUID | FK → users.id (cliente) |
| service_id | UUID | FK → services.id |
| scheduled_date | DATE | NOT NULL |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| status | ENUM | pendente, confirmado, cancelado, expirado |
| notes | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 🔥 Constraint crítica (anti-duplicidade)

Índice único composto:
```sql
UNIQUE (tenant_id, scheduled_date, start_time)
```
> Impede dois agendamentos no mesmo horário para o mesmo tenant.

---

## 💳 TABELA: `payments`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| appointment_id | UUID | FK → appointments.id |
| provider | VARCHAR | ex: stripe |
| provider_payment_id | VARCHAR | UNIQUE (idempotência) |
| amount | DECIMAL | NOT NULL |
| currency | VARCHAR | BRL ou USD |
| status | ENUM | pending, paid, failed, refunded |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Regras:** 1 pagamento vinculado a 1 agendamento. Consistência entre status de pagamento e status de agendamento é obrigatória.

---

## 🧾 TABELA: `audit_logs`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| user_id | UUID | FK → users.id |
| action | VARCHAR | ex: "appointment.confirmed" |
| entity | VARCHAR | ex: "appointments" |
| entity_id | UUID | |
| metadata | JSONB | dados antes/depois da alteração |
| created_at | TIMESTAMP | |

**Rastreia:** criação, confirmação, cancelamento e alterações em agendamentos e demais entidades críticas.

---

## 💬 TABELA: `messages`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| appointment_id | UUID | FK → appointments.id, nullable |
| type | ENUM | automatic, manual |
| channel | ENUM | whatsapp, email, sms |
| content | TEXT | NOT NULL |
| sent_at | TIMESTAMP | |
| status | ENUM | sent, failed, pending |

---

## 📊 TABELA: `leads`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| name | VARCHAR | NOT NULL |
| phone | VARCHAR | |
| email | VARCHAR | |
| source | VARCHAR | ex: /orcamento |
| created_at | TIMESTAMP | |

---

## 📦 TABELAS DE BILLING

### `plans`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| name | VARCHAR | ex: monthly, semiannual, annual |
| billing_cycle | ENUM | monthly, semiannual, annual |
| active | BOOLEAN | default true |

### `prices`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| plan_id | UUID | FK → plans.id |
| stripe_price_id | VARCHAR | ID no Stripe |
| value | DECIMAL | NOT NULL |
| currency | VARCHAR | BRL ou USD |
| is_current | BOOLEAN | apenas um ativo por plano/moeda |
| created_at | TIMESTAMP | |

### `subscriptions`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| plan_id | UUID | FK → plans.id |
| stripe_subscription_id | VARCHAR | UNIQUE |
| stripe_customer_id | VARCHAR | |
| stripe_price_id | VARCHAR | preço ativo no Stripe |
| billing_cycle | ENUM | monthly, semiannual, annual |
| currency | VARCHAR | BRL ou USD |
| price_at_signup | DECIMAL | imutável após criação |
| current_price | DECIMAL | atualizado em reajustes |
| status | ENUM | active, past_due, canceled, expired |
| auto_renew | BOOLEAN | default true |
| grace_period_days | INTEGER | default 5 |
| started_at | TIMESTAMP | |
| next_billing_at | TIMESTAMP | |
| last_payment_at | TIMESTAMP | |
| last_adjustment_at | TIMESTAMP | |
| version_price_id | UUID | FK → prices.id |

---

## 📈 ÍNDICES RECOMENDADOS

```sql
CREATE UNIQUE INDEX ON tenants (slug);
CREATE UNIQUE INDEX ON users (email);
CREATE UNIQUE INDEX ON appointments (tenant_id, scheduled_date, start_time);
CREATE UNIQUE INDEX ON payments (provider_payment_id);
CREATE INDEX ON appointments (tenant_id, scheduled_date);
CREATE INDEX ON audit_logs (tenant_id, created_at);
```

---

## 🎯 OBJETIVO FINAL (PARTE 2)

Garantir que o banco:
- Impeça erros antes de acontecerem (constraints no nível do banco)
- Mantenha consistência entre módulos
- Suporte múltiplos tenants com segurança
- Permita auditoria completa
- Escale sem reestruturação crítica

---

# PARTE 3 — PAINÉIS E MONITORAMENTO

> O sistema deve disponibilizar áreas específicas para visualização de logs, atividades e relatórios, respeitando os níveis de acesso (admin, tenant, staff, user).

---

## 👑 PAINEL DO ADMIN (SaaS)

**Menu principal:** Dashboard · Tenants · Usuários · Monitoramento · Pagamentos · Configurações

### Dashboard (visão geral)

- Total de tenants ativos/inativos
- Novos cadastros (período)
- Agendamentos totais
- Taxa de conversão: orçamento → confirmado
- Receita consolidada

### Tenants

- Listagem completa com status (ativo/inativo)
- Detalhe por tenant: dados, uso e atividades

### Usuários

- Gerenciar admins e acessos globais

### Monitoramento / Logs

**Funcionalidades:**
- Logs técnicos (erros de backend)
- Logs de integração (Stripe, APIs externas)
- Logs operacionais (agendamentos, pagamentos)

**Filtros obrigatórios:**
- Por tenant
- Por tipo: erro / aviso / info
- Por período
- Por status: sucesso / falha

**Detalhamento:**
- Mensagem resumida
- Timestamp
- ID do tenant e do usuário (quando aplicável)
- Payload técnico (restrito ao admin)

**Exportação:** CSV e JSON, com filtros aplicados

**Alertas exibidos:**
- Falhas de pagamento
- Erros críticos
- Falhas de webhook
- Picos de erro

### Pagamentos

- Visão global de status por tenant
- Falhas recorrentes

### Configurações

- Feature flags globais
- Controle de versões de API
- Integrações globais
- Planos e preços (criar, editar, definir reajuste)
- Grace period global
- Ativar/desativar reajuste automático

---

## 🏢 PAINEL DO TENANT

**Menu principal:** Dashboard · Agenda · Serviços · Clientes · Atividade · Pagamentos · Configurações

### Dashboard

- Agendamentos do dia: pendentes / confirmados / cancelados
- Total de leads
- Taxa de conversão
- Serviços mais solicitados
- Receita (quando gateway ativo)

### Agenda

- Visualização semanal e mensal
- Bloqueio automático de horários ocupados
- Criação manual de agendamento
- Confirmação manual (quando necessário)

### Serviços

- Criar / editar serviços
- Definir duração e preço (opcional)
- Ativar / desativar serviço

### Clientes (Leads)

- Lista de contatos com origem (ex: `/orcamento`)
- Histórico de interações

### Atividade

- Histórico de ações operacionais
- Status de agendamentos e eventos relevantes
- **Mensagens sempre amigáveis** (sem stack trace ou erros técnicos)

**Filtros:**
- Por tipo: agendamento / pagamento / sistema
- Por período e status

**Exportação:** CSV (obrigatório) · PDF (opcional)

### Pagamentos

- Status: pendente / aprovado / falha
- Integração com gateway (quando ativo)

### Configurações

- Editar dados da empresa
- Editar slug
- Personalizar mensagens automáticas
- Ativar/desativar gateway de pagamento
- Gerenciar plano e assinatura
- Ativar/desativar auto_renew

### Link público (destaque)

- Exibir: `/t/:slug` e `/t/:slug/orcamento`
- Botão "Copiar link"

### Alertas

- Pagamentos pendentes
- Solicitações aguardando confirmação
- Falhas recentes

---

## 👥 STAFF — VISÃO OPERACIONAL

**Acesso:** dentro das telas de Agenda, Clientes e Atendimentos.

**Pode:**
- Visualizar status de agendamentos
- Visualizar histórico básico de atendimentos

**Não pode:**
- Acessar logs completos ou auditoria
- Acessar relatórios financeiros (se restrito na permissão)
- Alterar dados financeiros ou configurações críticas

---

## 👤 USER (CLIENTE FINAL)

**Acesso:** dentro do fluxo de agendamento público.

**Pode:**
- Visualizar status do seu agendamento
- Visualizar mensagens de confirmação ou erro

---

## 🎯 OBJETIVO FINAL (PARTE 3)

- O admin tem controle total do sistema
- O tenant tem visibilidade operacional clara
- O staff tem apenas o necessário para operar
- O user tem experiência simples e segura
- Nenhuma informação sensível é exposta indevidamente

---

# PARTE 4 — LANDING PAGE PÚBLICA DO SaaS

> Objetivo: converter visitantes em tenants pagantes, demonstrar valor rapidamente e direcionar para teste ou compra.

---

## 🌍 DETECÇÃO DE IDIOMA E MOEDA

- Detectar automaticamente: idioma do navegador (pt-BR / en-US) e localização por geo/IP
- pt-BR → valores em BRL (R$)
- en-US → valores em USD (US$)
- Permitir alternância manual via toggle no topo

---

## 🎯 HERO

**Headline:** "Transforme visitantes em clientes com orçamento, pagamento e agendamento automático"

**Subheadline:** "Sem complicação. Sem depender de WhatsApp. Pronto para usar."

**CTAs:** "Criar minha conta" · "Testar demo"

---

## 🧩 COMO FUNCIONA

1. Crie sua página (slug automático)
2. Compartilhe seu link
3. Receba pedidos de orçamento
4. Confirme automaticamente ou manualmente
5. Receba pagamentos

---

## 🔗 DEMONSTRAÇÃO

- `/t/demo`
- `/t/demo/orcamento`

---

## 💎 DIFERENCIAIS

- Página própria automática
- Agenda inteligente integrada
- Funciona com ou sem pagamento online
- Setup em minutos
- Sem necessidade de site próprio

---

## ⭐ PROVA SOCIAL

- Depoimentos (mock inicial)
- Futuro: integração com Google Reviews
- "Pague o plano com apenas 1 cliente"

---

## 💰 PLANOS

> Exibição dinâmica conforme idioma detectado.

### 🇧🇷 Versão pt-BR

| Plano | Preço | Recursos |
|-------|-------|----------|
| 🟢 Mensal | R$ 59,90/mês | 0 staff · Página pública + agendamento · Gestão básica |
| 🔵 Semestral ⭐ Recomendado | R$ 249,90/6 meses | Até 3 staff · Agenda completa · Gestão de leads |
| 🟣 Anual 🏆 Mais vantajoso | R$ 399,90/ano | Até 10 staff · Todos os recursos · Suporte prioritário |

### 🇺🇸 Versão en-US

| Plan | Price | Features |
|------|-------|----------|
| 🟢 Monthly | US$ 19.90/month | 0 staff · Public page + scheduling · Basic management |
| 🔵 Semiannual ⭐ Recommended | US$ 79.90/6 months | Up to 3 staff · Full scheduling · Lead management |
| 🟣 Annual 🏆 Best Deal | US$ 149.90/year | Up to 10 staff · All features · Priority support |

**Regras de exibição:**
- Destacar Semestral como "Recomendado"
- Destacar Anual como "Melhor valor"
- Mostrar economia comparada ao mensal
- CTAs por plano: "Começar agora" / "Assinar plano"

---

## 🔐 CONFIANÇA E FRICÇÃO

- Selos: LGPD, infraestrutura monitorada, pagamentos seguros
- Pode começar sem cartão (opcional)
- Funciona sem Stripe (modo manual)
- Cancelamento simples

**CTA final:** "Criar minha página agora"

---

# PARTE 5 — BILLING E ASSINATURAS

---

## 🧱 MODELO DE DADOS

Ver tabelas `plans`, `prices` e `subscriptions` na Parte 2.

---

## 🔁 RENOVAÇÃO AUTOMÁTICA

- `auto_renew = true` por padrão
- Cobrança automática via Stripe no vencimento
- Se aprovado: mantém `status = active` e `price_at_signup`

---

## ⚠️ FALHA DE PAGAMENTO (DUNNING)

1. `status → past_due`
2. Iniciar contador de grace_period (padrão: 5 dias)
3. Durante grace_period: assinatura continua ativa com preço antigo protegido
4. Se pagar dentro do prazo: `status → active`, mantém `price_at_signup`
5. Se não pagar: `status → expired`

---

## ❌ QUEBRA DE ASSINATURA

- Se `status = expired` ou cancelamento manual:
  - ao reativar: aplicar `current_price` (preço atual)
  - perder benefício de `price_at_signup`
  - criar **nova** assinatura no Stripe (nunca reutilizar a cancelada)

---

## 🚀 PRICING POR RELEVÂNCIA

- Novos tenants: usam o preço atual
- Assinaturas existentes: mantêm `price_at_signup`
- Mudança de preço: gera novo `version_price_id`, marca `is_current = true` no novo e `false` no anterior

---

## 📊 REAJUSTE ANUAL

- Aplicado a **todas** assinaturas ativas
- Cálculo: `price_at_signup × (1 + índice)`

---

## 🔄 SINCRONIZAÇÃO COM LANDING PAGE

- Alterações no admin refletem automaticamente na LP
- LP sempre usa o `version_price_id` mais recente

---

## 📩 MENSAGENS AUTOMÁTICAS DE BILLING

Templates configuráveis pelo admin:

| Evento | Antecedência | Mensagem padrão |
|--------|-------------|-----------------|
| Lembrete de vencimento | 3 dias antes | "Seu plano vencerá em breve. Evite interrupções mantendo sua assinatura ativa." |
| Falha de pagamento | Imediato | "Não conseguimos processar seu pagamento. Atualize seus dados para evitar suspensão." |
| Grace period | Início e 1 dia antes do fim | "Você ainda pode manter seu plano com o valor atual se regularizar dentro do prazo." |
| Expiração | Na data | "Seu plano foi encerrado. Ao retornar, novos valores poderão ser aplicados." |
| Reajuste anual | 30 dias antes | "Seu plano será ajustado conforme índice anual. O novo valor será aplicado automaticamente." |

---

## 🔐 REGRAS CRÍTICAS DE BILLING

- Nunca alterar `price_at_signup` manualmente
- Nunca aplicar preço novo em assinaturas ativas (exceto reajuste programado)
- Garantir consistência entre billing e acesso ao sistema
- Logs completos de todos eventos de cobrança

---

# PARTE 6 — INTEGRAÇÃO COM STRIPE

---

## 🚀 1. CRIAÇÃO / ALTERAÇÃO DE PREÇO

**Ação:** admin altera valor de um plano no dashboard.

**Backend deve:**

1. Criar novo preço no Stripe:
   ```
   POST /v1/prices
   - unit_amount (em centavos)
   - currency (brl | usd)
   - recurring.interval (month | year)
   - product (id do plano no Stripe)
   ```

2. Salvar no banco: novo `stripe_price_id` com `is_current = true`; marcar anterior como `is_current = false`

3. **NÃO** alterar assinaturas existentes

---

## 🧾 2. CRIAÇÃO DE ASSINATURA

1. Criar customer: `POST /v1/customers`
2. Criar subscription: `POST /v1/subscriptions` com `customer` e `items[price]` = `stripe_price_id` atual
3. Salvar: `stripe_subscription_id`, `stripe_price_id`, `price_at_signup`

---

## 🔁 3. RENOVAÇÃO AUTOMÁTICA

- Gerenciada pelo Stripe automaticamente
- O sistema **não** cobra manualmente

---

## 📡 4. WEBHOOKS

**Endpoint:** `POST /webhooks/stripe`

| Evento | Ação |
|--------|------|
| `invoice.payment_succeeded` | status → active · atualizar `last_payment_at` e `next_billing_at` |
| `invoice.payment_failed` | status → past_due · iniciar grace_period |
| `customer.subscription.deleted` | status → canceled |
| `invoice.paid` | redundância de confirmação, garantir consistência |

**Segurança:** validar assinatura do Stripe via `Stripe-Signature` header. Rejeitar requisições inválidas.

---

## ⏳ 5. GRACE PERIOD (INTERNO)

- Ao receber `payment_failed`: marcar data limite = `now + 5 dias`
- Se pagar dentro: mantém preço e ativa
- Se não pagar: `status = expired`

---

## 🔄 6. REATIVAÇÃO

- Se `status = expired`: criar **nova** assinatura no Stripe com `is_current = true`
- Nunca reutilizar assinatura cancelada

---

## 🚨 7. TRATAMENTO DE ERROS

| Cenário | Ação |
|---------|------|
| Falha ao criar preço no Stripe | Rollback local + log crítico |
| Webhook falha ao processar | Reprocessamento automático (retry com backoff) |
| Evento duplicado | Ignorar via idempotência (`provider_payment_id` UNIQUE) |

---

## 📊 8. LOGS DE INTEGRAÇÃO

Registrar:
- Criação de preço
- Criação de assinatura
- Falhas de pagamento
- Webhooks recebidos (payload + status de processamento)

---

# PARTE 7 — CONTROLE DE PERMISSÕES (RBAC + FEATURE FLAGS)

---

## 👥 ROLES DO SISTEMA

| Role | Descrição |
|------|-----------|
| `admin` | Controle total do SaaS |
| `tenant` | Dono da conta, controle do tenant |
| `staff` | Acesso operacional limitado |
| `user` | Cliente final |

---

## 📦 FEATURES POR PLANO

| Feature | monthly | semiannual | annual |
|---------|---------|------------|--------|
| staff_limit | 0 | 3 | 10 |
| crm_level | basic | intermediate | full |
| reports | false | true | advanced |
| automations | false | basic | full |
| advanced_payments | false | true | true |

---

## 🧠 LÓGICA DE VALIDAÇÃO DE ACESSO

```pseudo
if (role == admin):
    allow_all()

else if (role == tenant OR role == staff):
    check_plan_feature(requested_feature)
    if (feature_enabled):
        allow()
    else:
        show_upgrade_prompt()

else if (role == user):
    allow_public_actions_only()
```

> ⚠️ Validação sempre no **backend**. Frontend pode ocultar elementos, mas nunca é a única barreira.

---

## 🔐 FEATURE FLAGS POR TENANT

- Admin pode ativar/desativar funcionalidades por tenant individualmente
- Flags sobrescrevem limites de plano (para casos especiais, betas, etc.)
- Registrar toda alteração de flags em `audit_logs`

---

# PARTE 8 — SISTEMA DE UPSELL INTELIGENTE

---

## 🎯 OBJETIVO

- Exibir features bloqueadas de forma estratégica (não esconder)
- Capturar sinais reais de intenção de upgrade
- Converter comportamento em dados acionáveis
- Apresentar insights no dashboard do admin

---

## 🧭 PRINCÍPIO CENTRAL

Mostrar o upgrade:
- no momento em que o usuário percebe valor
- no momento em que ele tenta avançar
- nunca antes, nunca tarde demais

---

## 1. FEATURE PREVIEW + BLOQUEIO (UPSELL VISUAL)

**Conceito:** features NÃO devem ser escondidas. Devem ser visíveis, parcialmente acessíveis e bloqueadas com contexto.

```pseudo
if (feature_enabled_for_plan):
    render_full_feature()
else:
    render_locked_feature()
    track_upsell_impression(feature_id, tenant_id)
```

**UI de bloqueio:**
- blur leve ou overlay sobre o conteúdo
- badge "Premium" ou "Plano superior"
- Exibir: nome da feature + benefício claro + botão "Fazer upgrade"

**Exemplos:**
- Relatórios → gráfico borrado + preview desfocado
- Automações → fluxo visível, edição bloqueada
- Staff → bloqueio ao atingir limite do plano

---

## 2. TRIGGERS DE UPSELL

| Trigger | Quando exibir |
|---------|--------------|
| 🚀 Alta intenção | Usuário clica em feature bloqueada |
| 📊 Proximidade de limite | Staff limit ≥ 80% do máximo do plano |
| 📈 Progressão de uso | Volume de agendamentos cresce e plano não cobre automações |
| 📅 Contexto temporal | 30 dias de uso no plano mensal sem upgrade |

```pseudo
// Trigger: alta intenção
if (user_clicks_locked_feature):
    show_upgrade_modal(feature_context)
    track_upsell_click(feature_id, tenant_id)

// Trigger: proximidade de limite
if (staff_count >= staff_limit * 0.8):
    show_inline_upgrade_hint()
```

---

## 3. TRACKING DE INTENÇÃO DE UPGRADE

### Tabela: `upsell_events`

| Campo | Tipo | Observação |
|-------|------|------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| user_id | UUID | FK → users.id |
| feature_id | VARCHAR | ex: "reports", "automations" |
| event_type | ENUM | impression, click, modal_opened, upgrade_started, upgrade_completed |
| plan_at_event | VARCHAR | plano do tenant no momento do evento |
| created_at | TIMESTAMP | |

---

## 4. DASHBOARD DE UPSELL (ADMIN)

**Localização:** Menu Admin → Monetização / Upsell

**Métricas exibidas:**
- Features mais clicadas (bloqueadas)
- Tenants com maior intenção de upgrade (ranking)
- Taxa de conversão por feature (clique → upgrade)
- Receita incremental gerada por upsell

**Ações disponíveis:**
- Enviar oferta personalizada para tenant com alta intenção
- Ativar promoção temporária para grupo de tenants
- Exportar lista de tenants quentes para ação comercial

---

## 5. REGRAS CRÍTICAS DE UPSELL

- Nunca exibir modal de upgrade mais de 1 vez por sessão para a mesma feature
- Nunca bloquear acesso a dados já inseridos (ex: leads do CRM continuam visíveis, apenas novas entradas são bloqueadas)
- Garantir que o bloqueio seja aplicado no **backend** (não confiar apenas na UI)

---

# PARTE 9 — UPGRADE / DOWNGRADE DE PLANO (SELF-SERVICE)

---

## 👤 ACESSO

- Permitido: `tenant`
- Bloqueado: `staff`

```pseudo
if (role != tenant):
    deny_access()
```

---

## 🔄 FLUXO DE UPGRADE

1. Tenant seleciona novo plano no painel
2. Sistema exibe comparativo de planos e diferença de valor
3. Tenant confirma a operação

**Backend:**

```pseudo
// Upgrade imediato (proration via Stripe)
stripe.subscriptions.update(stripe_subscription_id, {
    items: [{ price: new_stripe_price_id }],
    proration_behavior: 'create_prorations'
})
```

4. Atualizar no banco: `stripe_price_id`, `plan_id`, `current_price`
5. Liberar novas features imediatamente após confirmação do Stripe
6. Registrar em `audit_logs`

---

## 🔽 FLUXO DE DOWNGRADE

1. Tenant seleciona plano inferior
2. Sistema exibe **aviso claro** sobre features que serão perdidas
3. Tenant confirma com ciência das perdas

**Backend:**

```pseudo
// Downgrade ao fim do ciclo atual
stripe.subscriptions.update(stripe_subscription_id, {
    items: [{ price: new_stripe_price_id }],
    proration_behavior: 'none',
    billing_cycle_anchor: 'unchanged'
})
```

4. Marcar `pending_downgrade = true` + `downgrade_plan_id`
5. Aplicar downgrade apenas no próximo ciclo
6. Features do plano atual mantidas até o vencimento
7. Registrar em `audit_logs`

---

## ⚠️ REGRAS CRÍTICAS

- Nunca fazer downgrade imediato (respeitar ciclo pago)
- Nunca cobrar dois planos no mesmo período
- Sempre confirmar via webhook do Stripe antes de alterar features no banco
- Se upgrade falhar no Stripe: rollback local + log crítico

---

# 🚀 INFRAESTRUTURA E DEVOPS

## Containerização e Orquestração

<!-- COMENTADO - Implementação Posterior -->
<!--
- Dockerfiles para frontend e backend
- Docker Compose para desenvolvimento local (3 containers: frontend, backend, postgres)
- Kubernetes para produção (escalabilidade horizontal)
- ConfigMaps para variáveis de ambiente por ambiente
- Secrets kubernetes para chaves de API
- Health checks em containers (liveness e readiness probes)
- Auto-scaling baseado em CPU (HPA)
-->

## CI/CD Avançado

- Pipelines com GitHub Actions ou GitLab CI
- Testes automatizados em cada PR:
  - Unit tests
  - Integration tests
  - Linting (ESLint, Prettier)
  - Security scanning (Snyk, OWASP ZAP)
- Build e push de imagens Docker
- Deploy blue-green para zero downtime
- Rollback automático se testes falharem
- Notificações no Slack/Discord para deploys

## Monitoramento e Alertas

- Sentry para rastreamento de erros em produção
- Prometheus para coleta de métricas
- Grafana para visualização de dashboards
- Alertas automáticos via Slack/Discord:
  - Downtime da API
  - Taxa de erro > 1%
  - Latência > 2s
  - Taxa de CPU > 80%
- Status page pública (statuspage.io ou similar)

## Gestão de Secrets

- AWS Secrets Manager ou HashiCorp Vault
- Armazenar com segurança:
  - Chaves de API (Stripe, Google Maps)
  - Senhas de banco de dados
  - JWT secret
  - Credenciais de serviços
- Rotação automática de secrets (90 dias)
- Acesso auditado e logado

---

# ✅ TESTES E QUALIDADE

## Cobertura de Testes

- Objetivo: 80%+ de cobertura de código
- Tipos de testes:
  - Unit tests (Jest): controllers, services, utils
  - Integration tests (Jest + Supertest): endpoints da API
  - E2E tests (Cypress ou Playwright): fluxos críticos
    - Agendamento completo

## Validação de Dados Robusta

- Schemas de validação para todas as entradas
- Usar Joi ou Zod:
  - Validação de estrutura
  - Sanitização contra XSS
  - Proteção contra SQL injection
- Validação côté backend (nunca confiar servidor no cliente)
- Whitelist de campos aceitos

## Testes de Segurança

- Scans regulares com OWASP ZAP
- Snyk para verificação de dependências vulneráveis
- Penetration testing trimestral
- Teste de força bruta em endpoints de autenticação
- Validação de CORS e CSP

---

# 📚 DOCUMENTAÇÃO E SUPORTE

## API Documentation

- Swagger/OpenAPI para todas as endpoints
- Gerar docs interativas com Swagger UI
- Versionamento de API (v1, v2)
- Exemplos de requisição/resposta
- Rate limits documentados
- Autenticação JWT explicada

## Guia de Usuário e Onboarding

- Tutorial in-app para primeiro acesso:
  - Tooltips em passos iniciais
  - Checklist de configuração
- Base de conhecimento (wiki/FAQ):
  - Como configurar serviços
  - Como ativar Stripe
  - Como gerar relatórios
  - Troubleshooting comum
- Vídeos tutoriais (YouTube)
- Documentação em 3 idiomas (PT-BR, EN, ES)

## Suporte Multicanal

<!-- COMENTADO - Implementação Posterior -->
<!--
- Sistema de tickets integrado (Zendesk ou Freshdesk)
- Canais de suporte:
  - E-mail (suporte@plataforma.com)
  - Chat interno (Discord/Slack da plataforma)
  - Formulário de suporte na plataforma
  - WhatsApp Business (opcional)
- SLA (Service Level Agreement):
  - Resposta até 24h
  - Resolução até 72h
- Chatbot com IA para FAQ automática
- Escalação automática para agentes humanos
- Histórico de tickets acessível ao usuário
-->

## Changelog e Versionamento

- Changelog público de todas as atualizações
- Versionamento semântico (semantic versioning)
- Comunicar breaking changes com antecedência
- Blog de atualizações com novas features
- Deprecation notice para features antigas (3 meses de aviso)

---

# 🏁 INSTRUÇÃO FINAL

Desenvolver o sistema completo seguindo todas as especificações acima.

O código deve ser:

- Bem estruturado
- Comentado
- Modular
- Seguro
- Escalável

Garantir que:

- Todas as funcionalidades funcionem corretamente
- Não existam conflitos de fluxo
- A experiência do usuário seja simples e intuitiva

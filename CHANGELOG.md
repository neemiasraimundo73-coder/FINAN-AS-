# Changelog

## Etapa 0 — Fundação concluída

- Estrutura de frontend web responsivo e acessível;
- Tema claro/escuro;
- Navegação para dashboard, ofertas, dízimos, irmãos e registros por dia;
- Estados de carregamento, erro e sincronização;
- Configuração por variáveis públicas do Supabase, sem segredos no frontend;
- README de instalação e plano de testes;
- Schema PostgreSQL com constraints, índices, funções RPC, triggers, auditoria e RLS;
- Auth por email, cadastro, login e recuperação de palavra-passe;
- Assistente de criação da primeira organização;
- Papéis admin, treasurer e viewer no banco.

## Etapa 1/2 — Núcleo funcional inicial

- Dashboard com períodos e evolução dos últimos dias;
- CRUD de ofertas;
- CRUD de dízimos;
- Cadastro de irmãos;
- Pesquisa nas listas;
- Consulta de registros por data;
- Exclusão lógica com confirmação;
- Proteção de dia fechado no banco;
- Realtime para ofertas, dízimos e irmãos;
- Operações com `operation_id` para repetição segura.

## Etapa complementar — módulos administrativos

- Calendário financeiro por mês;
- Fecho diário com confirmação, bloqueio e reabertura auditada;
- Pré-visualização de relatórios;
- Geração de PDF com totais, tabelas, cabeçalho e paginação;
- Administração de membros e alteração de perfis;
- Configurações institucionais;
- Exportação e restauração por backup JSON com operação protegida no banco.

## Publicação

A publicação final depende da execução do schema num Supabase real, da configuração das chaves públicas e da validação do roteiro de segurança antes de uso financeiro.

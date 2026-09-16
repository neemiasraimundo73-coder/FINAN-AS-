# Alfa e Ómega — Sistema Financeiro Web

Fundação web responsiva com autenticação, configuração inicial da igreja, ofertas, dízimos, irmãos, dashboard e sincronização Supabase.

## Requisitos

- Projeto Supabase com Auth por email ativado;
- Um navegador moderno;
- Para teste local, Python 3 (ou qualquer servidor HTTP estático).

## Configuração segura

1. Crie um projeto no Supabase.
2. No SQL Editor, execute `supabase/schema.sql` completo.
3. Em Authentication > Providers, ative Email.
4. Copie `config.js.example` para `config.js`.
5. Preencha somente `SUPABASE_URL` e a chave pública `anon`.
6. Nunca coloque a `service_role` no navegador nem neste diretório.

## Executar localmente

A partir de `web-app/`:

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173`.

Não abra `index.html` diretamente como arquivo, porque módulos JavaScript e as políticas do navegador podem bloquear a aplicação.

## Publicar no GitHub Pages

O GitHub Pages pode hospedar o frontend, mas não substitui o Supabase. Primeiro execute o `supabase/schema.sql` no Supabase e confirme que a autenticação por e-mail está ativa.

1. Crie um repositório GitHub vazio.
2. Envie o conteúdo desta pasta `web-app/` para a raiz do repositório, incluindo `.github/workflows/pages.yml`.
3. Em **Settings > Secrets and variables > Actions > Variables**, crie as variáveis públicas `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
4. Em **Settings > Pages**, escolha GitHub Actions como fonte.
5. Faça um push para a branch `main` ou execute manualmente o workflow.
6. O workflow gera o `config.js` durante a publicação; não envie esse arquivo para o repositório.

A chave `anon` pode ser usada no frontend apenas com RLS corretamente configurado. Nunca use a chave `service_role`.

## Primeiro acesso

1. Escolha **Criar conta**.
2. Confirme o email, se o projeto Supabase exigir.
3. Entre novamente.
4. Complete o assistente de configuração da igreja.
5. A conta só recebe o papel de administrador principal após essa confirmação explícita.

Não há usuários, senhas ou dados de demonstração embutidos.

## Estado desta etapa

Implementado na fundação:

- Login, cadastro e recuperação de palavra-passe;
- Configuração inicial segura da organização;
- Papéis admin, tesoureiro e consulta;
- Dashboard com período;
- Ofertas e dízimos;
- Cadastro de irmãos;
- Registros do dia;
- Exclusão com confirmação;
- Realtime para ofertas, dízimos e irmãos;
- RLS, trilha de auditoria e proteção de dias fechados no banco.

Também estão incluídos: calendário financeiro, fecho diário com reabertura administrativa, relatórios com pré-visualização e PDF, administração de membros/configurações e backup/restauração por exportação JSON.

Antes da utilização em produção, execute o roteiro de `TEST_PLAN.md` com um projeto Supabase real e valide as políticas RLS.

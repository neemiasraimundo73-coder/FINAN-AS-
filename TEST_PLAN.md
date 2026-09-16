# Plano de teste — Etapa 0/1/2

## Pré-condições

- Projeto Supabase criado;
- `supabase/schema.sql` executado;
- Email ativado em Auth;
- `config.js` criado com URL e chave `anon` pública;
- Servidor HTTP local ou publicação HTTPS.

## Roteiro manual

1. Abrir a aplicação sem sessão: deve mostrar Entrar e Criar conta.
2. Criar conta com palavra-passe inválida/curta: o navegador deve impedir o envio.
3. Criar conta com e-mail válido e confirmar o e-mail, quando exigido.
4. Entrar e completar a configuração inicial.
5. Abrir uma segunda sessão/dispositivo com as mesmas credenciais: deve ver a mesma organização.
6. Registar uma oferta e conferir o total no dashboard.
7. Registar um dízimo com irmão cadastrado e referência do mês.
8. Editar e apagar lançamentos; confirmar antes de apagar.
9. Pesquisar ofertas, dízimos e irmãos.
10. Abrir Registros por dia e selecionar outra data.
11. Verificar que uma sessão aberta em outro navegador recebe alterações via Realtime.
12. Criar usuário tesoureiro/consulta depois de implementar o módulo administrativo.
13. Tentar uma operação sem permissão usando uma sessão de consulta: deve ser recusada pelo banco, não apenas escondida pela interface.

## Segurança a validar no Supabase

- Nunca usar `service_role` no navegador;
- RLS habilitado em todas as tabelas;
- Usuário de uma organização não consegue consultar outra;
- Usuário consulta não consegue inserir, editar ou apagar;
- Registro financeiro de dia fechado é recusado;
- Funções de fechamento/reabertura exigem o papel correto;
- Auditoria registra criação, edição e exclusão lógica.

## Testes de falha

- Desligar a rede durante uma consulta: mostrar erro compreensível, sem apagar dados locais da tela;
- Clicar duas vezes em Guardar: `operation_id` deve evitar duplicação;
- Atualizar a página após registrar: o dado deve continuar na nuvem;
- Trocar navegador/dispositivo: os dados devem aparecer após login;
- Tentar restaurar uma sessão expirada: exigir novo login.

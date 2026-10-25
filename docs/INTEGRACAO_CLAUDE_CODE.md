# Integração Claude Code + ChatGPT — PokeSearch (24/10/2026)

## Estado
- Integração proposta em branch isolada `chore/claude-code-github-actions-20261024`, com PR Draft para `main`.
- Não altera código Android, configurações de build, assinatura, versões ou APK.
- A `main` verificada durante esta configuração ainda referencia LT61 (`caea98b7b57b9e45d5218e907eb392d76953dd53`). O trabalho LT77 está em outras branches. Não fazer merge das branches LT por engano.
- Workflow: `.github/workflows/claude-code.yml`; instruções do agente: `CLAUDE.md`.

## Pré-requisitos que exigem ação do proprietário
1. Instalar o aplicativo oficial Claude **somente** no repositório PokeSearch: https://github.com/apps/claude
2. No GitHub, abrir: https://github.com/LucianoToscano/PokeSearch/settings/secrets/actions
3. Criar **um** secret de autenticação (não inserir credenciais no código, PRs, issues ou chats):
   - `ANTHROPIC_API_KEY`: chave criada no Console Anthropic (cobrança da API pode se aplicar), **ou**
   - `CLAUDE_CODE_OAUTH_TOKEN`: token gerado pelo Claude Code com `claude setup-token` para quem dispõe de assinatura Claude compatível (Pro/Max), conforme a documentação Anthropic.
4. Revisar e integrar apenas este PR de infraestrutura, quando desejar ativá-lo. Eventos `issue_comment` e `pull_request_review_comment` utilizam o workflow da branch default; o Claude não ficará utilizável por comentário enquanto o workflow existir somente no PR Draft.

## Como usar após ativar
Em uma issue ou PR do PokeSearch, o proprietário comenta:
```text
@claude Revise o bug de layout do overlay nesta branch. Faça uma correção mínima, execute os testes Node relevantes, não faça merge e informe o commit e os riscos.
```
- Dispara apenas em comentário novo do login `LucianoToscano` com a expressão literal `@claude`.
- Limites previstos: até 8 turnos de agente e 25 minutos por execução. São limites de execução, **não** teto garantido de custo.
- Não há disparos automáticos por push, abertura de PR, agendamento ou por comentários de terceiros.
- `CLAUDE.md` preserva identidade do aplicativo, branch correta, Android overlay e proíbe merge/lançamento não autorizado.
- Fluxo: o Claude propõe uma implementação → ChatGPT pode verificar arquivos, comparar commits, revisar o PR e consultar os testes → o proprietário aprova qualquer merge.
- O Claude Code pode editar o branch de um PR aberto; revise o branch e possíveis conflitos antes de aceitar alterações.
- O workflow tem permissões de escrita para criar mudanças e responder comentários. Como a `main` consultada não possuía proteção habilitada, recomenda-se configurar branch protection/ruleset exigindo PR e revisão humana: https://github.com/LucianoToscano/PokeSearch/settings/branches

## Conta GitHub Student
GitHub Education fornece benefícios como GitHub Pro e Copilot Student para estudantes elegíveis; **não confundir Copilot Student com uma licença ou crédito grátis do Claude Code**. Consulte https://education.github.com/pack e https://github.com/settings/education/benefits. A cobrança ou as cotas do Claude são independentes.

## Diagnóstico
- Se `@claude` não inicia: confirmar que workflow foi integrado à `main`, Actions está habilitado e autor do comentário é o proprietário.
- Se aparecer erro de autenticação: verificar instalação do GitHub App oficial e **um** secret definido, sem publicar o seu valor.
- Se falhar com permissões: revisar permissões do aplicativo e política de Actions do repositório.
- Se falhar limite de uso/cobrança: verificar saldo, assinatura e limites no serviço Anthropic.
- Nunca usar `show_full_output: true` ou depuração verbosa em repositório público quando houver segredos.

Documentação: https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md

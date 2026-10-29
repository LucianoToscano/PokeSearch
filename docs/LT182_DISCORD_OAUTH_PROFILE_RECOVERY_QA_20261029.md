# LT182 — Discord autorizado, perfil/treinador ainda não confirmado (29/10/2026)

## Evidência e diagnóstico
- Vídeo fornecido pelo proprietário: a tela oficial do Discord autoriza o PoGoCoordinates e a Home exibe **Logado via Discord** na Conta 2. Portanto não há evidência de recusa de OAuth, erro do botão ou bloqueio da conta Discord.
- Na Home a Conta 2 aparece sem treinador. Isso pode ser **vínculo 0/N de verdade**, que deve ser feito no perfil oficial da conta 2, ou **leitura incompleta** da página React `/profile`. O aplicativo não pode inventar o vínculo nem copiar o treinador da Conta 1.
- A expressão **Anônimo** não prova falha de OAuth: as preferências `homeShowPogoAccountName` e `homeShowTrainerName` ocultam nomes nas duas contas de propósito.

## Correções no código
1. Removido o fechamento incondicional do login após 6,5s quando a sessão OAuth foi aceita mas o perfil ainda não foi verificado. O prazo revela o **site oficial** para conferir ou concluir o vínculo; não inventa código ou redirecionamento OAuth.
2. Leitura de `/profile` no pós-login com tentativas limitadas (até 16, 600ms de espaçamento), distinguindo `unknown` de `unlinked`; sem laço infinito, sem descartar o erro silenciosamente.
3. Se o site **confirma** 0/N, a Home exibe `Vincular` e explica que a autorização Google/Discord não conecta automaticamente o treinador Pokémon GO. `Gerenciar` continua para estado não confirmado.
4. Preservados perfis de WebView isolados, cookies por Conta 1/2, seleção de treinador VIP, política de um vínculo por Pokébola, Shiny restrito a treinador comprovado e vínculo manual no site oficial.

## Testes e limites
- `app/tests/lt182-discord-profile-auth-recovery.test.js`: prova regressiva do fluxo de espera, estados DOM oficiais `unknown`/`unlinked`/`linked`, e ausência de fechamento automático incondicional.
- A validação de Java/Android deve ser feita no CI antes de lançar APK. **Não foi executado OAuth ao vivo nem teste físico no Samsung nesta implementação**.
- Roteiro no Samsung: Conta 1 Google com treinador confirmado + Conta 2 Discord com 0/N; conferir aviso e botão Vincular, vincular no **perfil oficial** e voltar; repetir com Conta 2 Discord com 1/N; testar rede lenta (6,5s+), voltar/cancelar e Shiny por Pokébola, sem herdar código entre contas.
- Sem merge, tag, APK público, atualização OTA ou alteração do Google Drive nesta proposta até teste/aceite. Revisão via PR.

## Caso a vinculação não apareça no site
Abrir `https://pogocoordinates.com/profile` autenticado com **a mesma identidade Discord da Conta 2** e verificar `Pokemon GO accounts`: 0/N exige vincular manualmente; 1/N com treino válido mas Home ainda mostra 0/N indica problema de leitura que requer evidência redigida (sem senha, token, código de treinador ou URL OAuth).

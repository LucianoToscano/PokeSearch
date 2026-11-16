# PokeSearch — ARK LT374 oficial | 16/11/2026

## Release verificada
- **Versão:** `0.03.68` · **versionCode:** `54575` · **label:** `51374`.
- **Release pública:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.68-54575
- **APK permanente:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.68-54575/PokeSearch-v0.03.68-LT.apk
- **APK tamanho:** 61.191.051 bytes; **SHA-256:** `14a7fd8ff1b93fd96ef44bb038d04d75d6530ac4c2c789cc828885f30bf0d58d`; arquivo publicado e hash conferidos pelo workflow.
- **Commit código publicado:** `188b062b68961762fc288fbd5045ab3bfa0744d6` (merge squash da PR #453).
- **CI oficial:** https://github.com/LucianoToscano/PokeSearch/actions/runs/43924017565 — concluído `success`: preflight, testes, keystore, geração dos assets, R8 build, verificação da assinatura/versão/hash e comparação com o asset da Release.
- **PR #453:** https://github.com/LucianoToscano/PokeSearch/pull/453 — integrada após 7/7 gates passados no commit `697356e5c10495aa35a42b25ae9d8281b5460fd6`.

### Evidências dos 7/7 gates anteriores ao merge (mesmo SHA)
- Node QA: #43923356107 — PASS
- LT169: #43923356445 — PASS
- LT211: #43923356126 — PASS
- LT62 Java: #43923356363 — PASS
- LT173 OTA: #43923356170 — PASS
- PGS Buscas APK QA: #43923356054 — PASS
- Secure beta/R8: #43923355976 — PASS

## Comportamento de primeiro uso entregue
P1 e P2 compartilham **um tutorial único** em `overlay_tutorial_install/gestureCoachV3PokeballCompleted`. Mostra na primeira Pokébola aberta, com destaque no ícone real, seta pontilhada, dedo animado, toque curto/long press de 600ms e long press no ↻ para aprender os intervalos de atualização. `Pular` ou completar salva a conclusão e impede repetição em P2. Em instalações anteriores a esta atualização, a chave V3 nova permite exibir o tutorial **uma vez excepcional para teste**. Nunca renomear a chave em releases futuras. `Rever tutorial` nas Preferências permanece voluntário, um único overlay por vez. Doce Raro e Busca têm tutoriais independentes no primeiro uso.

## Pendência NÃO comprovada
**Não houve teste físico neste ambiente**: toque-through Android 11/13/14, overlay escurecido e dedinho animado em Samsung, P1 e P2 abertas simultaneamente, acessibilidade/TalkBack, rotação, P/M/G e ↻ reordenado exigem confirmação no aparelho. O GitHub validou CI e APK assinado, **não prova** experiência real em aparelhos. A versão está publicada por solicitação expressa do usuário para testar, com transparência sobre essa limitação.

## Instrução de teste humano
1. Instalar `PokeSearch-v0.03.68-LT.apk` sobre versão oficial com mesmo certificado e `versionCode` menor.
2. Abrir P1 ou P2 e observar tutorial na primeira aberta. Fazer tocar para abrir/retrair, segurar para abrir/fechar menu e segurar ↻.
3. Pular (ou concluir), fechar/reabrir a mesma Pokébola, abrir a outra e reiniciar o app: nenhum tutorial P1/P2 deverá reaparecer.
4. Para forçar replay manual, ir a Home > Preferências > Rever tutorial interativo dos overlays.
5. Registrar screenshots/vídeos e erros/steps, com exclusão de dados de conta, coordenadas e tokens.

## Continuidade
`docs/LT375_PROMPT_CONTINUIDADE_TUTORIAL_FISICO_20261116.md` direciona a validação física e eventuais correções sem novo onboarding automático.

# PokeSearch LT318 — Release oficial do Edu (08/11/2026)

## Evidência de publicação verificada em GitHub

- **ÚLTIMA RELEASE PÚBLICA ESTÁVEL:** [`v0.03.18-54524`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.18-54524), **LT318 · versão 0.03.18 · versionCode 54524 · label 51322**, publicada em **08/11/2026 às 21:59:05 UTC**.
- **APK oficial:** [`PokeSearch-v0.03.18-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.18-54524/PokeSearch-v0.03.18-LT.apk); **34.709.358 bytes**; SHA-256 **`14e28a71fcbbadae35179c91c61e40957f6f7d865e886299f3c5845ef9462280`**. O asset publicado está `uploaded`; a Release é `draft=false`, `prerelease=false`.
- **Assinatura permanente Android v2:** certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; checagem de chave e verificação do APK realizadas pelo workflow protegido. Tamanho abaixo do máximo oficial de 35.000.000 bytes. Publicação conservou a assinatura de atualização das versões anteriores.
- **Pipeline oficial:** [workflow permanente #42527566539](https://github.com/LucianoToscano/PokeSearch/actions/runs/42527566539) **completed/success**. Jobs `preflight` e `publish` **success**, com preparação de versões, regressões, compilação release, assets, assinatura, SHA público e pós-verificação de publicação.
- **Fonte exata do APK e pedido oficial:** commit `8eef94422ab26d76f7afbc7f3b335d08911df483` na `main` (arquivo `release/official-request.json`).
- **Integração da correção:** [PR #318](https://github.com/LucianoToscano/PokeSearch/pull/318) squash `9688f8e25788d4b3bfae2eb2aba9b2b38fd08de6` a partir do head de PR `799b20654cb5e0557f0453a55fbd5a52dd92d065`.
- **Cinco verificações anteriores ao merge (no SHA da PR):** Node completo [#42527406625](https://github.com/LucianoToscano/PokeSearch/actions/runs/42527406625), LT169 [#42527406743](https://github.com/LucianoToscano/PokeSearch/actions/runs/42527406743), LT211 [#42527406742](https://github.com/LucianoToscano/PokeSearch/actions/runs/42527406742), Java LT62 [#42527406628](https://github.com/LucianoToscano/PokeSearch/actions/runs/42527406628) e OTA LT173 [#42527406551](https://github.com/LucianoToscano/PokeSearch/actions/runs/42527406551): **SUCCESS**.

## Problema LT317 reproduzido por captura do Samsung

A tela do Edu exibia `Edu ETAPA 10/11 · Hora ajustada 28/10 14:00`, X, botões `Conferir novamente` e `Rever região`, textos de fuso como `America/Sao_Paulo` e menções a relógio simulado e exemplo histórico, além de mostrar sprite errada e omitir o contador. A sessão anterior E01–E11 recuperada de Room tinha prioridade sobre a conversa nova.

## O que entrou na LT318

1. **Primeiro contato:** clicar na sprite flutuante abre o balão branco com apresentação curta ("Olá! Eu sou o Edu..."), link `Bug dos Passes ⓘ` sublinhado e explicação tocável **dentro do balão**. Um toque na fala avança à fase do evento. Não há novos botões.
2. **Sem cabeçalho legado:** `createPanel()` não constrói mais o chip com `Edu ETAPA`, relógio, X e outros indicadores. `showEduFirstBubble()` oculta as respostas antigas na abertura. Para recolher a fala, tocar na sprite; para ajustes, segurar a sprite.
3. **Correta prioridade das sprites:** apresentação #42; evento antes de começar #38; iniciado #37; encerrado #36. Mudança imediata de estado na fala e precedência sobre reações e animações da sessão antiga sem apagar o histórico E01–E11.
4. **Texto simples:** nada de nomes técnicos de fuso, `Exemplo histórico oficial` ou mensagem de simulador na fala. O Edu apresenta estado do evento e informações úteis ao jogador; antes do início mostra a data/hora de início e contador regressivo em **dias/horas/minutos/segundos** em destaque, seguido de checklist de softban, região e passe laranja com `ⓘ` sublinhado. No evento ativo, descrição e checklist no próximo balão; se encerrado, mensagem de aguardar próximo evento.
5. **Evento-base:** Mega Chandelure em 31/10/2026, das 14h às 17h **locais**, se não houver outra janela válida. O relógio único da Home com 17 momentos permite testar as fases; relógio manual não manipula o sistema Android ou Pokémon GO e **não é mencionado na conversa**.
6. **Preservações:** 68 sprites/22 poses ociosas, sprites especiais, teleporte, Sombria, P/M/G 50/75/100 (G inicial), P1/P2, PoGoCoordinates, Doce Raro, IV/rank, filtros, login, preferências, histórico E01–E11, Firebase e OTA, com certificado permanente.

## Limites e próximos testes

**QA físico/visual da LT318 em aparelho Samsung ainda não foi feito nem confirmado nesta publicação.** Testes automatizados garantem compilação e contratos de código, não posição visual ou gestos reais. Para homologar, instalar a LT318 por cima da LT317 (sem desinstalar), abrir Edu com `ETAPA 10/11` previamente salva e conferir ausência de X/cabeçalho/botões; usar relógio da Home em 28/10/2026 antes do Chandelure, em 31/10/2026 13:59:50 (contador e mudança de sprite após 10 s), durante e após término; testar 17 presets, toques nos `ⓘ`, P50/M75/G100 e posicionamento do balão perto da cabeça sem cobrir outras overlays.

O APK foi disponibilizado pela distribuição oficial GitHub Releases. **Não afirmar instalação automática concluída**: o Android/Samsung precisa aceitar a instalação; se o instalador embutido fechar, o APK oficial pode ser aberto pelo navegador/Meus Arquivos. Não desinstalar a versão atual para atualizar.

## Referências técnicas

- Correção e auditoria pré-publicação: [`docs/LT318_EDU_REINICIO_BALAO_SEM_UI_LEGADO_20261108.md`](LT318_EDU_REINICIO_BALAO_SEM_UI_LEGADO_20261108.md).
- Registro de versões e decisões: `docs/GUIA_MESTRE.md`.
- Pipeline permanente: `.github/workflows/pokesearch-official-release.yml` e `release/official-request.json`.

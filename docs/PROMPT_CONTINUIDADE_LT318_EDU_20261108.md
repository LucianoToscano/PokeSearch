# CONTINUAR POKÉSEARCH — LT318 · ASSISTENTE EDU

Continue o projeto Android [LucianoToscano/PokeSearch](https://github.com/LucianoToscano/PokeSearch), em português do Brasil. **Não começar do zero, não fazer downgrade, não apagar preferências, não substituir assets de sprites por versões antigas.**

## Estado oficial CONFIRMADO em GitHub — 08/11/2026

- **Última versão pública:** **LT318 · 0.03.18 · versionCode 54524 · label 51322**.
- **Release:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.18-54524
- **APK:** `PokeSearch-v0.03.18-LT.apk` — https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.18-54524/PokeSearch-v0.03.18-LT.apk
- **Tamanho:** 34.709.358 bytes; **SHA-256:** `14e28a71fcbbadae35179c91c61e40957f6f7d865e886299f3c5845ef9462280`.
- **Assinatura Android v2 permanente:** cert fingerprint SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Workflow oficial:** https://github.com/LucianoToscano/PokeSearch/actions/runs/42527566539 — **completed/success** com preflight/publish, compilação, hash e assinatura.
- **PR integrada:** https://github.com/LucianoToscano/PokeSearch/pull/318 — squash `9688f8e25788d4b3bfae2eb2aba9b2b38fd08de6`.
- **Fonte exata do APK e solicitação protegida:** `8eef94422ab26d76f7afbc7f3b335d08911df483`.
- **QA pré-merge de cinco gates:** Node #42527406625, LT169 #42527406743, LT211 #42527406742, Java LT62 #42527406628, OTA LT173 #42527406551 — todos SUCCESS no SHA `799b20654cb5e0557f0453a55fbd5a52dd92d065`.
- **Importante:** O APK está no GitHub Releases/OTA, mas **não há confirmação de instalação ou QA visual físico no Samsung**.

## Leitura obrigatória em ordem

1. `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`.
2. `AGENTS.md`.
3. `docs/GUIA_MESTRE.md` (resumo canônico no topo; histórico integral no backup).
4. `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`.
5. `docs/LT318_EDU_PUBLICACAO_OFICIAL_E_HOMOLOGACAO_20261108.md`.
6. `docs/LT318_EDU_REINICIO_BALAO_SEM_UI_LEGADO_20261108.md`.
7. `docs/LT316_EDU_PRIMEIRO_BALAO_EVENTO_CHECKLIST_20261108.md`.
8. `docs/LT316_EDU_RELOGIO_MOMENTOS_EVENTO_20261108.md`.

Conferir novamente `main`, Releases/latest, workflows e PRs antes de qualquer edição.

## Funcionalidades LT318 que NÃO podem regredir

**Primeira conversa**
- Toque curto no Edu flutuante abre apenas o balão branco com: "Olá! Eu sou o Edu, seu coach de Pokémon GO! Vou acompanhar você nesta jornada. Hoje vamos conhecer o Bug dos Passes ⓘ." Texto `Bug dos Passes ⓘ` sublinhado e clicável, explicação no mesmo balão; toque na fala avança ao estado do evento.
- **Nunca construir/mostrar cabeçalho `Edu ETAPA 10/11`, chip de hora ou botão X na apresentação.** Não mostrar botões `Conferir novamente`, `Rever região` ou outros. Ajustes continuam pelo toque longo na sprite; toque curto na sprite fecha/abre a fala.
- **Uma sessão E01–E11 antiga armazenada não pode substituir a apresentação.** O histórico em Room deve continuar intacto, sem apagar ou alterar feitos anteriores.

**Estados e imagens**
- Apresentação = sprite #42; **ANTES** = `evento_nao_comecou` #38; **ATIVO** = `evento_comecou` #37; **ENCERRADO** = `evento_encerrou` #36. Não usar imagens genéricas fora da fase. Renderizador deve atualizar na transição imediatamente, com precedência sobre reação/animação velha.
- Antes: "O evento ainda não começou", dia/hora de início **sem expor identificador IANA**; contador regressivo com dias, horas, minutos e segundos em destaque no topo; checklist com **Sem softban ⓘ**, **Não ter acessado uma região onde já seja o dia do evento ⓘ**, **Passe de reide laranja da véspera ⓘ**, itens marcados manualmente e informações no mesmo balão.
- Ativo: "O evento começou!", início/término de forma curta, próximo toque leva ao checklist. Encerrado: "Infelizmente, o evento já terminou. Aguarde o próximo evento!" com sprite #36. **Sem** "Exemplo histórico oficial", "Relógio Edu", "relógio manual", "America/Sao_Paulo" ou outros diagnósticos técnicos na conversa.
- Mega Chandelure 31/10/2026 14h–17h **local** é a base de testes se nenhuma outra janela foi configurada; outra janela válida nunca é sobrescrita. Não promover passes extras como garantidos; é um relato comunitário.

**Visual e relógio**
- Balão branco com cauda longa (28dp), extremidade a aproximadamente 5px da lateral estimada da cabeça, posicionado sem encobrir outras sprites. Sprite tamanho P50/M75/G100, G inicial, 68 quadros, 22 ociosos, Sombria, teleporte #52–60, retoques da LT316 preservados; pixel art sem antialias nem deformação.
- Relógio **único da Home** ao lado dos passes, automático/manual, fuso e formato; opção **Momento do evento** abre 17 momentos relativos ao início/fim em ordem cronológica. Relógio interno serve **somente para teste do Edu**; nunca mencionar simulador na fala nem alterar hora/GPS do Android ou Pokémon GO.
- Preservar P1/P2, Rare Candy, PoGoCoordinates e autenticação, rankings PvP/reides, Firebase, histórico e preferências, assinado v2, R8, OTA e controle de tamanho 35 MB. Não criar menus/botões adicionais sem pedido.

## Próxima prioridade (ainda PENDENTE)

Instalar **LT318** por cima da LT317 no Samsung e verificar com prints/vídeo: primeiro toque com sessão `ETAPA 10/11` salva, desaparecimento X/botões, fase BEFORE/ACTIVE/ENDED com sprites #38/#37/#36, contador a 10 segundos antes do evento, 17 presets, checklist/ⓘ, rolagem/legibilidade, tamanhos P/M/G, cauda apontando à cabeça sem sobreposição. **CI aprovado não confirma QA físico**. Se houver falhas, corrigir o defeito real sem reiniciar o projeto.

## Publicações futuras

Antes de publicar, pedir/obter autorização expressa; conferir atualidade de release, versionCode monotônico; executar Node, LT169, LT211, Java LT62, OTA LT173 no SHA final; integrar por PR squash e publicar usando somente `release/official-request.json` em `main` através do workflow permanente `.github/workflows/pokesearch-official-release.yml`, mantendo assinatura e SHA. Registrar todo resultado em `docs/GUIA_MESTRE.md` e atualizar este prompt.

**Preferência do proprietário:** interface minimalista, compacta, intuitiva, sem poluição visual; desenvolvimento passo a passo.

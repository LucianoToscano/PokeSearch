# CONTINUAR POKESEARCH — LT335 / EDU — 14/11/2026

Você está dando continuidade ao projeto Android **PokeSearch**, repositório `LucianoToscano/PokeSearch`. Responda e documente sempre em português do Brasil. **Não começar do zero, não fazer downgrade, não prometer publicação sem verificar os resultados oficiais.**

## 1. Estado oficial confirmado

- **Última release publicada e verificada:** LT335 · **0.03.34** · **versionCode 54540** · label 51338.
- **Tag:** `v0.03.34-54540`.
- **Release:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.34-54540
- **APK oficial:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.34-54540/PokeSearch-v0.03.34-LT.apk
- **APK:** 46.623.392 bytes, SHA-256 `5681d0295bcda0c8319733306846bb8ed911d7cfcd65717d8093f079c40e73fb`, asset `uploaded`, release pública (`draft=false`, `prerelease=false`).
- **Workflow protegido:** https://github.com/LucianoToscano/PokeSearch/actions/runs/43553204656 — **completed/success**, incluindo preflight, assinador permanente, validação do APK, publicação, verificação do SHA público e limpeza dos segredos temporários.
- **Fonte da release:** commit `c1e8db007395f98a634b97bb2d34e947a9b68be6` (`release/official-request.json`).
- **PR #344 integrada por squash:** https://github.com/LucianoToscano/PokeSearch/pull/344 — commit `0edf66c850de180f1d9cb1d0b8e6eaa6389113b5`.
- **Guia Mestre atualizado após publicação:** commit `b67c42d6b9dd8cf9a8902a469ce429730bbab213`.
- APK publicado no GitHub **não instala automaticamente** no Samsung; o usuário precisa autorizar a atualização no Android.

## 2. Leitura obrigatória

1. Conferir novamente `main`, a release mais recente, o APK e os últimos workflows antes de alterar código.
2. Ler `docs/GUIA_MESTRE.md`, em especial a seção **LT335 OFICIAL**.
3. Ler `docs/LT335_EDU_INSPECAO_GUIAS_GESTOS_20261114.md`, `release/official-request.json` e `app/src/main/assets/release_notes.json`.
4. Conferir os Java `EduSpriteAtlas.java`, `EduSpritePoseComposer.java`, `EduSpriteInspector.java`, `EduSpriteGuideView.java`, `EduSpriteMeasurements.java` e `RaidDayAssistantOverlayService.java`.
5. Ler os testes `app/tests/lt335-edu-inspecao-68-guias-gestos.test.js` e `app/tests/lt334-edu-pokebola-corpo-fixo.test.js`.

## 3. O que a LT335 mudou de fato

- A animação da Pokébola (#00–03) e a de celular/jogando (#63–64) usam **cópia da sprite canônica #42** para cabeça, cabelo, rosto, óculos, tronco, pernas e pés, com braço/mãos/objeto como camadas independentes. Isso substitui o recorte rígido do antigo `EduPokeballStable.java`, que cortava o braço.
- O compositor não usa reescala anisotrópica, filtro bilinear nem antialias. A #42, os outros 62 quadros e os 68 masters PNG transparentes de 512×512 **continuam intactos**.
- O inspetor expõe **◀️ 👬 ▶️** em controle **independente da sprite**: navegar manualmente pelos índices 00–67, congelar a pose e mostrar a #42 ao lado do quadro escolhido em escala igual. **Segurar 👬** retoma o automático.
- O menu de ajustes permite ocultar os controles e ativar/desativar **linhas-guia** (ocultas por padrão). A guia é desenhada sobre a sprite, sem alterar seus pixels, para permitir capturas e vídeos.
- O comparador mostra diferenças **estimadas** de cabeça, óculos, mãos, pés e altura, que não são diagnóstico artístico conclusivo.
- Foram preservados P/M/G (100/150/200 px), as oito sequências ociosas, os efeitos especiais, o fallback e a lógica do roteiro/eventos.

## 4. Pendências importantes e prioridade

**Não declarar as 68 sprites artisticamente corrigidas nem a fluidez perfeita.** A LT335 corrige por composição os seis quadros da Pokébola/celular, não recria todos os assets. A issue https://github.com/LucianoToscano/PokeSearch/issues/334 permanece referência para a auditoria visual.

Quando o usuário enviar prints ou vídeos do Samsung, verificar em P/M/G:
- cabeça, cabelo, óculos, olhos, mãos, braços, largura do tronco, calça, sapatos, topo e base dos pés;
- junção dos braços/ombros nos quadros 0–3 e 63–64, legibilidade do celular e ausência de recortes/halos;
- posicionamento dos controles e comportamento do 👬, comparações com #42, guias em screenshots e vídeos;
- transições das oito sequências e poses contextuais (teleporte é exceção legítima de opacidade/escala);
- nenhum botão novo sobre a própria sprite ou sobre a fala.

Corrigir cada falha de forma cirúrgica e preservar a nitidez e os desenhos bons. Evitar normalizações automáticas agressivas, mudanças de identidade, deformação do rosto e perda de sprites. Testar os 68 índices sem lacunas e impedir regressões das sequências.

## 5. Fluxo obrigatório de atualização

1. Inspecionar os arquivos reais e localizar a causa; documentar evidências.
2. Criar branch, fazer alterações mínimas, adicionar/atualizar testes e registrar no Guia Mestre.
3. Abrir PR, aguardar Node completo, Android Core, compilação Java, OTA e APK beta assinado; não fazer merge com falhas.
4. Após merge, incrementar versão/code/label no `release/official-request.json` seguindo histórico e acionar o workflow protegido. Nunca usar chave própria de assinatura.
5. Confirmar `completed/success` de publicação, tag, APK público, tamanho, SHA-256 e assinatura. Informar explicitamente que a instalação no aparelho depende do Android.
6. Gerar novo prompt para a conversa seguinte com commit, release, pendências e links verificados.

**Próximo foco:** usar os controles e as linhas-guia da LT335 para uma auditoria visual real no Samsung; corrigir diferenças de proporção e acabamento sem piorar as sprites de boa qualidade.

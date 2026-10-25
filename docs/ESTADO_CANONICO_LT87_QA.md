# ESTADO CANÔNICO LT87 QA — 25/10/2026

## Continuidade comprovada
- **Projeto:** `LucianoToscano/PokeSearch`, somente PokeSearch; não misturar com PvPPokeGo.
- **Versão oficial pública intacta:** LT83, `versionName=0.00.83`, `versionCode=54286`, GitHub Release `v0.00.83-54286`. Google Drive legado LT79 inalterado.
- **`main`:** `d864a13f31617d1cc268d7dec0ecef38c97912de` na última consulta; verificar novamente antes de futuras escritas.
- **PR #59:** LT84 Draft; **PR #60:** LT85 Draft; **PR #61:** LT86 Draft; **PR #62:** LT87 Draft, base `fix/lt86-api-filter-options-qa-20261025`; sem merge/publicação.
- **Branch LT87:** `fix/lt87-filter-menu-backgrounds-qa-20261025`. Trabalho derivado de LT86, não reiniciado.
- **HEAD da versão compilada (SOURCE_COMMIT):** `21d6547e9cb19efe941134d087f2783d6753ee55`; os commits documentais posteriores NÃO integram o APK.

## Correção LT87 — fundos dos menus Filtros
- `app/src/main/assets/dock.html`: o editor lateral de Ordenar/PC/Nível/Clima/Tamanho/Sexo/Forma/PC mínimo PvP/Evoluções e a coluna principal usam fundo, cor, borda e sombra do Editor Visual via variáveis de tema (`--visual-menu-bg`, `--visual-menu-fg`, `--visual-menu-border` e `--visual-menu-tile-shadow`).
- Neutralizadas regras de `popup-window` que substituíam o fundo por `transparent!important` e anulavam bordas/sombra na janela independente.
- A caixa envolvente continua TRANSPARENTE e `pointer-events:none`; apenas a coluna, o editor aberto e a aba de três perfis salvos recebem eventos, preservando toques no fundo.
- O menu de perfis ▣ também respeita claro/escuro/transparência; escolher filtro fecha perfis abertos, evitando sobreposição do fundo e editor lateral. A janela do perfil cresce somente quando necessária.
- Preservados: orientação horizontal/vertical, alinhamento esquerdo/direito, menu não modal, três ações inferiores ✓/🗑/×, limite 10 resultados, favoritos 10×5 e todas as preferências existentes.

## Build e evidências
- **Versão QA:** `0.00.87`, `versionCode=54290`; nenhum Release oficial criado.
- **GitHub Actions:** [#40168986555](https://github.com/LucianoToscano/PokeSearch/actions/runs/40168986555) = SUCCESS; testes Node históricos e LT87, testes Java e `testDebugUnitTest`, Gradle `assembleRelease`, validação do pacote e assinatura aprovados.
- **APK:** `PokeSearch-v0.00.87-LT-Filter-Fundos-QA.apk`, tamanho real 38.607.807 bytes.
- **SHA-256 do APK verificado após extrair artifact:** `d188bff20191900cc9976fb9b12bca3720a5c0318bf39f75e0d5d9202927617a`.
- **Certificado permanente SHA-256:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Assinatura APK v2:** true, release não depurável, R8 habilitado, pacote `com.lucianotoscano.pokesearch`.
- **Artifact GitHub privado:** ID `12590105916`, nome `PokeSearch-v0.00.87-LT-Filter-Fundos-QA-protected-release`, retenção 30 dias.
- **Workflow:** `.github/workflows/lt87-filter-menu-backgrounds-signed-qa.yml`.
- **Regressão específica:** `app/tests/lt87-filter-menu-backgrounds.test.js` (5/5 PASS); demais testes históricos aprovados nesse CI, exceto contrato legado LT74 explicitamente excluído do workflow original.

## Histórico herdado LT86
LT86 incluiu suporte a 3 perfis gerais e 3 de Favoritos, ⚲ Genderless, cards móveis, remoção de spawns expirados com `expiresAtMs`, dados PvP válidos, opção Mostrar todas as informações, sprites base com fallback PokeAPI e Formas/Nível 50. Essas funcionalidades NÃO foram alteradas pelo patch visual LT87.

## Atenção ao Guia Mestre
`docs/GUIA_MESTRE.md` excede 1,4 MB. O conector GitHub retorna conteúdo vazio/truncado para leitura integral; nunca publicar por `update_file` com esse retorno. O workflow LT87 assinou APK e acrescentou um registro documental em seu checkout integral por append e verificação de hash do prefixo, mas o texto herdado mencionava **LT86** por engano. **Adendo corretivo LT87 executado e aprovado:** GitHub Actions #40169916771 = SUCCESS; acrescentou os dados corretos de LT87 ao Guia Mestre completo via append protegido por verificação SHA-256 do prefixo. Preservou a anotação herdada incorreta LT86 como histórico, registrando sua retificação sem sobrescrever conteúdo.

## Pendências verdadeiras
- Testar fundos/tema/transparência da LT87 fisicamente no Samsung: editor de cada filtro, painel de 3 perfis, ambos lados/orientações, sem bloco preto nem corte, sem tocar involuntariamente atrás.
- Homologação física das correções LT86 de sprites, Formas, Genderless, cards arrastáveis, PvP, Despawn com Atualização OFF, os perfis 3+3 e filtros aplicados à API.
- Confirmar API autenticada/Google login, Shiny, Get coords com spawn real e geofiltro (24.9407581,121.1889794, raios 0/215/1000) com evidência redigida. Nunca expor JWT/reveal_code.
- CI SUCCESS **não** prova funcionamento físico; não declarar PASS Samsung sem provas.
- Não promover LT87 a oficial, alterar Drive, mesclar PRs #59-#62 ou remover proteção sem autorização explícita.

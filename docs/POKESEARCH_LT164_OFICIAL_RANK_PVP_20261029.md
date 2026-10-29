# PokeSearch LT164 — atualização pública, registro de homologação

Data: 29/10/2026
Versão oficial: **0.01.64**
versionCode: **54369**
Repositório: **LucianoToscano/PokeSearch**
PR integrada: **#107** (feature/lt153-pvp-clarity-card-20261029 → main)
Fonte validada em QA: `d63d8e02f275c206d5ffb557b96a27f83a921d4a`
QA GitHub Actions: https://github.com/LucianoToscano/PokeSearch/actions/runs/40853268314 (success)
Tag QA imutável: `v0.01.64-54369-qa-gl-top5-noibat-evolution`
APK fonte QA: `PokeSearch-LT164-GL-Rank-Evolucao-QA.apk`
SHA-256 da APK original: `496a5771b1380a16ace5595f41966134bf391eb997a0c90143039f3acc2733cf`
APK final pretendida: `PokeSearch-v0.01.64-LT.apk` (mesmos bytes)
Tag oficial: `v0.01.64-54369`
Feed do aviso: https://api.github.com/repos/LucianoToscano/PokeSearch/releases/latest

## Correção da busca GL/UL Top #N

- Noibat #714, IV 0/14/12, na Grande Liga: **Rank Classe #1600** como Noibat; evoluído Noivern: **Rank Classe #5**.
- O Top #5 com "Include previous evolutions = Yes" admite Noibat por causa da análise projetada do Noivern.
- A linha compacta do card mostra a evolução correspondente, nunca confunde o Top #5 do filtro com o próprio Rank Classe #5 do Noibat.
- A elegibilidade de evoluir fantasia não é presumida; variáveis PvP calculadas e IV A/D/S permanecem independentes das sprites.
- Se não existir dado validado da liga, a avaliação permanece oculta; sem placeholder "Sem dados".

## Correções cumulativas LT149–LT164

- Layout compacto de três linhas em cada avaliação: nome + eficiência de IV colorida, PC/Nv, Rank Classe e Rank Geral em metades iguais.
- Porcentagens de IV decimais verificadas, sem inventar atributos.
- Coordenadas copiadas centralizadas no botão, contador à direita.
- Sprite exata do PoGoCoordinates e fallback local da mesma forma/Shiny; Shellos/Gastrodon West Sea.
- Separação entre forma cosmética (possível equivalência PvP com espécie-base verificada) e forma regional ou com atributos diferentes.
- Premium, vínculo Google, filtros, favoritos, alertas e duas Pokébolas preservados.

## Procedimento da distribuição

1. PR #107 mesclada a `main` após QA.
2. O workflow `.github/workflows/lt164-official-public-distribution.yml` é disparado uma vez pela entrada dele em `main`, sujeito às proteções do ambiente `official-updates`.
3. Verifica execução QA bem-sucedida, commit-fonte ancestral, SHA-256, package/versionCode, certificado Android v2 permanente, e as notas na Home.
4. Publica o APK **idêntico** à QA como Release oficial `v0.01.64-54369`, com o nome que o atualizador do aplicativo exige.
5. Consulta novamente `releases/latest`, exige que o release não seja pré-lançamento e audita tamanho e digest do APK.
6. O aplicativo pode oferecer a atualização pelo seu mecanismo existente de GitHub Releases, sem reinstalação obrigatória ou troca de assinatura; instalar exige ação do usuário.

Não alterar nem substituir um release existente. Não publicar o QA como "latest" enquanto o release oficial não estiver auditado.

## Confirmação de distribuição concluída — 29/10/2026

- PR #107 **mesclada** com sucesso em `main`: commit `9dfa37299ff6751e4f93b6ee13e8cbf594aa9c1d`.
- Correção no verificador de filename interno da QA, sem mudar os bytes do APK: commit `49825181343f0ea38e3d73a491c2312d530e079d`.
- Workflow oficial: https://github.com/LucianoToscano/PokeSearch/actions/runs/40854846606 — **success** (9 passos concluídos).
- Release oficial público: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.64-54369
- Arquivo publicado para todos: `PokeSearch-v0.01.64-LT.apk` — **49.413.281 bytes**.
- SHA-256 publicado: `496a5771b1380a16ace5595f41966134bf391eb997a0c90143039f3acc2733cf` (idêntico ao APK QA, não recompilado).
- GitHub `releases/latest` verificado, `prerelease=false`, arquivo `uploaded`, digest e tamanho correspondem exatamente ao esperado.
- O mecanismo do aplicativo `GitHubUpdateCenter` consulta esse endpoint oficial, compara `versionCode` e oferece a instalação mediante confirmação do usuário. Não se força atualização automática.

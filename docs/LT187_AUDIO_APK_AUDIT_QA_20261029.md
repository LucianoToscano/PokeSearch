# LT187 — Otimização dos 36 áudios e auditoria interna (QA)

**Base:** LT186 `0.01.86 / 54391`, APK QA assinado de **31.094.541 bytes**, PR #144.
**Candidata:** LT187 `0.01.87 / 54392`, branch `optimize/lt187-audio-audit-20261029`.

## Implementação

1. `scripts/optimize_audio_lt187.py`: inspeciona os **37 arquivos MP3** e a biblioteca com **36 sons de notificação** em `PokeSoundLibrary.java`. Reencoda apenas áudios com pelo menos 100 KB e economia individual >= 8% usando codec **MP3 libmp3lame** com VBR de qualidade 4. Preserva nome, recurso `R.raw`, formato MP3, taxa de amostragem, número de canais e duração (diferença <= 0,20 s). Faz decodificação integral de cada candidato, rejeitando erro. Os originais podem ser recuperados na versão LT186, sem acrescentar cópias no APK.
2. `scripts/audit_apk_lt187.py`: examina o ZIP do APK final, bytes comprimidos e originais por grupo, tamanho dos 40 recursos maiores, possíveis duplicatas idênticas por SHA-256 e a presença de assets essenciais: interfaces, Doce Raro, sprites normal e shiny. A auditoria **não exclui nada automaticamente**.
3. GitHub Actions monta o APK de QA com R8/shrinkResources já ativados, **certificado permanente Android v2**, verifica os 36 sons, bibliotecas, login, favoritos P1/P2, Doce Raro, OTA, sprites offline, versionCode 54392, SHA-256, versão e economia de bytes frente à LT186. Upload do APK assinado e dos relatórios para testes.

## Limites e segurança

- Sem alteração de nomes dos áudios ou mapeamento das 36 opções, sem retirada de sprites ou arquivos com hash fixado; sem mudanças de API/login, listas, seletores, anúncios, UI ou filtros.
- Arquivos de som escolhidos devem ser validados **auditivamente** no aparelho: efeitos curtos, favoritos com áudio padrão, toque personalizado e som de teste. Validação de CI não garante a percepção sonora no Samsung.
- Permanece obrigatório o **teste físico de instalação como upgrade no Samsung**, com os menus, duas Pokébolas, sessão Google/Discord, shiny, Doce Raro e os alertas reais.
- **Sem merge para main, sem publicação pública, sem distribuição OTA, sem substituição do APK do Drive** antes de homologação funcional real. LT184 continua sendo latest público neste estágio; LT185, LT186 e LT187 são candidatas QA encadeadas.

## Resultado oficial de QA — verificado

- **GitHub Actions SUCCESS:** [execução LT187 #40990477785](https://github.com/LucianoToscano/PokeSearch/actions/runs/40990477785). Compilação Android R8, testes Node/P1-P2/Doce Raro/OTA, sprites offline, assinatura v2 permanente e SHA-256 do APK validados.
- **LT187 APK:** `PokeSearch-v0.01.87-LT187-Size-QA.apk`, `versionCode=54392`, **29.013.661 bytes**.
- **LT186 QA:** 31.094.541 bytes. Economia adicional no APK: **2.080.880 bytes (6,69%)**.
- **LT184 pública:** 49.547.006 bytes. Economia acumulada: **20.533.345 bytes (41,44%)**.
- **Áudios:** 9 MP3 comprimidos; 37 arquivos preservados e 36/36 itens do seletor intactos; ganho nos arquivos de origem **2.080.888 bytes**. A fonte de cada MP3 é recuperável na versão LT186, não se duplicou áudio no APK.
- **Auditoria do APK:** 3.468 entradas. Bytes comprimidos por grupo: desenhos/Android **9.683.046**; sprites offline **6.305.369** (2.877 arquivos); clima **3.887.069** (27 arquivos); áudios/raw **3.740.367** (37 arquivos); ícones de resultados **2.492.807** (37 arquivos); DEX **1.300.660** (1); HTML/JS/outros assets **681.178**; demais recursos/sistema e bibliotecas menores.
- **Duplicatas idênticas grandes:** nenhuma encontrada entre os arquivos acima de 50 KB examinados; não há exclusões adicionais aprovadas de forma segura. `R8` e `shrinkResources` já estão ativados. **Não se removeram bibliotecas, assets Pokémon, sons, ícones, SHA fixos, nem dados de autenticação.**
- Artefato GitHub `PokeSearch-LT187-54392-Size-QA-Assinado`, ID **12949211220**, ZIP **26.731.498 bytes**, contém APK, `LT187-AUDIO-REPORT.json`, `LT187-APK-INVENTORY.json`, `SHA256SUMS.txt`, `SOURCE_COMMIT.txt`, `SIGNING-REPORT.txt`, `PACKAGE-VERSION.txt` e `APK-ENTRIES.txt`.
- **APK originado do commit:** `9a9b301666c1f24ee747a9966684690e7fc31152`. A Action validou o SHA, sem necessidade de inventar o digest no documento.
- **Sem teste físico Samsung, sem merge, sem Release pública, sem OTA para usuários, sem substituição do Google Drive.** A última publicação continua LT184, e a PR #145 permanece draft/QA.

## Checklist obrigatório no Samsung antes da publicação

1. Instalar LT187 sobre LT184 com a mesma assinatura v2, sem desinstalar/zerar dados.
2. Conferir Home claro/escuro, os fundos e logotipos WebP, localização, menus e compactação.
3. Abrir Pokébola 1 e Pokébola 2, pesquisar com API ligada/desligada, conferir sprites/forms, favoritos e alertas independentes.
4. Testar toque curto e longo em Atualizar, os 10 resultados do Doce Raro, despawn e cópia de coordenadas.
5. Login Google/Discord e escolha de treinador 1/2 quando aplicável.
6. Reproduzir todos os 36 sons, testar favorito padrão BR, personalizado e alerta do Android com as duas Pokébolas.
7. Confirmar que o atualizador encontra a release pública anterior e que o pacote OTA não tenta substituir Java/assinatura silenciosamente.
8. Somente após homologação: fazer merge da cadeia LT185→LT186→LT187 e publicar uma versão oficial única e atualizada no GitHub Releases/latest e no mesmo ID público do Drive; verificar SHA e o download real.


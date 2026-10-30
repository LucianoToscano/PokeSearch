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

## Medição

Resultados oficiais ficam no artefato `PokeSearch-LT187-54392-Size-QA-Assinado`, contendo `LT187-AUDIO-REPORT.json`, `LT187-APK-INVENTORY.json`, `SHA256SUMS.txt`, `SOURCE_COMMIT.txt`, `SIGNING-REPORT.txt` e APK. Nada deve ser afirmado como redução concluída antes da Action SUCCESS.

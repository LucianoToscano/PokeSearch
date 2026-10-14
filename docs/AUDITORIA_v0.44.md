# PokeSearch — Auditoria incremental v0.44-beta (14/10/2026)
Base: GitHub main ca794262e9eab8c9e86dc1818c1bea0f4888e9b7 (v0.43-beta), auditoria e capturas apresentadas pelo usuário.

## Correções implementadas no código — evidência física pendente
PS-038 P0 — Barra sobrepunha engrenagem nos cantos: recalcular orientação horizontal ou vertical conforme espaço e popup.
PS-039 P1 — Controles invertidos/desalinhados: grid proporcional de 12 colunas e ordem LTR sempre.
PS-040 P1 — Chevron parecia sem fundo: fundo quase opaco, contorno mais visível, área de toque ampliada.
PS-041 P1 — AUTO sem feedback: confirmação Toast e revisão de geometria dos menus.
PS-042 P1 — Atualizar sem reação perceptível: confirmação imediata do toque e status para busca em andamento; 60 segundos mínimos entre requisições preservados.
PS-043 P2 — Favoritos opacos: painel com alfa 188/255, contorno e dim reduzido; contraste do texto preservado.
PS-044 P1 — Raio 0km aceito com campo vazio: não aceitar campo vazio e exigir modo Coords confirmado.
PS-045 P1 — Parser Java aceitava substring coordenada indevida: validar formato integral.
PS-046 P1 — Mesmo nome pode identificar múltiplos Pokémon: conferir CP na leitura de coordenadas.
PS-047 P2 — fit podia disparar chamadas redundantes: limitar execução a um frame.

## Testes e critérios
CI Node --check, probe-smoke, overlay-ux, Gradle :app:testDebugUnitTest :app:assembleDebug :app:lintDebug, unzip, apksigner, aapt, checksum. Resultado precisa ser lido no GitHub Actions antes da entrega.
Teste físico pendente: abrir/fechar menu nos quatro cantos; toque na engrenagem e ↻, AUTO; fundo da seta, scrolling dos sprites e pass-through no jogo; favoritos e teclado; transparência/blur.
Teste de site real pendente: sessão Google/Discord/vinculação, IV100, GL#1, UL#1, Shiny ON/OFF, Coords/Area e raios 0/50/1000 km.
Os relatórios/arquivos de diagnóstico da sessão não foram recebidos como anexos neste chat até esta revisão; a auditoria existente foi consultada.
Não declarar resolvido experimentalmente o que apenas passou por inspeção estática ou build. Não alterar PvPPokeGo.

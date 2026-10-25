# Checklist Samsung LT87 QA — fundos de Filtros

**APK QA:** `PokeSearch-v0.00.87-LT-Filter-Fundos-QA.apk`, `0.00.87/54290`, SHA-256 `d188bff20191900cc9976fb9b12bca3720a5c0318bf39f75e0d5d9202927617a`.

| Cenário visual | Resultado | Evidência |
|---|---|---|
| Abrir Filtros em tela Samsung: rail tem fundo visível, não preto opaco | PENDENTE | Print |
| Abrir Ordenar, PC, Nível, Clima, Tamanho, Sexo, Forma e outros: subeditor com fundo correto e borda | PENDENTE | Print |
| Editor Visual: alternar claro/escuro; verificar texto e fundo de ambos os painéis | PENDENTE | Print |
| Transparência menu 0%, ~50%, 100%: ambos usam mesma preferência | PENDENTE | Vídeo |
| Abrir aba ▣ perfis 1/2/3: fundo/cores correspondem ao tema e não encobrem filtros | PENDENTE | Vídeo |
| Selecionar filtro quando perfis abertos: ▣ recolhe e editor correto abre | PENDENTE | Vídeo |
| Abrir para esquerda/direita e barra horizontal/vertical; sem cortar fundo/editor | PENDENTE | Vídeo |
| Tocar fora fecha popup, sem impedir outros toques, sem deformar dock | PENDENTE | Vídeo |
| ✓ Confirmar, 🗑 Limpar, × Cancelar: visíveis e funcionais | PENDENTE | Vídeo |
| Confirmar que seleções de filtros são enviadas à API conforme o contrato | PENDENTE | Captura redigida |
| Preservar presets gerais e Favoritos 3+3, preferências anteriores | PENDENTE | Vídeo |
| Regressões LT86: sprites no Pokémon/resultados, ⚲, Despawn, PvP e card arrastável | PENDENTE | Vídeo |
| Get coords, Shiny, GL/UL, login Google, raio 0/215/1000 | PENDENTE | Teste real |

**Importante:** testes automatizados LT87 foram aprovados no GitHub Actions #40168986555, mas as linhas acima exigem execução no Samsung.

# POKESEARCH — ARK LT401 — Continuidade após PokeSearch v0.03.85 LT

Base **obrigatória**: PokeSearch **v0.03.85 LT / versionCode 54592 / label 51400**, publicado em 17/11/2026.
Release: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.85-54592
APK: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.85-54592/PokeSearch-v0.03.85-LT.apk
SHA-256: `608f4d496a94d658138961c2bd2fd1a9b72574d5ebdf13a0610391ba9cb35304`.
Workflow oficial https://github.com/LucianoToscano/PokeSearch/actions/runs/44100824305, completed/success.
PR código #512 squash 3397674c8b7110c22344d8485dc1fd9b6852d76d; PR versão #513 squash 3016a8f87125b06a2cd726c4e36c88afa4de8c2d.

Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/ARK_LT400_SPRITES_POKEDEX_OFICIAL_20261117.md` e `docs/LT400_AUDITORIA_SPRITES_FORMAS_CATEGORIAS_20261117.md`.

## P0: testes físicos e correções
1. Atualizar v0.03.84 para v0.03.85 no Samsung SM-S928B Android 17, sem desinstalar. Conferir Home 4x4/ícones inalterados, overlays P1/P2, busca, login e telas.
2. Importar PGSStats.json privado via SAF; contar ~1.198 Pokémon, 11 ovos, 176 Shiny, **93 Sombrosos e 7 Purificados** na exportação de referência. Não misturar exportações diferentes; dados do JSON permanecem privados.
3. Testar `Minha Pokédex > Sprites`, botões Coleção/GO completo/Legadas, indicadores de progresso, baixar sprite de um exemplar, arquivos ausentes, cancelar, retomar e limpar cache. Estimar espaço (~119MB GO e ~58MB legadas), alertar e testar redes instáveis/429/404, armazenamento cheio, interromper/reabrir a activity, WebView bloqueando URLs externas.
4. Conferir visualmente Giratina Altered/Origin, Deoxys Attack, Ducklett #580, Kyurem Black/White, Eternatus, Minior, Pikachu traje Shiny e distinção de gênero. Não mostrar variante errada como se fosse exata.
5. Verificar categorias Evento visual vs origem em evento, Mega histórica vs estado em jogo, fundo sem classificação, Lendário, Mítico, Pode Evoluir; não igualar à força contagens de instantâneos de datas diferentes.
6. Validar UI 3 colunas, ícones Sombra/Purificado/Shiny, chips, ranks PvP, fundo original/decorativo, notas e histórico, TalkBack, modo escuro, memória e rolagem.

## P1: expansão
- Índice visual pode aumentar por novos commits de catálogo com verificação de licenças e cobertura, sem copiar PNG proprietários ao repositório.
- Cache por pacotes pessoais e melhor gerenciamento de espaço/retry por arquivo. Avaliar exportação/backup local mediante consentimento.
- Etapas de trocas, vendas, leilões e perfil social continuam fora do escopo.

## ARK
Para novas mudanças: auditoria e testes Node, LT169, LT211, LT62 Java, LT173 OTA, Secure beta APK/R8; squash merge, versão monotônica, `release_notes.json`, `release/official-request.json`, workflow de assinatura permanente, publicação pública verificada com SHA/certificado; atualizar AGENTS/Guia Mestre, auditoria e próximo prompt. **Não declarar QA físico sem evidências do aparelho.**

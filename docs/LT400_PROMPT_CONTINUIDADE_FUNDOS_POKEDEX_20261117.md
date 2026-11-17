# POKESEARCH — ARK LT400 — Continuidade após v0.03.84 LT oficial

Base obrigatória: **v0.03.84 LT / versionCode 54591 / label 51399**, publicada em 17/11/2026.
Release: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.84-54591
APK assinado: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.84-54591/PokeSearch-v0.03.84-LT.apk
Código: PR #509, commit b87c6c4e67e496d69734bb2569f42814f5ce51b3.
Publicação: PR #510, commit de02821f19e54eab7079a419a07dee8a03201b00.
Workflow protegido e hash: https://github.com/LucianoToscano/PokeSearch/actions/runs/44089858641, concluído success; digest do APK `ca2f6050819537a6de8476af9dfcbc22e0b0670c9ac5c4c6ca8c8ee20c37f070`.

## Leia antes de qualquer alteração
- `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/ARK_LT399_FUNDOS_POKEDEX_OFICIAL_20261117.md`, `docs/LT399_POKEDEX_FUNDOS_COMPARE_AUDITORIA_20261117.md`.
- Preserve o canal único de release oficial, assinatura permanente, os 16 ícones Home e os overlays P1/P2 e funções de busca. Não usar FastDev como distribuição.
- Os dados do usuário são privados, dois inventários locais, sem upload automático; jamais incluir PGSStats com credenciais no repositório.

## Prioridades P0: QA físico
1. Instalar sobre 0.03.83 LT sem desinstalar no Samsung SM-S928B Android 17; testar toque no ícone Pokédex, entrada no menu, navegação e rolagem.
2. Importar PGSStats pelo seletor SAF; comparar 1.198 Pokémon, 11 ovos, capacidade 1.200, tags, 176 Shiny, 114 registros de fundo e 47 com traje do instantâneo fornecido. Testar ambas as coleções isoladas.
3. Abrir galeria > Baixar todos; verificar 263 imagens e aproximadamente 114,6 MB, download de GitHub via rede real, hash, erros 429 e 404, cancelamento, retomar depois, limpar cache sem apagar coleção/notas.
4. Confirmar fundo original por ID em ficha só quando arte exata for baixada. IDs 28/204/423 devem exibir indisponibilidade, nunca outra arte. Decorações escolhidas não podem ser apresentadas como fundos originais do jogo.
5. Testar filtros interseção, comparar dois/três Pokémon, longos nomes, anotações e histórico importações (ausentes não são necessariamente transferidos), modo escuro e TalkBack.
6. Inspecionar performance e memória, especialmente página galeria, lista de 1.198 Pokémon, bloqueios de armazenamento, fechar tela durante download; evitar vazamentos WebView.

## P1: melhorias posteriores
- Importação opcional de arquivos de fundos do próprio usuário e cache por pacotes de mídia com licenças verificadas.
- Etiquetas manuais próprias e exportação local opt-in de backup.
- Sprite/forma/traje fiel ao ID; não usar modelo 3D ou atlas proprietário sem direito de redistribuição.
- Otimizar download Wi-Fi/celular, retry/backoff e menos redesenho da galeria.
- Nenhuma troca, venda, leilão ou exposição pública neste ciclo, salvo nova decisão expressa.

## Condições de conclusão do ARK
Auditar, corrigir, fazer CI Node, LT169, LT211, LT62 Java, LT173 OTA, PGS QA e APK Secure beta R8; registrar evidências e limitações físicas. Se houver nova alteração aprovada, squash merge main, release_notes, versão monotônica, workflow oficial assinado, verificar asset público/hash/certificado e atualizar Guia Mestre, auditoria e próximo prompt. Não declarar homologação física sem teste real.

# LT402 — Auditoria técnica da Pokédex pessoal (17/11/2026)

## Origem e material conferido
- Base: **v0.03.86 LT / versionCode 54593**, tag pública `v0.03.86-54593`, main `759e3d8b450d29771fd83f134abd93ebbb76b4d1`.
- `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/ARK_LT400_SPRITES_POKEDEX_OFICIAL_20261117.md`, `docs/LT401_HOTFIX_SPRITES_FALTANTES_AUDITORIA_20261117.md`, `docs/ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md`.
- Capturas enviadas pelo proprietário: menu de ícones em círculos e lista de 3 colunas com várias sprites ausentes (losangos). Vídeo de aproximadamente 99 s mostrando consulta individual e ações em lote no Pokémon GO, usado como referência funcional, não como autorização para manipular o jogo.

## Implementação na PR #517
1. **Modelo local:** `PokedexLocalEdits.java` gerencia `slot1.json/slot2.json` e `slotX-local.json` dentro do armazenamento privado do PokeSearch. Ao reimportar, combina mudanças próprias por ID; guarda exclusões locais como tombstones e último lote excluído para **Desfazer**.
2. **Edição:** cadastro manual por espécie, apelido, PC/PS (sem simular custos), IV 0–15, favorito, até três movimentos registrados, segundo ataque carregado, melhores amigos e corações, etiquetas por indivíduo. Isso muda apenas o PokeSearch, nunca o Pokémon GO.
3. **Lotes:** pressionar e segurar um card ativa seleção sem limite de três; comparação ainda limitada a 2–3; aplicação de tag, exclusão múltipla e limpeza integral com confirmação e recuperação do último lote.
4. **Tags:** criação, renomeação e exclusão com remoção das associações locais.
5. **Arquivos:** importar PGSStats e backup compacto validado; exportar cópia JSON local via Android SAF.
6. **Sync:** usuário escolhe deliberadamente o arquivo (SAF), o app persiste URI somente com permissão concedida, verifica SHA-256 na abertura e a cada 3 min *enquanto a tela estiver ativa*. Não solicita acesso global, não lê automaticamente diretórios privados do PGSharp. Se o provedor trocar o documento/URI ou revogar permissão, exigir novo vínculo.
7. **Sprites:** reforçada a regra para que um form ID positivo não catalogado não receba, sem prova, arte da forma base. A LT401 já tinha corrigido IDs numéricos conhecidos e fornecido URLs exatas HTTPS imutáveis; sem internet/cache, variantes sem arte continuam exibindo placeholder honesto em vez de figura errada. **Não afirmar cobertura 100% sem teste físico.**

## Compatibilidade e invariantes
- Preserva as duas coleções, notas, fundos decorativos/originais, filtros, ranks, histórico, ícones Home, PGSharp/Pokemod overlays P1/P2 e assinatura.
- Nenhuma alteração no jogo, troca, venda, leilão ou sincronização de conta remota.
- Arte de terceiros não embutida nem reempacotada no APK.
- Retenção e exclusões locais são por inventário; nenhuma ação automática no sistema de arquivos de outro aplicativo.

## Testes
- Sintaxe JS verificada por parser V8 e todos os IDs estáticos consultados pelo JS presentes no HTML.
- Novo teste Node `app/tests/lt402-inventory-editing-regression.test.js`.
- **CI de PR #517 deve aprovar Node, LT169, LT211, LT62 Java, LT173 OTA, PGS, Secure beta/R8 antes do merge.**
- **Homologação física não realizada neste ambiente:** Samsung Android 17, compatibilidade real do URI SAF com exportação PGSharp, restauração entre instalações, acessibilidade/TalkBack, carregamento real de todas as variantes e sprites Shiny.
- Não concluir publicação oficial se qualquer gate falhar. Reportar PR/release/run/certificado apenas após verificação real.

## Próxima etapa
Homologar no aparelho PGSStats atualizado, diferenças entre slots, exclusão/reversão, backup/reimportação, overlays e sprites 150/487/888/889/645 e variantes Shiny/trajes. Se os checks ficarem verdes, executar fluxo ARK de merge, versão monotônica, release assinada protegida, SHA do APK e registro no Guia Mestre.

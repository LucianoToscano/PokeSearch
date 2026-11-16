# PokeSearch LT378 — ARK completo e release oficial — 16/11/2026

## 1. Resultado oficial comprovado

ARK executado com implementação, regressões, merge na `main`, solicitação monotônica, workflow protegido e verificação do APK público, preservando o histórico.

- **Versão oficial publicada:** `0.03.72` / `versionCode 54579` / label `51378`. Versão anterior oficial: `0.03.71` / code `54578`.
- **Release GitHub:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.72-54579 — `draft=false`, `prerelease=false`, publicação `2026-11-16T23:04:12Z`.
- **APK oficial:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.72-54579/PokeSearch-v0.03.72-LT.apk — `uploaded`, **61.196.759 bytes**.
- **SHA-256 do asset:** `4d1f99f92e81544d13714e18d72edfdb6c6026c929ef9aed69f850cefafc3f0e` — digest retornado pela API GitHub e verificado pelo workflow, sem alegação de recomputação independente local.
- **Certificado permanente SHA-256:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Workflow oficial validou assinante, pacote/versão Android, R8 e integridade; a assinatura não foi rotacionada.
- **Pipeline oficial:** https://github.com/LucianoToscano/PokeSearch/actions/runs/43975405288, `completed/success`, HEAD `5aa764a0f330cacc51598ada03cabdc9b65e2b7b`. Jobs `preflight` e `publish` SUCCESS, incluindo `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash`.

## 2. Código e integração

- **PR #461:** https://github.com/LucianoToscano/PokeSearch/pull/461, HEAD QA `de9663d6859bff0788155efba3feca184001d486`, squash `9d2e06df00033485a9ec865e04e0c367e9059a09` na `main`.
- **PR #462:** https://github.com/LucianoToscano/PokeSearch/pull/462, HEAD QA de release `5b1623a84bea7cdc22046057ec7b43490e09d422`, squash oficial `5aa764a0f330cacc51598ada03cabdc9b65e2b7b` na `main`.
- Pedido oficial `release/official-request.json`: `schema=1`, `enabled=true`, `version=0.03.72`, `code=54579`, `label=51378`, `previous_tag=v0.03.71-54578`, `qa_max_code=54578`; notas correspondentes `minVersionCode=54579`.

## 3. QA validado

**PR de código #461, mesmo SHA: 7/7 SUCCESS**:

1. Node QA #43974228849.
2. LT169 Node completa #43974228989.
3. LT211 core #43974228841.
4. LT62 Android Java #43974228843.
5. LT173 OTA #43974228773.
6. PGS APK debug QA #43974228899.
7. Secure beta/R8 #43974228850.

**PR de publicação #462:** Node QA #43974904752, LT169 #43974904806, LT211 #43974904498, Java #43974904812, OTA #43974904756, Secure beta/R8 #43974904482 e preflight oficial #43974904479 SUCCESS. Workflow pós-merge produziu e verificou o APK com assinatura permanente.

## 4. Correções efetivamente integradas

- **Home:** removida a linha informativa PGS Monitor e seus 18dp reservados, a arte escrita PokeSearch e o subtítulo POKÉMON GO; mantidos emblema, botões, relógio, acesso à conta, chat e funcionalidades do monitor nos menus.
- **Rodapé:** retirado `PoGoCoordinates /search`. Texto da versão instalada agora abre a tag correspondente do GitHub Releases por toque; sem permissão nova.
- **Auto Hunt/Buscar Pokémon:** ao conectar Acessibilidade não ativa automaticamente bolha, monitor ou busca, e não reativa armamento legado. Permite handoff da permissão somente após toque explícito recente (até 120s), consumido uma vez. Preserva modelos, sprites, filtros, opções e outras ações já confirmadas; evita desligar sessão em execução só porque a Home foi recriada.
- **Compatibilidade:** preservadas P1/P2, Conta Visitante/Contas 1/2, OAuth oficial, Busca Inteligente, Sequências, Favoritos, notificações, sprites Minior/P/M/G, Modo Noturno, OTA e assinatura. PR #457 Pokédex pessoal não foi integrada nesta entrega.

## 5. Limitações e continuidade

**Sem homologação física** nesta etapa: Samsung Android 11–14, layout pós-remoção em múltiplas densidades, link de release aberto por toque, reconexão/reboot de Acessibilidade e token de 120s, Auto Hunt em PGSharp e Pokemod separadamente, OAuth real Google/Discord, gesto de captura e acessibilidade TalkBack. Gates automatizados comprovam regressão de código, construção e assinatura, mas não validam execução em aparelho. Instalação depende de consentimento Android.

Não misturar supervisão do PokeSearch, caminhada externa, tentativa de captura e captura confirmada. Não declarar captura ou execução física inexistente.

Auditoria técnica: [LT378_AUDITORIA_HOME_AUTOHUNT_20261116.md](LT378_AUDITORIA_HOME_AUTOHUNT_20261116.md). Próximo prompt: [LT379_PROMPT_CONTINUIDADE_APOS_LT378_20261116.md](LT379_PROMPT_CONTINUIDADE_APOS_LT378_20261116.md). Regras permanentes registradas em AGENTS e Guia Mestre. **ARK LT378 concluído em código, testes automatizados, merge e release oficial, com homologação física pendente.**

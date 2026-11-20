# ARK LT409 — PokeSearch v0.03.94 LT — Auto Hunt simples (20/11/2026)

**RELEASE OFICIAL PUBLICADA E VERIFICADA:** PokeSearch **v0.03.94 LT / versionCode 54601 / label 51409**, [release pública estável](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.94-54601), publicada **2026-11-20T07:38:54Z**, `draft=false`, `prerelease=false`. [APK oficial permanente assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.94-54601/PokeSearch-v0.03.94-LT.apk): **61.767.162 bytes**, asset `uploaded`, digest SHA-256 publicado `9fb65f1e3f747355b7dfaed2e6318b889713c71bf42aa71b5c0f715e9854f505` (API GitHub e workflow; não recalculado separadamente do APK baixado).

**Workflow protegido de publicação:** [#44696085963](https://github.com/LucianoToscano/PokeSearch/actions/runs/44696085963) `completed/success`, preflight/publish success, fonte `0cbba1a84346b31eb197857c095163da53f52716`. Pipeline validou Node/OTA, assets, Android R8, assinatura permanente Android v2 e certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, checksum, upload da release e integridade dos bytes/digest da API.

## PRs e provas de qualidade
- **Código/UX:** [PR #538](https://github.com/LucianoToscano/PokeSearch/pull/538), squash `4bef469077314ef894c7652fab0190c44a235960`, head final `d1129e1b92d2098f344fea74236189e9ea7fce3d`.
- **Pedido de release:** [PR #539](https://github.com/LucianoToscano/PokeSearch/pull/539), squash `0cbba1a84346b31eb197857c095163da53f52716`, head `ca55b5cdf8471647e172ecf2ab6ecc49ed41cda1`, que alterou `release/official-request.json` e `app/src/main/assets/release_notes.json`.
- Contratos regressivos LT345, LT369, LT370, LT371, LT408 revisados/testados, compilação Java, Node, LT169, LT211, LT62, LT173, PGS Buscas Auto QA e Secure R8 `completed/success` nos heads finais das PRs.
- Distribuição apenas `com.lucianotoscano.pokesearch` na assinatura oficial; nenhum canal FastDev/DEV/preview.

## Causa do problema relatado
Na v0.03.93, para chegar às Missões GPX era necessário abrir a busca, ir à aba Ação, expandir Avançado, selecionar Auto Hunt e entrar em Ajustes para localizar o botão GPX. Também havia dezenas de controles de modos/tempo/notificações simultâneos, o rodapé Iniciar permanecia ambíguo e a tela GPX exibia sete verificações e muitos botões de uma vez.

## Melhoria LT409 realmente entregue
- A bolha de busca abre a aba **Ação**, com três escolhas iniciais: `Missões GPX · abrir`, `Buscar Pokémon · configurar`, `Supervisão noturna · PGSharp`.
- O botão Missões GPX abre **diretamente** o planejador local, independente de selecionar o modo HUNT em Avançado; o atalho antigo escondido em Ajustes foi retirado.
- Ações de busca Pokémon e supervisão noturna ficam em suas próprias seções expansíveis. `⚙ Opções técnicas` mantém o modo legado Monitorar/Clicar/Auto Hunt/Sequência e configurações avançadas.
- Botão global `Iniciar` desabilitado enquanto a pessoa está no seletor ou na seção exclusiva da supervisão: não deve acionar acidentalmente a busca de Pokémon ao querer GPX.
- Na tela GPX, agora são prioritários: **Importar GPX**, resumo de progresso, próximo ponto, copiar coordenada e avançar. Registros de pesquisa e resgate, checklist de sete condições e distâncias/projeção matemática estão sob expansores recolhidos por padrão.
- Mantidos confirmação explícita e reversível de pesquisa recebida e recompensa efetivamente resgatada, contagem somente do que foi registrado manualmente, armazenamento GPX privado/SAF e todos os controles de segurança.
- Preservados ícones/Home, P1/P2, contas, login, dois inventários, Pokédex, sprites, filtros, fundos, notas, PGSStats e redes/credenciais.

## Limites e pendências transparentes
- **O Auto Hunt de missões ainda NÃO é automático nem executa farm noturno.** Esta atualização é de organização da interface: não teleporta, não gira Poképaradas, não realiza lançamento excelente, não exclui pesquisas erradas nem resgata doces pelo jogo.
- Supervisor noturno observa o PGSharp, não inicia Autowalk ou Virtual Go Plus e não garante funcionamento com tela bloqueada.
- As tarefas/recompensas do GPX são candidatas e podem expirar; as 500 coordenadas do arquivo antigo não comprovam 500 pesquisas ativas.
- **Sem teste físico ou visual no Samsung Android 17** no momento da publicação; falta homologar no aparelho instalado: legibilidade em tela pequena, menu Ação, abertura de GPX, importar GPX, expandir/recolher, progresso após reinício, ausência de toque indevido e compatibilidade OTA.
- Automação via terceiros/localização simulada pode violar regras do jogo e representar risco de penalidades.
- Instalação sobre a versão anterior exige confirmação do Android; nenhum controle remoto do aparelho foi realizado.

## Próxima evolução de verdade
Separar escopo de planejador de eventual executor; antes de prometer um farm sem supervisão, exigir identificação de pesquisas verificada no jogo, integração cliente/gestos comprovada, checkpoints e parada diante de qualquer tela inesperada ou aviso de conta. Nunca atribuir automaticamente doces por coordenadas ou afirmar zero risco.

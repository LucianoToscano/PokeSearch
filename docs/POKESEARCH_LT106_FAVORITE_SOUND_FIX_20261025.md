# LT106 — favoritos aparecem sem emitir som (25/10/2026)

## Backup de segurança
- Repositório `LucianoToscano/PokeSearch`, base da main `72882b0a40d64a670dfa28fa4a4859a6e0c9e558`.
- Branch de backup **não alterar**: `backup/lt105-before-favorite-alert-audio-20261025`.
- Branch de implementação: `fix/lt106-favorite-notification-audio-20261025`. Não perder a LT105 com 2.050 imagens offline e os dois overlays LT104.

## Diagnóstico do código anterior
- Android 8+ fixa o som de um `NotificationChannel` na primeira criação. Reusar IDs antigos `pokesearch_watch_sound_v1` ou `pokesearch_fav_custom_v2_*` podia manter um canal silenciado, mesmo que o usuário tenha escolhido **Som** no PokeSearch.
- O menu de áudio reproduzia uma *prévia*, mas não oferecia um teste do **canal de notificação real**, dificultando saber se o problema era canal, permissão, volume, OFF ou Não Perturbe.
- Notificações gerais de Pokémon usavam ID `74`, em conflito com o `startForeground(74,...)` da **segunda Pokébola**. Conflito foi removido para proteger o serviço flutuante.

## Correções
- `WatchAlerts.soundChannelId`: novos canais `pokesearch_fav_sound_v3_*`, derivados do áudio selecionado. O nome do canal é compartilhado quando várias espécies usam a mesma faixa; som individual mantém identificador por espécie. Nenhuma tentativa de sobrescrever canais que o Android permite ao usuário personalizar.
- `WatchAlerts.send`: verifica permissão, modo OFF, canal bloqueado ou silenciado, e registra `lastWatchAlertError` em `prefs` sem incluir nome/coords/conta. Não contorna Não Perturbe nem silenciamento.
- `WatchAlerts.soundDiagnostic`: informa, em teste iniciado pelo usuário, se o Android está sem permissão, em OFF/Sem som, sem volume, canal bloqueado ou silenciado. Não exige inventar Pokémon ou simular encontro.
- `OverlayQuickMenus.showTone`: **🔔 Testar notificação de favorito** na mesma janela flutuante, usando `WatchAlerts.test` e mostrando diagnóstico. Prévia, 36 sons, favorito BR padrão e botão ✓ Usar áudio continuam.
- `OverlayService`: feedback do teste também exibe diagnóstico; aviso geral usa ID `12074` para nunca substituir a notificação persistente da segunda Pokébola.
- `WatchAlerts.match`: permanece disparado apenas para encontro novo, verificado, dentro dos critérios do filtro e com espécie correspondente à lista de favoritos. Limite de 10 resultados por Pokébola e despawn preservados.

## Testes e distribuição
- Teste `app/tests/lt106-favorite-notification-audio.test.js`: migração de canais, correspondência, diagnóstico, não contornar OFF/sem som/permissão e IDs distintos.
- CI LT106 reconstrói os 2.050 sprites verificáveis da PokeAPI e assina APK de teste `0.00.106` / `54309`, com certificado permanente, R8, APK não depurável e verificação SHA-256. Pré-release de QA apenas; não sobrescreve LT103 oficial nem arquivo compartilhado no Drive.
- **Critérios de aceite no Samsung:** favoritar um Pokémon, deixar Som ON em Pokémon Favoritos, selecionar áudio e confirmar; usar botão de teste, verificar canal de som do Android; aguardar resultado novo de favorito confirmado nas duas Pokébolas; confirmar áudio no modo Som, notificação silenciosa no modo Sem som e ausência de alerta no modo OFF. Confirmar 36 faixas e volume / DND.
- CI passou != teste físico homologado.

# LT261 — Ordenação automática quando a localização muda de estado

Data de referência: 06/11/2026. Base: LT260 · 0.02.60 · versionCode 54464.

## Regra solicitada e aprovada
A ordenação automática é **um padrão de primeira transição**, não uma imposição permanente:

| Evento no filtro de Localização | Ordenação automática |
|---|---|
| Sem localização → aplicar coordenadas válidas + raio | `Distance (nearest)` |
| Com localização → remover/apagar | `Despawn (longest)` |
| Usuário escolhe manualmente CP/IV/Nível/Despawn/Distância depois da troca | Sua escolha prevalece |
| Mudar coordenadas ou raio, mantendo Localização ligada | Manter ordenação escolhida manualmente |
| Reaplicar localização idêntica ou tocar Limpar com localização já apagada | Não reiniciar uma ordenação manual válida |
| Colar coordenadas inválidas | Rejeitar sem mexer nos filtros e no sort |
| Reiniciar o aplicativo | Restaurar opção persistida, sem disparar a troca de estado novamente |
| Escolher Distância quando a localização não está ativa | Impedir, porque não existe centro de busca |

## Implementação
- `OverlayService.Bridge.persistLocationToggleSort(enabled,repairInvalidDistance)` aplica **uma vez** `Distance (nearest)` no OFF→ON e **uma vez** `Despawn (longest)` no ON→OFF, limpando apenas o campo pendente `sortBy` de `clearExtraKeys`. O restante de `extraFiltersJson` (Pokémon, IV, clima, nível, CP, tamanho, gênero etc.) é preservado e gravado na preferência existente.
- `Bridge.setLocation` só invoca o padrão após validar as coordenadas; mudança de coordenadas/raio com a localização já ligada não o altera. Repetir Limpar restaura Despawn apenas se houver ordenação Distância inválida de uma versão antiga.
- Guard da configuração: Distância requer **localização habilitada com coordenadas válidas**; não exige `locationVerified` já confirmada após o resultado, evitando que a seleção automática seja desfeita enquanto a pesquisa está verificando a origem.
- `dock.html` sincroniza a ordenação exibida no rascunho do menu **somente quando o estado ON/OFF muda**; depois disso, alterações manuais continuam livres. O comportamento usa o serviço compartilhado das duas Pokébolas e os seus estados independentes.

## Testes e status
- `app/tests/lt261-location-auto-sort-toggle.test.js`: valida cenários OFF→ON, ON→OFF, manual, reaplicar, alterar coordenadas/raio, limpar repetido, inválido, recuperação após reinício e paridade P1/P2.
- `app/tests/lt260-shellos-location-sort-raid.test.js` adaptado à nova função sem perder regressão das 8 sprites Sea e do botão Raides.
- **QA e merge concluídos:** seis gates verdes na revisão `52965e6a5e4d46ec4ce0ad5b69e3bd488e2f34a1` ([PR #241](https://github.com/LucianoToscano/PokeSearch/pull/241)); [Node completo #42189424363](https://github.com/LucianoToscano/PokeSearch/actions/runs/42189424363) incluindo `LT261 PASS`, QA core, Java, screenshots P/M/G e OTA aprovados. Merge realizado na `main`: `fd6bf758541a4dbd1c2953a1bfa4fe3c8b15b4df`.
- **APK oficial assinado e publicado:** [GitHub Actions #42189727080](https://github.com/LucianoToscano/PokeSearch/actions/runs/42189727080) com preflight, regressões, build, validação de assinatura permanente v2, pacote/versão, SHA e publicação; [v0.02.61-54465](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.61-54465) estável pública em 2026-11-06T08:47:12Z. APK **28.604.012 bytes**, SHA-256 `8e1fe9a510de794807db740268cd2eaee3823e7f2325db95ab1905967a416f6a`. Instalador detectável pelo atualizador do PokeSearch via `releases/latest`, mediante autorização do Android.
- **Pendente físico:** ainda não foi observada instalação e testagem do menu de Distância/Despawn nas duas Pokébolas do Samsung. A versão LT260 continua disponível para rollback.

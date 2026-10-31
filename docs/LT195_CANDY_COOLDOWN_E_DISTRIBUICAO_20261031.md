# LT195 — Cooldown estimado dos Doces Raros (31/10/2026)

## Comportamento
- **Toque curto no doce**: preserva cópia das coordenadas e marca aquela coordenada como ponto de referência, com horário local da cópia.
- Cada outro doce da lista calcula distância **entre o último doce copiado e o destino** via Haversine, e o prazo recomendado pela tabela fornecida pelo usuário; o dado de distância da pesquisa é relativo ao centro de busca e **não** serve como distância entre saltos.
- Temporizador visível e compacto sob o despawn: **vermelho** acima de 30 s, **rosa** nos últimos 30 s, **verde** após o prazo; a referência exibe "● Orig.". Duração de 0 a 2 horas. Contagem a cada segundo, sem alterar despawn ou a frequência de consulta ao provedor.
- Mantém referência e timestamp em SharedPreferences privativos, mesmo com app reaberto, até 24 horas; a opção ↺ em Informações limpa somente o contador. Não compartilha localização com P1/P2 nem usa GPS.
- O timer é **estimativa informativa** a partir de cliques. Copiar coordenadas não prova teleporte, captura, spin ou outro evento do jogo. Não promete aprovação de interação pela Niantic.
- Toque no doce seguinte estabelece nova referência para os itens restantes. Cada destino recebe sua própria estimativa. Não altera histórico de cópias, permissões, limites de busca/cota, JWT, sprites ou reprodução de alertas.

## Tabela em metros → segundos
0–9,99: 0; 10–99,99: 3; 100–499,99: 15; 500–999,99: 30;
1–4,999 km: 120; 5–9,999 km: 360; 10–24,999 km: 660;
25–29,999 km: 840; 30–64,999 km: 1320; 65–80,999 km: 1500;
81–99,999 km: 2100; 100–249,999 km: 2700; 250–499,999 km: 3600;
500–749,999 km: 4500; 750–999,999 km: 5400; >=1000 km: 7200.

## QA e governança
- Testes executáveis `CandyCooldownPolicyTest.java` e `lt195-candy-next-hop-cooldown.test.js`, com cobertura da tabela, precisão Haversine, persistência, início, fim, reset e alinhamento dos overlays.
- Inclui todas as correções da LT194: paridade de IV, proteção contra falsos zeros e limite local de 10 por Pokébola.
- **Versão prevista** LT195 / 0.01.95 / versionCode 54400, assinatura v2 permanente (certificado SHA-256: 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e).
- A build oficial, merge, entrega ao Drive e homologação física devem ser registrados apenas quando suas verificações concluírem; não inventar datas, links, hashes ou resultados.

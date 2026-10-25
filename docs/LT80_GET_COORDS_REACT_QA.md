# LT80 — Samsung Get coords / React re-render

Evidência: captura de Swablu Shiny #333 ♀ PC 494 Nv 21 IV 100% 15/15/15 em Ostend, Bélgica. probe.js/readCoords retornava pending=false imediatamente quando cartão sumia/reorganizava durante o clique, bloqueando o polling de recuperação. A imagem não comprova a causa exata (pode ser cartão transitório ou duplicidade de identidade).

QA: retry limitado pelo Java a 10 leituras, intervalo 750ms; no resultado final não copia se identidade não ficar inequívoca. Verificação de nome, PC, número, local e, se presentes, IV, gênero e nível; sem GPS, sem links globais, sem fallback para outro Pokémon. Testes cobrindo reidentificação do Swablu e ambiguidade. Branch fix/lt80-coords-react-rebind-samsung-20261024, versão 0.00.80/54283 apenas QA, sem publicação no Drive/GitHub. A versão pública 0.00.79 continua intacta até homologação física no Samsung.

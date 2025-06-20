// afiliados.js - Lógica para links de afiliado com prioridade e menor preço

// Simulação de links afiliados por companhia + origem/destino/data
const fontesAfiliadas = [
  {
    nome: "Trip.com",
    gerar: (origem, destino, data) =>
      `https://www.trip.com/flights/${origem}-${destino}?date=${data}&affiliateid=YOUR_ID`,
    prioridade: 1
  },
  {
    nome: "Kiwi.com",
    gerar: (origem, destino, data) =>
      `https://www.kiwi.com/en/search/results/${origem}/${destino}/${data}?affilid=YOUR_ID`,
    prioridade: 2
  },
  {
    nome: "WayAway",
    gerar: (origem, destino, data) =>
      `https://wayaway.tp.st/search?from=${origem}&to=${destino}&depart=${data}`,
    prioridade: 3
  }
];

// Escolher a melhor opção com base na prioridade (simples, sem fetch real)
function escolherMelhorAfiliado(origem, destino, data) {
  // Em produção: aqui poderia testar resposta ou preço real via fetch
  const escolhido = fontesAfiliadas.sort((a, b) => a.prioridade - b.prioridade)[0];
  return escolhido.gerar(origem, destino, data);
}

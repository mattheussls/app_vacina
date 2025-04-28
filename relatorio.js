let registros = [];

document.addEventListener('DOMContentLoaded', async () => {
  registros = await getAllRegistros();
  gerarGraficos();

  document.getElementById('btnFiltrar').addEventListener('click', gerarGraficos);
});

function gerarGraficos() {
  const inicio = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;

  let filtrados = registros;

  if (inicio) {
    filtrados = filtrados.filter(r => new Date(r.data_aplicacao.split('/').reverse().join('-')) >= new Date(inicio));
  }
  if (fim) {
    filtrados = filtrados.filter(r => new Date(r.data_aplicacao.split('/').reverse().join('-')) <= new Date(fim));
  }

  gerarGraficoFaixaEtaria(filtrados);
  gerarGraficoRegistrosPorDia(filtrados);
  gerarGraficoProporcao(filtrados);
}

function gerarGraficoFaixaEtaria(registros) {
  const ctx = document.getElementById('graficoFaixaEtaria').getContext('2d');
  if (window.g1) window.g1.destroy();

  const faixas = {'0-1 ano': 0, '2-5 anos': 0, '6-10 anos': 0, '11+ anos': 0};

  registros.forEach(r => {
    const idade = r.idade_cidadao;
    if (idade <= 1) faixas['0-1 ano']++;
    else if (idade <= 5) faixas['2-5 anos']++;
    else if (idade <= 10) faixas['6-10 anos']++;
    else faixas['11+ anos']++;
  });

  window.g1 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(faixas),
      datasets: [{
        label: 'Cidadãos',
        data: Object.values(faixas),
        backgroundColor: '#0d6efd'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          color: '#000',
          anchor: 'end',
          align: 'top'
        }
      },
      scales: { y: { beginAtZero: true } }
    },
    plugins: [ChartDataLabels]
  });
}

function gerarGraficoRegistrosPorDia(registros) {
  const ctx = document.getElementById('graficoRegistrosPorDia').getContext('2d');
  if (window.g2) window.g2.destroy();

  const porDia = {};

  registros.forEach(r => {
    const data = r.data_aplicacao;
    porDia[data] = (porDia[data] || 0) + 1;
  });

  const datas = Object.keys(porDia).sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

  window.g2 = new Chart(ctx, {
    type: 'line',
    data: {
      labels: datas,
      datasets: [{
        label: 'Registros',
        data: datas.map(d => porDia[d]),
        backgroundColor: '#198754',
        borderColor: '#198754',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          color: '#000',
          anchor: 'end',
          align: 'top'
        }
      },
      scales: { y: { beginAtZero: true } }
    },
    plugins: [ChartDataLabels]
  });
}

function gerarGraficoProporcao(registros) {
  const ctx = document.getElementById('graficoProporcao').getContext('2d');
  if (window.g3) window.g3.destroy();

  let total = 0;
  let completos = 0;

  registros.forEach(r => {
    const vacinas = r.vacinas || {};
    const tomadas = Object.values(vacinas).filter(v => v === 1).length;
    const previstas = Object.keys(vacinas).length;

    if (tomadas === previstas && previstas > 0) {
      completos++;
    }
    total++;
  });

  window.g3 = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Totalmente Vacinados', 'Parcialmente Vacinados'],
      datasets: [{
        data: [completos, total - completos],
        backgroundColor: ['#198754', '#ffc107']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          color: '#000',
          formatter: (value, ctx) => {
            const sum = ctx.chart._metasets[0].total;
            const percentage = (value / sum * 100).toFixed(1) + '%';
            return percentage;
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

let todosRegistros = [];
let vacinasDisponiveis = [];
let modalCadastro;

document.addEventListener('DOMContentLoaded', () => {
  const nomeProfissional = localStorage.getItem('nome_profissional') || 'Usuário';
  document.getElementById('nomeProfissional').textContent = nomeProfissional;

  modalCadastro = new bootstrap.Modal(document.getElementById('cadastroModal'));

  carregarRegistros();

  // Máscara de CPF
  const cpfInput = document.getElementById('cpfCidadao');
  IMask(cpfInput, {
    mask: '000.000.000-00'
  });

  document.getElementById('addRegistroBtn').addEventListener('click', () => {
    document.getElementById('cadastroForm').reset();
    document.getElementById('vacinasChecklist').innerHTML = '';
    modalCadastro.show();
  });

  document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cpfCidadao = document.getElementById('cpfCidadao').value;
    if (!validarCPF(cpfCidadao)) {
      alert('CPF inválido!');
      return;
    }

    const nascimento = document.getElementById('dataNascimento').value;
    const idade = calcularIdadeAnos(nascimento);
    const idadeMeses = calcularIdadeMeses(nascimento);

    const vacinasSelecionadas = coletarVacinas();

    const registro = {
      profissional: nomeProfissional,
      cpf_profissional: localStorage.getItem('cpf_profissional'),
      data_aplicacao: new Date().toLocaleDateString('pt-BR'),
      nome_cidadao: document.getElementById('nomeCidadao').value,
      cpf_cidadao: cpfCidadao,
      cns_cidadao: document.getElementById('cnsCidadao').value,
      data_nascimento: nascimento,
      idade_cidadao: idade,
      idade_meses: idadeMeses,
      vacinas: vacinasSelecionadas
    };

    try {
      const registroComId = await saveRegistro(registro);
      todosRegistros.push(registroComId);
      modalCadastro.hide();
      alert('Registro salvo com sucesso!');
      await carregarRegistros();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o registro.');
    }
  });

  document.getElementById('dataNascimento').addEventListener('change', () => {
    const nascimento = document.getElementById('dataNascimento').value;
    const idadeMeses = calcularIdadeMeses(nascimento);
    gerarChecklistVacinas(idadeMeses);
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });
});

async function carregarRegistros() {
  const lista = document.getElementById('listaRegistros');
  lista.innerHTML = '';

  const registros = await getAllRegistros();
  todosRegistros = registros;

  registros.forEach((registro) => {
    const totalVacinasDisponiveis = Object.keys(registro.vacinas || {}).length;
    const vacinasTomadas = Object.values(registro.vacinas || {}).filter(v => v === 1).length;
    const porcentagem = totalVacinasDisponiveis > 0 ? Math.round((vacinasTomadas / totalVacinasDisponiveis) * 100) : 0;
    const classeCirculo = porcentagem === 100 ? 'verde' : 'amarelo';
    const coberturaTexto = porcentagem === 100 ? 'TOTAL' : 'PARCIAL';
    const badgeCor = porcentagem === 100 ? 'success' : 'warning text-dark';

    const card = `
      <div class="col-md-6 col-lg-4">
        <div class="card text-dark h-100 shadow-sm" style="cursor:pointer" onclick="window.location.href='detalhar_cidadao.html?id=${registro.id}'">
          <div class="card-body d-flex flex-column justify-content-between">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="card-title mb-0">${registro.nome_cidadao}</h5>
              <div class="mini-circulo ${classeCirculo}">${porcentagem}%</div>
            </div>
            <p class="card-text mb-1">CPF: ${registro.cpf_cidadao}</p>
            <p class="card-text mb-1">Idade: ${registro.idade_cidadao} anos</p>
            <p class="card-text mb-2">Data: ${registro.data_aplicacao}</p>
            <span class="badge bg-${badgeCor}">Cobertura: ${coberturaTexto}</span>
          </div>
        </div>
      </div>
    `;
    lista.innerHTML += card;
  });
}

function calcularIdadeAnos(dataNascimento) {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

function calcularIdadeMeses(dataNascimento) {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  return (hoje.getFullYear() - nascimento.getFullYear()) * 12 + (hoje.getMonth() - nascimento.getMonth());
}

function gerarChecklistVacinas(idadeMeses) {
  const checklist = document.getElementById('vacinasChecklist');
  checklist.innerHTML = '';
  vacinasDisponiveis = [];

  regrasVacinas.forEach(regra => {
    if (idadeMeses >= regra.idadeMeses) {
      regra.vacinas.forEach(vacina => {
        const idVacina = `${vacina.nome} (${vacina.dose})`;
        vacinasDisponiveis.push(idVacina);
        checklist.innerHTML += `
          <li class="form-check">
            <input class="form-check-input" type="checkbox" id="vacina-${idVacina}">
            <label class="form-check-label" for="vacina-${idVacina}">${vacina.nome} (${vacina.dose})</label>
          </li>
        `;
      });
    }
  });
}

function coletarVacinas() {
  const vacinas = {};
  vacinasDisponiveis.forEach(vacina => {
    const input = document.getElementById(`vacina-${vacina}`);
    vacinas[vacina] = input && input.checked ? 1 : 0;
  });
  return vacinas;
}

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

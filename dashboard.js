let todosRegistros = [];
let vacinasDisponiveis = [];
let modalCadastro;

document.addEventListener('DOMContentLoaded', () => {
  const nomeProfissional = localStorage.getItem('nome_profissional') || 'Usuário';
  document.getElementById('nomeProfissional').textContent = nomeProfissional;

  modalCadastro = new bootstrap.Modal(document.getElementById('cadastroModal'));

  carregarRegistros();

  document.getElementById('addRegistroBtn').addEventListener('click', () => {
    document.getElementById('cadastroForm').reset();
    document.getElementById('vacinasChecklist').innerHTML = '';
    modalCadastro.show();
  });

  document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nascimento = document.getElementById('dataNascimento').value;
    const idade = calcularIdadeAnos(nascimento);
    const idadeMeses = calcularIdadeMeses(nascimento);

    const vacinasSelecionadas = coletarVacinas();

    const registro = {
      profissional: nomeProfissional,
      cpf_profissional: localStorage.getItem('cpf_profissional'),
      data_aplicacao: new Date().toLocaleDateString('pt-BR'),
      nome_cidadao: document.getElementById('nomeCidadao').value,
      cpf_cidadao: document.getElementById('cpfCidadao').value,
      cns_cidadao: document.getElementById('cnsCidadao').value,
      data_nascimento: nascimento,
      idade_cidadao: idade,
      idade_meses: idadeMeses,
      vacinas: vacinasSelecionadas
    };

    try {
      const registroComId = await saveRegistro(registro); // salva e recebe com ID
      todosRegistros.push(registroComId); // adiciona no array
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

  if (registros.length > 0) {
    document.body.style.background = "#f8f9fa";
  } else {
    document.body.style.background = "url('img/fundo.png') no-repeat center center fixed";
    document.body.style.backgroundSize = "contain";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundRepeat = "no-repeat";
  }

  registros.forEach((registro) => {
    const card = `
      <div class="col-md-6 col-lg-4">
        <div class="card text-dark h-100 shadow-sm" style="cursor:pointer" onclick="window.location.href='detalhar_cidadao.html?id=${registro.id}'">
          <div class="card-body">
            <h5 class="card-title">${registro.nome_cidadao}</h5>
            <p class="card-text">
              CPF: ${registro.cpf_cidadao}<br>
              Idade: ${registro.idade_cidadao} anos<br>
              Data: ${registro.data_aplicacao}
            </p>
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

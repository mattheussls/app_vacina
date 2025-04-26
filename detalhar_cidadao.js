let registroCidadao;
let idCidadao;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  idCidadao = parseInt(params.get('id'));

  const registros = await getAllRegistros();
  registroCidadao = registros.find(reg => reg.id === idCidadao);

  if (!registroCidadao) {
    alert('Registro não encontrado!');
    window.location.href = 'dashboard.html';
    return;
  }

  preencherDados();

  document.getElementById('voltarBtn').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  document.getElementById('editarBtn').addEventListener('click', () => {
    preencherFormularioEdicao();
    new bootstrap.Modal(document.getElementById('editarModal')).show();
  });

  document.getElementById('editarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarAlteracoes();
    bootstrap.Modal.getInstance(document.getElementById('editarModal')).hide();
    preencherDados();
  });

  document.getElementById('excluirBtn').addEventListener('click', async () => {
    const senha = prompt('Digite a senha para excluir o registro:');
    if (senha === 'ncis@sesma') {
      await deleteRegistro(idCidadao);
      alert('Registro excluído com sucesso!');
      window.location.href = 'dashboard.html';
    } else {
      alert('Senha incorreta!');
    }
  });
});

function preencherDados() {
  const div = document.getElementById('dadosCidadao');

  let vacinasAplicadas = '';
  let vacinasFaltantes = '';
  let vacinasProximas = '';

  const idadeMeses = registroCidadao.idade_meses;

  regrasVacinas.forEach(regra => {
    regra.vacinas.forEach(vacina => {
      const idVacina = `${vacina.nome} (${vacina.dose})`;

      if (idadeMeses >= regra.idadeMeses) {
        if (registroCidadao.vacinas && registroCidadao.vacinas[idVacina] === 1) {
          vacinasAplicadas += `
            <tr>
              <td>${vacina.nome}</td>
              <td>${vacina.dose}</td>
              <td>${regra.descricao}</td>
            </tr>
          `;
        } else {
          vacinasFaltantes += `
            <tr>
              <td>${vacina.nome}</td>
              <td>${vacina.dose}</td>
              <td>${regra.descricao}</td>
            </tr>
          `;
        }
      } else {
        vacinasProximas += `
          <tr>
            <td>${vacina.nome}</td>
            <td>${vacina.dose}</td>
            <td>${regra.descricao}</td>
          </tr>
        `;
      }
    });
  });

  div.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">${registroCidadao.nome_cidadao}</h5>
        <p class="card-text">
          CPF: ${registroCidadao.cpf_cidadao}<br>
          CNS: ${registroCidadao.cns_cidadao}<br>
          Data de Nascimento: ${registroCidadao.data_nascimento}<br>
          Idade: ${registroCidadao.idade_cidadao} anos<br>
          Profissional: ${registroCidadao.profissional}<br>
          Data da Aplicação: ${registroCidadao.data_aplicacao}
        </p>

        <h4 class="section-title">Vacinas Aplicadas</h4>
        ${gerarTabelaVacinas(vacinasAplicadas, "Nenhuma vacina aplicada")}

        <h4 class="section-title">Vacinas Não Aplicadas</h4>
        ${gerarTabelaVacinas(vacinasFaltantes, "Nenhuma vacina faltante")}

        <h4 class="section-title">Próximas Vacinas</h4>
        ${gerarTabelaVacinas(vacinasProximas, "Nenhuma vacina futura")}
      </div>
    </div>
  `;
}

function gerarTabelaVacinas(conteudo, mensagemVazia) {
  return `
    <div class="table-responsive">
      <table class="table table-bordered table-striped">
        <thead class="table-light">
          <tr>
            <th>Vacina</th>
            <th>Dose</th>
            <th>Faixa Etária</th>
          </tr>
        </thead>
        <tbody>
          ${conteudo || `<tr><td colspan="3">${mensagemVazia}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function preencherFormularioEdicao() {
  document.getElementById('editNomeCidadao').value = registroCidadao.nome_cidadao;
  document.getElementById('editCpfCidadao').value = registroCidadao.cpf_cidadao;
  document.getElementById('editCnsCidadao').value = registroCidadao.cns_cidadao;
  document.getElementById('editDataNascimento').value = registroCidadao.data_nascimento;

  const cpfInput = document.getElementById('editCpfCidadao');
  IMask(cpfInput, { mask: '000.000.000-00' });

  const idadeMeses = calcularIdadeMeses(registroCidadao.data_nascimento);
  const checklist = document.getElementById('editarVacinasChecklist');
  checklist.innerHTML = '';

  regrasVacinas.forEach(regra => {
    if (idadeMeses >= regra.idadeMeses) {
      regra.vacinas.forEach(vacina => {
        const idVacina = `${vacina.nome} (${vacina.dose})`;
        const checked = registroCidadao.vacinas[idVacina] === 1 ? 'checked' : '';
        checklist.innerHTML += `
          <li class="form-check">
            <input class="form-check-input" type="checkbox" id="edit-vacina-${idVacina}" ${checked}>
            <label class="form-check-label" for="edit-vacina-${idVacina}">${vacina.nome} (${vacina.dose})</label>
          </li>
        `;
      });
    }
  });
}

async function salvarAlteracoes() {
  registroCidadao.nome_cidadao = document.getElementById('editNomeCidadao').value;
  registroCidadao.cpf_cidadao = document.getElementById('editCpfCidadao').value;
  registroCidadao.cns_cidadao = document.getElementById('editCnsCidadao').value;
  registroCidadao.data_nascimento = document.getElementById('editDataNascimento').value;
  registroCidadao.idade_cidadao = calcularIdadeAnos(registroCidadao.data_nascimento);
  registroCidadao.idade_meses = calcularIdadeMeses(registroCidadao.data_nascimento);

  const novasVacinas = {};
  document.querySelectorAll('#editarVacinasChecklist input').forEach(input => {
    const vacina = input.id.replace('edit-vacina-', '');
    novasVacinas[vacina] = input.checked ? 1 : 0;
  });
  registroCidadao.vacinas = novasVacinas;

  await updateRegistro(idCidadao, registroCidadao);
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

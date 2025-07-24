const inicioPlantao = document.getElementById("inicio_plantao");
const fimPlantao = document.getElementById("fim_plantao");
const atendimentoForm = document.getElementById("atendimento_form");
const lista = document.getElementById("lista_atendimentos");
const tempoTotal = document.getElementById("tempo_total");
const cliente = document.getElementById("cliente");
const problema = document.getElementById("problema");
const solucao = document.getElementById("solucao");
const horaInicio = document.getElementById("hora_inicio");
const horaFim = document.getElementById("hora_fim");
const botaoLimpar = document.getElementById("limpar_dados");
let paginaAtual = 1;
const atendimentosPorPagina = 5;
const atendimentos = [];
let emEdicao = false;

const plantaoSalvo = localStorage.getItem("plantao");
if (plantaoSalvo) {
  const { inicio, fim } = JSON.parse(plantaoSalvo);
  inicioPlantao.value = inicio;
  fimPlantao.value = fim;
}
const dadosSalvos = localStorage.getItem("atendimentos");
if (dadosSalvos) {
  const recuperados = JSON.parse(dadosSalvos);
  atendimentos.push(...recuperados);
  atualizarLista();
  calcularTempoTotal();
}

function parseHorario(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function formatarHorario(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function formatarDuracao(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");

  if (h > 0) {
    return `${hh}h${mm}min`;
  } else {
    return `${mm}min`;
  }
}

function mesclarIntervalos(intervalos) {
  if (!intervalos.length) return [];
  intervalos.sort((a, b) => a.inicio - b.inicio);
  const resultado = [intervalos[0]];
  for (let i = 1; i < intervalos.length; i++) {
    const ultimo = resultado[resultado.length - 1];
    const atual = intervalos[i];
    if (atual.inicio <= ultimo.fim) {
      ultimo.fim = Math.max(ultimo.fim, atual.fim);
    } else {
      resultado.push(atual);
    }
  }
  return resultado;
}

function salvarPlantao() {
  const dados = {
    inicio: inicioPlantao.value,
    fim: fimPlantao.value,
  };
  localStorage.setItem("plantao", JSON.stringify(dados));
}

function salvarNoLocalStorage() {
  localStorage.setItem("atendimentos", JSON.stringify(atendimentos));
}

function editarAtendimento(index) {
  if (emEdicao) {
    if (!confirm("Você está editando um atendimento. Tem certeza que deseja descartar as alterações?")) {
      return;
    }
  }
  emEdicao = true;
  const a = atendimentos[index];
  cliente.value = a.cliente;
  problema.value = a.problema;
  solucao.value = a.solucao;
  horaInicio.value = a.horaInicio;
  horaFim.value = a.horaFim;
  atendimentos.splice(index, 1);
  salvarNoLocalStorage();
  atualizarLista();
  calcularTempoTotal();
}

function removerAtendimento(index) {
  atendimentos.splice(index, 1);
  salvarNoLocalStorage();
  atualizarLista();
  calcularTempoTotal();
}

function atualizarLista() {
  lista.innerHTML = "";

  const atendimentosOrdenados = [...atendimentos].sort((a, b) => {
    return parseHorario(a.horaInicio) - parseHorario(b.horaInicio);
  });
  const totalPaginas = Math.ceil(
    atendimentosOrdenados.length / atendimentosPorPagina
  );
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  const inicio = (paginaAtual - 1) * atendimentosPorPagina;
  const fim = inicio + atendimentosPorPagina;
  const atendimentosPagina = atendimentosOrdenados.slice(inicio, fim);

  atendimentosPagina.forEach((a, i) => {
    const inicioMin = parseHorario(a.horaInicio);
    const fimMin = parseHorario(a.horaFim);
    const duracao = fimMin - inicioMin;
    const tempoFormatado = formatarDuracao(duracao);
    const li = document.createElement("li");
    li.className = "atendimento";
    li.innerHTML = `
      <div class="info">
        <div class="linha-info">
          <span class="label">Cliente:</span>
          <span class="span-info">${a.cliente}</span>
        </div>
        <div class="linha-info">
          <span class="label">Problema:</span>
          <span class="span-info">${a.problema}</span>
        </div>
        <div class="linha-info">
          <span class="label">Solução:</span>
          <span class="span-info">${a.solucao}</span>
        </div>
        <div class="linha-info">
          <span class="label">Hora Inicial:</span>
          <span class="span-info">${a.horaInicio}</span>
        </div>
        <div class="linha-info">
          <span class="label">Hora Final:</span>
          <span class="span-info">${a.horaFim}</span>
        </div>
        <div class="linha-info">
          <span class="label">Total:</span>
          <span class="span-info">${tempoFormatado}</span>
        </div>
        <div class="acoes-atendimento">
          <button class="altera-btn" title="Alterar este atendimento" onclick="editarAtendimento(${inicio + i})">Alterar</button>
          <button class="remove-btn" title="Remover este atendimento" onclick="removerAtendimento(${inicio + i})">Remover</button>
        </div>
      </div>
    `;
    lista.appendChild(li);
  });
  renderizarPaginacao(totalPaginas);
}

function renderizarPaginacao(totalPaginas) {
  let container = document.getElementById("paginacao");
  if (!container) {
    container = document.createElement("div");
    container.id = "paginacao";
    container.style.marginTop = "20px";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.gap = "10px";
    lista.parentNode.appendChild(container);
  }
  container.innerHTML = "";
  if (paginaAtual > 1) {
    const btnAnterior = document.createElement("button");
    btnAnterior.textContent = "Anterior";
    btnAnterior.onclick = () => {
      paginaAtual--;
      atualizarLista();
    };
    container.appendChild(btnAnterior);
  }
  if (paginaAtual < totalPaginas) {
    const btnProximo = document.createElement("button");
    btnProximo.textContent = "Próximo";
    btnProximo.onclick = () => {
      paginaAtual++;
      atualizarLista();
    };
    container.appendChild(btnProximo);
  }
}

function calcularTempoTotal() {
  const intervalos = atendimentos.map((a) => ({
    inicio: parseHorario(a.horaInicio),
    fim: parseHorario(a.horaFim),
  }));
  const blocos = mesclarIntervalos(intervalos);
  const total = blocos.reduce((acc, b) => acc + (b.fim - b.inicio), 0);
  tempoTotal.textContent = formatarDuracao(total);
}

function calcularTempoTotalExportacao(atendimentos) {
  const intervalos = atendimentos.map((a) => ({
    inicio: parseHorario(a.horaInicio),
    fim: parseHorario(a.horaFim),
  }));
  const blocos = mesclarIntervalos(intervalos);
  const total = blocos.reduce((acc, b) => acc + (b.fim - b.inicio), 0);
  return formatarDuracao(total);
}

function calcularDuracaoPlantao(inicio, fim) {
  const inicioMin = parseHorario(inicio);
  const fimMin = parseHorario(fim);
  const duracao = fimMin - inicioMin;
  return formatarDuracao(duracao);
}

document
  .getElementById("exportar_excel")
  .addEventListener("click", function () {
    if (atendimentos.length === 0) {
      alert("Não há atendimentos para exportar.");
      return;
    }
    const ws_data = [];

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dataPlantao = `${dia}/${mes}`;

    const totalPlantao = calcularDuracaoPlantao(
      inicioPlantao.value,
      fimPlantao.value
    );

    const titulo = `Plantão de ${dataPlantao} das ${inicioPlantao.value} às ${fimPlantao.value} total de ${totalPlantao} com os atendimentos abaixo:`;

    ws_data.push([titulo]);
    ws_data.push([""]);

    atendimentos.forEach((a) => {
      ws_data.push(["Cliente:", a.cliente]);
      ws_data.push(["Problema:", a.problema]);
      ws_data.push(["Solução:", a.solucao]);
      ws_data.push(["Hora Inicial:", a.horaInicio]);
      ws_data.push(["Hora Final:", a.horaFim]);

      const inicioMin =
        parseInt(a.horaInicio.split(":")[0]) * 60 +
        parseInt(a.horaInicio.split(":")[1]);
      const fimMin =
        parseInt(a.horaFim.split(":")[0]) * 60 +
        parseInt(a.horaFim.split(":")[1]);
      const duracao = fimMin - inicioMin;
      const tempoFormatado =
        duracao >= 60
          ? `${String(Math.floor(duracao / 60)).padStart(2, "0")}h${String(
              duracao % 60
            ).padStart(2, "0")}min`
          : `${String(duracao % 60).padStart(2, "0")}min`;
      ws_data.push(["Total:", tempoFormatado]);
      ws_data.push(["", ""]);
    });

    ws_data.push(["", ""]);
    ws_data.push([
      "Tempo total de atendimentos:",
      calcularTempoTotalExportacao(atendimentos),
    ]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atendimentos");
    XLSX.writeFile(wb, "atendimentos.xlsx");
  });

inicioPlantao.addEventListener("change", salvarPlantao);
fimPlantao.addEventListener("change", salvarPlantao);
atendimentoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inicioPlantao.value || !fimPlantao.value) {
    alert(
      "Por favor, defina o horário do plantão antes de adicionar um atendimento."
    );
    return;
  }

  const inicioPlantaoMin = parseHorario(inicioPlantao.value);
  const horaInicioMin = parseHorario(horaInicio.value);
  const horaFimMin = parseHorario(horaFim.value);

  if (horaInicioMin < inicioPlantaoMin) {
    alert(
      "O horário de início do atendimento não pode ser menor que o início do plantão."
    );
    return;
  }

  if (horaInicioMin >= 22 * 60) {
    alert(
      "Não é permitido registrar atendimentos que iniciam a partir das 22:00."
    );
    return;
  }

  if (horaFimMin > 22 * 60) {
    alert("O horário final do atendimento não pode ser maior que 22:00.");
    return;
  }

  if (horaInicioMin === 7.5 * 60) { // 7.5*60 = 450 minutos = 07:30
    // Se o atendimento começa às 07:30, só pode ir até 15:00
    if (horaFimMin > 15 * 60) {
      alert("O horário final do atendimento não pode ser maior que 15:00.");
      return;
    }
  }

  const atendimento = {
    cliente: cliente.value,
    problema: problema.value,
    solucao: solucao.value,
    horaInicio: horaInicio.value,
    horaFim: horaFim.value,
  };
  atendimentos.push(atendimento);
  salvarNoLocalStorage();
  atendimentoForm.reset();
  atualizarLista();
  calcularTempoTotal();
  emEdicao = false;
});
botaoLimpar.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja apagar todos os dados?")) {
    localStorage.clear();
    location.reload();
  }
});

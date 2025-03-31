const { ipcRenderer } = require('electron'); // Para acessar o sistema de arquivos no Electron

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM totalmente carregado.");
  const reportSelect = document.getElementById("reportSelect");
  const paramsContainer = document.getElementById("paramsContainer");
  const generateButton = document.getElementById("generateReport");
  const generatePDFButton = document.getElementById("generatePDF");
  const generateExcelButton = document.getElementById("generateExcel");

  let reportData = [];

  // Função para mostrar o overlay de carregamento
  function showLoadingOverlay() {
    return new Promise(resolve => {
      try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
          loadingOverlay.style.display = 'flex';
          console.log("Overlay visível.");
          resolve();
        } else {
          console.log("Elemento loadingOverlay não encontrado.");
          resolve(); // Resolve para evitar bloqueios, mas não mostra o overlay
        }
      } catch (error) {
        console.log('Erro ao carregar overlay:', error);
        resolve(); // Resolve para evitar bloqueios
      }
    });
  }

  // Função para esconder o overlay de carregamento
  async function hideLoadingOverlay() {
    try {
      const loadingOverlay = document.getElementById('loadingOverlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        console.log("Overlay oculto.");
      } else {
        console.log("Elemento loadingOverlay não encontrado.");
      }
    } catch (error) {
      console.log('Erro ao ocultar overlay:', error);
    }
  }

  // Função para ativar/desativar os botões de exportação
  function toggleExportButtons(enable) {
    generatePDFButton.disabled = !enable;
    generateExcelButton.disabled = !enable;
  }

  toggleExportButtons(false);

  // Função para verificar se o servidor está ativo antes de carregar os relatórios
  async function checkServerStatus() {
    let serverActive = false;
    while (!serverActive) {
      try {
        const response = await fetch("http://localhost:3000/reports");
        if (response.ok) {
          serverActive = true;
        }
      } catch (error) {
        console.error("Servidor não disponível, aguardando...");
      }
      if (!serverActive) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    console.log("Servidor está ativo.");
  }

  // Função para carregar os relatórios disponíveis
  async function loadReports() {
    const response = await fetch("http://localhost:3000/reports");
    const reports = await response.json();
    reportSelect.innerHTML = `<option value="">Selecione...</option>`;
    reports.forEach(report => {
      const option = document.createElement("option");
      option.value = report.codigo;
      option.textContent = report.nome;
      reportSelect.appendChild(option);
    });
  }

  // Carrega os parâmetros quando um relatório é selecionado
  reportSelect.addEventListener("change", async () => {
    paramsContainer.innerHTML = ""; // Limpa os parâmetros anteriores
    const reportId = reportSelect.value;
    
    if (!reportId) return; // Se nenhum relatório foi selecionado, não faz nada
    
    const response = await fetch(`http://localhost:3000/reports/${reportId}/params`);
    const params = await response.json();

    // Verifica se não há parâmetros
    if (params.length === 0) {
      paramsContainer.innerHTML = "<p>Este relatório não possui parâmetros.</p>";
      return;
    }

    // Se houver parâmetros, cria os inputs
    params.forEach(param => {
      const input = document.createElement("input");
      if (param.tipo === "integer") {
        input.type = "number";
      } else if (param.tipo === "date") {
        input.type = "date";
      } else {
        input.type = "text";
      }

      input.placeholder = param.nome;
      input.dataset.paramName = param.nome;
      paramsContainer.appendChild(input);
    });
  });

  // Função para gerar o relatório
  generateButton.addEventListener("click", async () => {
    const reportId = reportSelect.value;
    const inputs = paramsContainer.querySelectorAll("input");

    const params = {};
    inputs.forEach(input => {
      params[input.dataset.paramName] = input.value;
    });
    await showLoadingOverlay();
    try {
      const response = await fetch(`http://localhost:3000/reports/${reportId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });

      reportData = await response.json();
      console.log("Resultado do relatório:", reportData);

      renderReport(reportData);
      toggleExportButtons(true);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar o relatório. Tente novamente.");
    } finally {
      // Esconde o overlay de carregamento
      await hideLoadingOverlay();
    }
  });

  // Função para renderizar o relatório
  function renderReport(data) {
    const reportContainer = document.getElementById("reportContainer");
    reportContainer.innerHTML = "";

    if (data.length === 0) {
      reportContainer.innerHTML = "<p>Nenhum dado encontrado.</p>";
      return;
    }

    const table = document.createElement("table");
    const tableHeader = document.createElement("thead");
    const tableBody = document.createElement("tbody");

    const headerRow = document.createElement("tr");
    Object.keys(data[0]).forEach(key => {
      const th = document.createElement("th");
      th.textContent = key;
      headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    data.forEach(row => {
      const tr = document.createElement("tr");
      Object.values(row).forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    table.appendChild(tableHeader);
    table.appendChild(tableBody);
    reportContainer.appendChild(table);
  }

  // Função para gerar PDF
  generatePDFButton.addEventListener("click", async () => {
    if (!reportData || reportData.length === 0 || Object.keys(reportData[0]).length === 0) {
      alert("Impossível gerar relatório vazio");
      return;
    }
    await showLoadingOverlay();
    try {
      // Chamando diretamente o IPC para gerar o PDF no main process
      const filePath = await ipcRenderer.invoke('generatePDF', reportData);
      console.log("PDF gerado em:", filePath);
      await hideLoadingOverlay();
      alert(`PDF gerado em: ${filePath}`);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar o relatório. Tente novamente.");
    }
  });

  // Função para gerar Excel
  generateExcelButton.addEventListener("click", async () => {
    if (!reportData || reportData.length === 0 || Object.keys(reportData[0]).length === 0) {
      alert("Impossível gerar relatório vazio");
      return;
    }
    await showLoadingOverlay();
    try {
      // Chamando diretamente o IPC para gerar o Excel no main process
      const filePath = await ipcRenderer.invoke('generateExcel', reportData);
      console.log("Excel gerado em:", filePath);
      await hideLoadingOverlay();
      alert(`Excel gerado em: ${filePath}`);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar o relatório. Tente novamente.");
    }
  });


  await checkServerStatus();
  await loadReports();
});

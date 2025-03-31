const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');
const XLSX = require('xlsx');
const os = require('os'); // Para pegar o diretório home do usuário

let mainWindow;
let serverProcess;

app.whenReady().then(() => {
  const serverPath = path.join(__dirname, 'src', 'backend', 'server.js');
  serverProcess = exec(`node ${serverPath}`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) console.error("Erro ao iniciar o servidor:", err);
    if (stdout) console.log("Servidor Express:", stdout);
    if (stderr) console.error("Erro no servidor:", stderr);
  });

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: 'src/frontend/img/LogoApp.png',
    title: 'Soma Relatorios',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      
    },
  });

  mainWindow.loadURL(`file://${__dirname}/src/frontend/index.html`);

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (serverProcess) serverProcess.kill(); // Fecha o servidor ao fechar o app
  });
});

// IPC Handler para geração de PDF
ipcMain.handle('generatePDF', (event, reportData) => {
  const doc = new jsPDF();
  doc.text("Relatório Gerado", 10, 10);

  const headers = Object.keys(reportData[0]);
  const rows = reportData.map(row => Object.values(row));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 20,
    margin: { top: 20, left: 10, right: 10 },
    pageBreak: 'auto',  // Permite quebra de página automática
    showHead: 'everyPage',  // Repetir o cabeçalho em cada página
    theme: 'grid',  // Estilo com grade
    columnStyles: {
      0: { cellWidth: 'auto' },  // Exemplo para a primeira coluna ter largura automática
      1: { cellWidth: 'auto' },  // Exemplo para outras colunas também terem largura automática
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 'auto' },
      7: { cellWidth: 'auto' },
      8: { cellWidth: 'auto' },
      9: { cellWidth: 'auto' },
      10: { cellWidth: 'auto' },
      11: { cellWidth: 'auto' },
      
      // Ajuste individual para colunas específicas, se necessário
    },
    bodyStyles: {
      fontSize: '5',
      overflow: 'auto',  // Impede a quebra de texto dentro das células
    },
    headStyles: {
      fontSize: '5',
      overflow: 'auto',
    },
    horizontalPageBreak: false,  // Desativa quebras horizontais de página
    didDrawPage: function (data) {
      if (data.pageCount > 1) {
        doc.text("Relatório Gerado", 10, 10);  // Exemplo de cabeçalho em cada página
      }
    },
    // Ajuste da escala para a tabela caber dentro da página
    didDrawCell: function (data) {
      const pageWidth = doc.internal.pageSize.width;
      const tableWidth = data.settings.tableWidth;
      const scaleFactor = (pageWidth - 20) / tableWidth;  // Fator de escala para ajustar a largura da tabela
      if (scaleFactor < 1) {
        doc.setFontSize(10 * scaleFactor);  // Ajusta o tamanho da fonte proporcionalmente
      }
    }
  });

  // Definindo o caminho para salvar o PDF na pasta "Downloads"
  const downloadsPath = path.join(os.homedir(), 'Downloads'); // Obtém o caminho da pasta Downloads
  const filePath = path.join(downloadsPath, `relatorio-${Date.now()}.pdf`);
  
  doc.save(filePath);
  return filePath; // Retorna o caminho completo do arquivo gerado
});

// Listener para geração de Excel
ipcMain.handle('generateExcel', (event, reportData) => {
  const ws = XLSX.utils.json_to_sheet(reportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  // Definindo o caminho para salvar o Excel na pasta "Downloads"
  const downloadsPath = path.join(os.homedir(), 'Downloads');
  const filePath = path.join(downloadsPath, `relatorio-${Date.now()}.xlsx`);

  XLSX.writeFile(wb, filePath);
  return filePath; // Retorna o caminho completo do arquivo gerado
});

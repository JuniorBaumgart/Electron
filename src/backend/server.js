const express = require("express");
const cors = require("cors");
const { getReports, getReportParams, executeReport } = require("./reports");

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/reports", async (req, res) => {
  const reports = await getReports();
  res.json(reports);
});

app.get("/reports/:id/params", async (req, res) => {
  try {
    const reportId = req.params.id; // Pega o ID correto da URL
    console.log(`Buscando parâmetros para o relatório: ${reportId}`);

    const params = await getReportParams(reportId);
    res.json(params);
  } catch (error) {
    console.error("Erro ao buscar parâmetros do relatório:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/reports/:id/execute", async (req, res) => {
  try {
    const result = await executeReport(req.params.id, req.body.params);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

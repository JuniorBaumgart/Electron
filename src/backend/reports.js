const db = require("./database")

// Retorna a lista de relatórios disponíveis
async function getReports() {
  console.log(`Relatorios Encontrados: `);
  const result = await db.query("SELECT codigo, nome FROM relatorios");
  console.log("Resultado da consulta:", result); // DEBUG
  return result;
}

// Retorna os parâmetros de um relatório
async function getReportParams(reportId) {
  console.log(`Acessando a função parametros para relatório ${reportId}`);

  const params = await db.query("SELECT nome, tipo FROM paramrelatorios WHERE codrelatorio = ? ORDER BY codigo", [reportId]);

  console.log("Parâmetros encontrados:", params); // DEBUG
  return params.length > 0 ? params : []; // Se não houver parâmetros, retorna um array vazio
}

// Executa a procedure do relatório
async function executeReport(reportId, params) {
  const queryResult = await db.query("SELECT SQL FROM relatorios WHERE codigo = ?", [reportId]);

  console.log(queryResult);
  console.log(queryResult.length);
  console.log(queryResult[0].sql);

  if (!queryResult || queryResult.length === 0 || !queryResult[0].sql) {
    throw new Error(`Nenhuma query encontrada para o relatório ${reportId}`);
  }

  let query = queryResult[0].sql; // A query armazenada no banco
  console.log("Query original:", query); // DEBUG

  // Verifica se a query tem espaços extras ou outros problemas
  query = query.trim();  // Remover espaços extras
  console.log("Query final após trim:", query); // DEBUG

  // Substitui os placeholders (:parametro) pelos valores informados pelo usuário
  Object.keys(params).forEach((paramName) => {
    const paramValue = params[paramName];
    query = query.replace(new RegExp(`:${paramName}`, "g"), `'${paramValue}'`);
  });

  console.log("Query final a ser executada:", query); // DEBUG

  try {
    // Executa a query
    const result = await db.query(query);
    console.log("Resultado da execução da query:", result); // DEBUG
    return result;  // Certifique-se de retornar o resultado diretamente
  } catch (err) {
    console.error("Erro ao executar a query:", err);
    throw err;
  }
}

module.exports = { getReports, getReportParams, executeReport };

const firebird = require('node-firebird')

const options = {
  host: "10.1.1.132",
  port: 3050,
  database: "WAGNER",
  user: "SYSDBA",
  password: "masterkey",
  lowercase_keys: true,
};
module.exports = {
  query: (sql, params = []) =>
    new Promise((resolve, reject) => {
      console.log("Executando SQL:", sql);
      console.log("Com parâmetros:", params);
      
      firebird.attach(options, (err, db) => {
        if (err) return reject(err);
        db.query(sql, params, (err, result) => {
          db.detach();
          if (err) {
            console.error("Erro ao executar a query:", err); // Log de erro detalhado
            return reject(err);
          }
          console.log("Resultado da consulta:", result); 
          resolve(result);
        });
      });
    }),
};
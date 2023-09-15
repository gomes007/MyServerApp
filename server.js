const mysql = require('mysql');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIo(server);

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'store'
});

let lastDataHash = "";

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to database');
});



function sendDataToClient() {
  const query = `
    SELECT nome_produto, SUM(quantidade_vendida) as total
    FROM sales
    GROUP BY nome_produto
    ORDER BY nome_produto`;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      return;
    }

    const currentDataHash = JSON.stringify(result);
    if (lastDataHash !== currentDataHash) {
      lastDataHash = currentDataHash;

      console.log('Data to send:', result);
      io.emit('newData', result); // Envia para todos os clientes conectados
    }
  });
}

io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Responder com os dados mais recentes ao pedido de dados iniciais
  socket.on('requestInitialData', () => {
    if (lastDataHash) {
      socket.emit('newData', JSON.parse(lastDataHash));
    }
  });

    sendDataToClient(); // Envia os dados iniciais ao conectar
  });


// Chama sendDataToClient a cada 1 segundo
setInterval(sendDataToClient, 1000);

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:3000/');
});

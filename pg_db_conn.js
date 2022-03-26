// const vals = require('./const.js'); 
// const client = new Client({ user: vals.user, password: vals.pass, host: vals.host, port: vals.port, database: vals.db }); 
/*
const { Pool, Client } = require('pg'); 
const client = new Client({ user: "hiseoul", password: "new1234@", host: 'localhost', port: 5432, database: "hiseoul" }); 
function GetUserList() { client.connect(); 
client.query('SELECT * FROM tb_board', (err, res) => { console.log(res); client.end(); }); }; 
module.exports = { getUserList: GetUserList }
*/

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        success: true,
    });
});

app.listen(port, () => {
    console.log(`server is listening at localhost:${process.env.PORT}`);
});

import express from 'express';
import cors from 'cors';
import Joi from 'joi';

// const schema = Joi.object({
// 	name: Joi.string().min(1).required(),
// });

const server = express();
server.use(express.json());
server.use(cors());

const usuarios = [];
const messages = [];

server.get('/participants', (req, res) => {
	//console.log('deu bom');

	res.send(usuarios);
});

server.post('/participants', (req, res) => {
	const user = req.body;

	if (user.name === '') {
		return res.status(422).send("O campo 'nome' deve ser preenchido!");
	}

	usuarios.push(req.body);

	res.status(200).send('ok');
});

server.post('/messages', (req, res) => {
	messages.push(req.body);
	res.send(messages);
});

server.listen(5000);

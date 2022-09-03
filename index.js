import express from 'express';
import cors from 'cors';
import Joi from 'joi';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

dotenv.config();

const nameSchema = Joi.object({
	name: Joi.string().required(),
});

const messageSchema = Joi.object({
	to: Joi.string().required(),
	text: Joi.string().required(),
	type: Joi.string().required().valid('message', 'private_message'),
});

const mongoClient = new MongoClient(process.env.MONGO_URI);
const server = express();
server.use(express.json());
server.use(cors());

let db;

mongoClient.connect().then(() => {
	db = mongoClient.db('projeto12');
});

server.get('/participants', (req, res) => {
	db.collection('participants')
		.find()
		.toArray()
		.then((users) => {
			res.send(users); // array de usuários
		});
});

server.post('/participants', (req, res) => {
	const user = req.body;
	const validationName = nameSchema.validate(user);

	if (validationName.error) {
		return res.status(422).send("O campo 'name' deve ser preenchido!");
	}

	db.collection('participants')
		.find()
		.toArray()
		.then((arrUsers) => {
			const teste = arrUsers.find((item) => item.name === user.name);

			if (teste !== undefined) {
				return res.status(409).send('Este nome já está em uso!');
			} else {
				user.lastStatus = Date.now();

				db.collection('participants').insertOne(req.body);

				res.sendStatus(201);
			}
		});
});

server.get('/messages', async (req, res) => {
	const { limit } = req.query;
	console.log(req.headers.user);

	try {
		const response = await db.collection('messages').find().toArray();

		const response2 = response.filter((value) => {
			if (
				value.to === req.headers.user ||
				value.from === req.headers.user ||
				value.type === 'message'
			) {
				return value;
			}
		});

		if (limit) {
			return res.send(response2.slice(-limit));
		} else {
			res.send(response2); // array de usuários
		}
	} catch (error) {
		console.error(error);
		res.sendStatus(500);
	}
});

server.post('/messages', async (req, res) => {
	const message = req.body;
	const validationMessage = messageSchema.validate(message, {
		abortEarly: false,
	});

	if (validationMessage.error) {
		const erro = validationMessage.error.details.map((value) => value.message);
		return res.status(422).send(erro);
	}

	const users = await db.collection('participants').find().toArray();
	const existe = users.find((user) => user.name === req.headers.user);

	if (existe) {
		let now = dayjs();
		message.time = now.format('HH:mm:ss');
		message.from = req.headers.user;

		db.collection('messages').insertOne(message);
		res.sendStatus(201);
	} else {
		return res.status(422).send('Esse usuário não existe!');
	}
});

server.listen(5000);

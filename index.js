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

const mongoClient = new MongoClient(process.env.MONGO_URI);
const server = express();
server.use(express.json());
server.use(cors());

const messages = [
	{
		to: 'Maria1',
		text: 'oi sumida rs1',
		type: 'message',
	},
	{
		to: 'Maria1',
		text: 'oi sumida rs2',
		type: 'message',
	},
	{
		to: 'Maria2',
		text: 'oi sumida rs1',
		type: 'message',
	},
	{
		to: 'Maria2',
		text: 'oi sumida rs2',
		type: 'message',
	},
	{
		to: 'Maria3',
		text: 'oi sumida rs1',
		type: 'message',
	},
];

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

server.get('/messages', (req, res) => {
	const { limit } = req.query;
	console.log(req.query);
	console.log(limit);

	if (limit) {
		return res.send(messages.slice(-3));
	}

	db.collection('messages')
		.find()
		.toArray()
		.then((msgs) => {
			res.send(msgs); // array de usuários
		});
});

server.post('/messages', (req, res) => {
	const message = req.body;
	let now = dayjs();
	message.time = now.format('HH:mm:ss');
	message.from = req.headers.user;

	console.log(message);

	db.collection('messages').insertOne(message);
	res.send('ok');
});

server.listen(5000);

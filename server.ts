import fastify from 'fastify';
import { httpDbFastify } from './fastifyPlugin';

const app = fastify({ logger: true });

const folder = `./storage`;
const file = `${folder}/db.sql`;

app.register(httpDbFastify(file));

const port = 3000;

app.listen({ port, host: '0.0.0.0' });

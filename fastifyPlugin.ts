import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { HttpDbCore } from './src/core/HttpDbCore';
import { NodejsDeliverer } from './src/deliverers/NodejsDeliverer';
import BetterSqlite3Executor from './src/queryExecutors/better-sqlite3/BetterSqlite3Executor';
import { SuperJsonSerializer } from './src/serializers/super-json/NodejsSerializer';
import {
	IDeliverer,
	IDeserializer,
	IQueryExecutor,
	ISerializer,
} from './src/interfaces';

export const httpDbFastify =
	<TResponse extends WritableStream>(
		pathToDb: string,
		refine?: {
			deliverer?: IDeliverer<TResponse>;
			serializer?: ISerializer & IDeserializer;
			queryExecutor?: IQueryExecutor;
		}
	): FastifyPluginAsync =>
	async (instance, opt) => {
		const deliverer = refine?.deliverer ?? new NodejsDeliverer();
		const serializer = refine?.serializer ?? new SuperJsonSerializer();
		const queryExecutor =
			refine?.queryExecutor ?? new BetterSqlite3Executor(pathToDb);

		const httpDbCore = new HttpDbCore(deliverer, serializer, queryExecutor);

		instance.addContentTypeParser(
			'text/plain',
			{ parseAs: 'string' },
			async (req: FastifyRequest, payload: string) => {
				return payload;
			}
		);

		instance.post(
			'/query',
			(
				req: FastifyRequest<{
					Body: string;
				}>,
				res
			) => {
				httpDbCore.query(req.body, res.raw);
			}
		);

		instance.post(
			'/migrate',
			(
				req: FastifyRequest<{
					Body: string;
				}>,
				res
			) => {
				httpDbCore.migrate(req.body, res.raw);
			}
		);

		return;
	};

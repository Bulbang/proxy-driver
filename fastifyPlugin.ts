import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { HttpDbCore } from "./src/core/HttpDbCore";
import { NodejsDeliverer } from "./src/deliverers/NodejsDeliverer";
import { BetterSqlite3Executor } from "./src/queryExecutors/BetterSqlite3Executor";
import { NodejsSerializer } from "./src/serializers/NodejsSerializer";

export const httpDbFastify =
	(pathToDb: string): FastifyPluginAsync =>
	async (instance, opt) => {
		const deliverer = new NodejsDeliverer();
		const serializer = new NodejsSerializer();
		const queryExecutor = new BetterSqlite3Executor(pathToDb);
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
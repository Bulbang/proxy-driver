import { log } from 'console';
import {
	IDeliverer,
	IDeserializer,
	IQueryExecutor,
	ISerializer,
} from '../interfaces';

type StreamDefiner<TRuntime> = TRuntime extends 'nodejs'
	? NodeJS.WritableStream
	: WritableStream;

export class HttpDbCore<TRuntime extends 'nodejs' | 'v8'> {
	constructor(
		private deliverer: IDeliverer<StreamDefiner<TRuntime>>,
		private serializer: ISerializer & IDeserializer,
		private queryExecutor: IQueryExecutor
	) {}

	migrate(migrationBody: string, destination: StreamDefiner<TRuntime>) {
		const { queries } = this.serializer.deserialize<{ queries: string[] }>(
			migrationBody
		);

		this.queryExecutor.migration({ queries });

		this.deliverer.pipe(this.serializer.serialize({}), destination);
	}

	async query(queryBody: string, destination: StreamDefiner<TRuntime>) {
		const { queries } = this.serializer.deserialize<{ queries: string[] }>(
			queryBody
		);

		const {
			sql: sqlBody,
			params: reqParams,
			method,
		} = this.serializer.deserialize<{
			sql: string;
			params: string[];
			method: string;
		}>(queryBody);

		const response = await this.queryExecutor.query({
			sql: sqlBody,
			reqParams,
			method,
		});

		log(response)
		log(sqlBody, reqParams)

		this.deliverer.pipe(this.serializer.serialize(response), destination);
	}
}

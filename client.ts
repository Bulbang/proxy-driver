import axios from 'axios';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { migrate } from 'drizzle-orm/sqlite-proxy/migrator';
import { testTable } from './schema/schema';
import { log } from 'console';
import { stringify, parse, registerCustom } from 'superjson';
import { eq } from 'drizzle-orm';

const serialize = (data: any) => {
	return stringify(data);
};

const deserialize = <T>(data: any) => {
	return parse<T>(data);
};

registerCustom<Buffer, number[]>(
	{
		isApplicable: (v): v is Buffer => v instanceof Buffer,
		serialize: (v) => [...v],
		deserialize: (v) => Buffer.from(v),
	},
	'buffer'
);

const db = drizzle(async (sql, params, method) => {
	try {
		const rows = await axios.post(
			'http://0.0.0.0:3000/query',
			serialize({
				sql,
				params,
				method,
			}),
			{
				transformResponse: (data) => deserialize(data),
				headers: { 'Content-Type': 'text/plain' },
			}
		);
		log(rows.data);
		return { rows: rows.data };
	} catch (e: any) {
		console.error('Error from sqlite proxy server: ', e.response?.data);
		return { rows: [] };
	}
});

const func = () => {
	const buff = Buffer.from('hello world');

	const serialized = serialize({ buff });
	log(buff);
	// log(serialized);

	const deserialized = deserialize<{ buff: Buffer }>(serialized);

	// log(deserialized);
	log(deserialized.buff);
};

// func()

const main = async () => {
	await migrate(
		db,
		async (queries) => {
			try {
				const rows = await axios.post(
					'http://0.0.0.0:3000/migrate',
					serialize({
						queries,
					}),
					{ headers: { 'Content-Type': 'text/plain' } }
				);
			} catch (e: any) {
				console.error(
					'Error from sqlite proxy server: ',
					e.response?.data
				);
			}
		},
		{ migrationsFolder: './drizzle' }
	);

	await db.insert(testTable).values({
		json: {
			num: 123232,
			str: 'hello world',
			arr: [1, 'string', { obj: true }],
			obj: { test: 'hello_world' },
		},
		num: 3228,
		str: 'world hello',
	});

	console.log('inserted');

	const data = await db.select().from(testTable);

	console.log(data);
};

main();

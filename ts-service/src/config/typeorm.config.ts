import 'dotenv/config';
import { DataSource } from 'typeorm';

import { DEFAULT_DATABASE_URL, validateEnvironment } from './env';
import { getTypeOrmOptions } from './typeorm.options';

const environment = validateEnvironment(process.env);
const dataSource = new DataSource(getTypeOrmOptions(environment.DATABASE_URL ?? DEFAULT_DATABASE_URL));

export default dataSource;

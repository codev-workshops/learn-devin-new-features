const { Pool, types } = require('pg');

const DATE_OID = 1082;
const NUMERIC_OID = 1700;
const INT8_OID = 20;

types.setTypeParser(DATE_OID, (value) => value);
types.setTypeParser(NUMERIC_OID, (value) => Number(value));
types.setTypeParser(INT8_OID, (value) => Number(value));

function createPool(databaseUrl) {
  return new Pool({ connectionString: databaseUrl, max: 10 });
}

module.exports = { createPool };

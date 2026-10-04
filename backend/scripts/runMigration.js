const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

function splitSqlStatements(sqlContent) {
  let delimiter = ';';
  const statements = [];
  let current = '';

  const lines = sqlContent.split('\n');
  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('--') || line.length === 0) continue;

    if (line.toUpperCase().startsWith('DELIMITER')) {
      delimiter = line.substring(9).trim();
      continue;
    }

    current += rawLine + '\n';
    const trimmed = current.trim();
    if (trimmed.endsWith(delimiter)) {
      const stmt = trimmed.slice(0, -delimiter.length).trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
    }
  }
  if (current.trim().length > 0) {
    statements.push(current.trim());
  }
  return statements;
}

async function runMigrationFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(sql);
  console.log(`Executing ${statements.length} statements from ${path.basename(filePath)}...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    await pool.query(stmt);
  }
  console.log(`Successfully completed ${path.basename(filePath)}.`);
}

module.exports = { splitSqlStatements, runMigrationFile };

if (require.main === module) {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node runMigration.js <path-to-sql-file>');
    process.exit(1);
  }
  const resolvedPath = path.resolve(process.cwd(), fileArg);
  runMigrationFile(resolvedPath)
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err);
      pool.end();
      process.exit(1);
    });
}

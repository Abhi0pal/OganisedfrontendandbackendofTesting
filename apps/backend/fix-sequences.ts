import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all sequence defaults...');
  
  const results: any[] = await prisma.$queryRawUnsafe(`
    SELECT 
      t.relname as table_name, 
      a.attname as col_name, 
      pg_get_expr(ad.adbin, ad.adrelid) as default_expr 
    FROM pg_attrdef ad 
    JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum 
    JOIN pg_class t ON t.oid = ad.adrelid 
    WHERE t.relkind = 'r' 
      AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval(%'
  `);

  console.log(`Found ${results.length} sequence columns. Fixing them...`);

  let fixedCount = 0;

  for (const row of results) {
    const tableName = row.table_name;
    const colName = row.col_name;
    const defaultExpr = row.default_expr;
    
    // Extract sequence name from "nextval('sequence_name'::regclass)"
    const match = defaultExpr.match(/nextval\('([^']+)'/);
    if (!match) continue;
    
    const seqName = match[1];
    
    try {
      const fixQuery = `SELECT setval('"${seqName}"', COALESCE(MAX("${colName}"), 1), MAX("${colName}") IS NOT null) FROM "${tableName}";`;
      await prisma.$executeRawUnsafe(fixQuery);
      console.log(`✅ Fixed sequence ${seqName} for ${tableName}.${colName}`);
      fixedCount++;
    } catch (err: any) {
      console.error(`❌ Error fixing ${seqName} on ${tableName}.${colName}: ${err.message}`);
    }
  }
  
  console.log(`Done! Fixed ${fixedCount} sequences.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Universal function to strip unknown fields and handle naming mismatches
 * using Prisma DMMF metadata.
 */
function sanitizeData(modelName: string | undefined, data: any): any {
  if (!modelName || !data || typeof data !== 'object') return data;

  // For arrays (createMany, updateMany), sanitize each element
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(modelName, item));
  }

  const dmmf = (Prisma as any).dmmf;
  const model = dmmf?.datamodel?.models?.find(
    (m: any) => m.name === modelName,
  );
  if (!model) return data;

  const validFields = new Set(model.fields.map((f: any) => f.name));
  const sanitized: any = {};
  let hasChanges = false;

  // Define aliases for common frontend/backend naming mismatches
  const aliases: Record<string, string> = {
    logoUrl: 'logo_url',
    primaryColor: 'primary_color',
    isActive: 'is_active',
  };

  for (const key in data) {
    if (validFields.has(key)) {
      sanitized[key] = data[key];
    } else if (aliases[key] && validFields.has(aliases[key])) {
      // Map alias to valid field (e.g., logoUrl -> logo_url)
      sanitized[aliases[key]] = data[key];
      hasChanges = true;
    } else {
      // Drop unknown field
      hasChanges = true;
    }
  }

  return hasChanges ? sanitized : data;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Limit connection pool to prevent exhausting PostgreSQL max_connections
    const databaseUrl = process.env.DATABASE_URL || '';
    const separator = databaseUrl.includes('?') ? '&' : '?';
    const pooledUrl = `${databaseUrl}${separator}connection_limit=10&pool_timeout=10`;

    super({
      datasources: {
        db: {
          url: pooledUrl,
        },
      },
    });
    
    // Prisma 6 universal solution using Extensions ($extends)
    // We return the extended client from the constructor to replace the instance
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const _args = args as any;
            if (
              ['create', 'update', 'upsert', 'createMany', 'updateMany'].includes(
                operation,
              )
            ) {
              if (_args.data) {
                _args.data = sanitizeData(model, _args.data);
              }
              if (operation === 'upsert') {
                if (_args.create)
                  _args.create = sanitizeData(model, _args.create);
                if (_args.update)
                  _args.update = sanitizeData(model, _args.update);
              }
            }
            return query(_args);
          },
        },
      },
    }) as any;
  }

  async onModuleInit() {
    this.logger.log('Connecting to database (pool_size=10)...');
    await (this as any).$connect?.();
    this.logger.log('Database connected successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await (this as any).$disconnect?.();
    this.logger.log('Database disconnected.');
  }
}

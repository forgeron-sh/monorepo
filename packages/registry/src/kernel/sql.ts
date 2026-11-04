/** One statement of a migration, without parameters. */
export const st = (sql: string) => ({ sql, parameters: [] });

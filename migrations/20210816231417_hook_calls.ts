import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('hook_call', (table) => {
      table.increments('id')
        .primary()
        .notNullable();
      table.integer('hook_id')
        .notNullable()
        .references('id')
        .inTable('webhook');
      table.timestamp('timestamp')
        .notNullable();
      table.string('content')
        .notNullable();
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .dropTable('hook_call');
}

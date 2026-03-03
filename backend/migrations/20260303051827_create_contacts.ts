import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("contacts", (table) => {
    table.increments("id").primary();

    table.string("email").nullable();
    table.string("phoneNumber").nullable();

    table
      .integer("linkedId")
      .nullable()
      .references("id")
      .inTable("contacts")
      .onDelete("CASCADE");

    table
      .string("linkPrecedence")
      .notNullable(); // "primary" | "secondary"

    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("contacts");
}
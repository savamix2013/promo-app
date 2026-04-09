exports.up = async function (knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.string("role").notNullable().defaultTo("user");
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("users");
};

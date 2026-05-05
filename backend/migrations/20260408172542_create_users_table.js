exports.up = async function (database) {
  await database.schema.createTable("users", function (table) {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.string("role").notNullable().defaultTo("user");
    table.timestamps(true, true);
  });
};

exports.down = async function (database) {
  await database.schema.dropTableIfExists("users");
};

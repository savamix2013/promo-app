exports.up = async function (knex) {
  await knex.schema.createTable("promos", (table) => {
    table.increments("id").primary();
    table.string("title").notNullable();
    table.string("store").notNullable();
    table.decimal("old_price", 10, 2);
    table.decimal("new_price", 10, 2).notNullable();
    table.integer("discount_percent");
    table.string("image_url");
    table.string("url");
    table.date("starts_at");
    table.date("ends_at");
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("promos");
};

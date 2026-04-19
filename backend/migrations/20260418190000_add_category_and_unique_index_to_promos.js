exports.up = async function (knex) {
  await knex.schema.alterTable("promos", (table) => {
    table.string("category").nullable();
  });

  await knex.schema.alterTable("promos", (table) => {
    table.unique(["title", "store"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("promos", (table) => {
    table.dropUnique(["title", "store"]);
    table.dropColumn("category");
  });
};

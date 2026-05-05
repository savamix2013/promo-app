exports.up = async function (database) {
  await database.schema.alterTable("promos", function (table) {
    table.string("category").nullable();
  });

  await database.schema.alterTable("promos", function (table) {
    table.unique(["title", "store"]);
  });
};

exports.down = async function (database) {
  await database.schema.alterTable("promos", function (table) {
    table.dropUnique(["title", "store"]);
    table.dropColumn("category");
  });
};

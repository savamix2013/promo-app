module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./data/database.sqlite",
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: function (connection, callback) {
        connection.run("PRAGMA journal_mode=WAL", function () {
          connection.run("PRAGMA busy_timeout=5000", function () {
            connection.run("PRAGMA synchronous=NORMAL", function () {
              connection.run("PRAGMA cache_size=-64000", function () {
                connection.run("PRAGMA temp_store=MEMORY", function () {
                  callback(null, connection);
                });
              });
            });
          });
        });
      },
    },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};

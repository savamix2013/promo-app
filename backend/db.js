const knexConfiguration = require("./knexfile");
const knex = require("knex")(knexConfiguration.development);
module.exports = knex;

const bcrypt = require("bcrypt");

exports.seed = async function (knex) {
  await knex("users").del();

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash("admin123", salt);

  await knex("users").insert([
    {
      name: "Admin",
      email: "admin@promo.com",
      password_hash: hash,
      role: "admin",
    },
  ]);
};

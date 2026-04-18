exports.seed = async function (knex) {
  await knex("promos").del();

  await knex("promos").insert([
    {
      title: "Молоко Яготинське 2.5%",
      store: "ATB",
      old_price: 45.9,
      new_price: 32.9,
      discount_percent: 28,
      url: "https://www.atbmarket.com",
      starts_at: "2026-04-01",
      ends_at: "2026-04-30",
    },
    {
      title: "Хліб Київський нарізний",
      store: "Silpo",
      old_price: 38.0,
      new_price: 25.5,
      discount_percent: 33,
      url: "https://silpo.ua",
      starts_at: "2026-04-10",
      ends_at: "2026-04-20",
    },
  ]);
};

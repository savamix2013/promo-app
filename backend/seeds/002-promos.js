exports.seed = async function (database) {
  await database("promos").del();

  await database("promos").insert([
    {
      title: "Молоко Яготинське 2.5%",
      store: "ATB",
      old_price: 45.9,
      new_price: 32.9,
      discount_percent: 28,
      url: "https://www.atbmarket.com",
    },
    {
      title: "Хліб Київський нарізний",
      store: "Silpo",
      old_price: 38.0,
      new_price: 25.5,
      discount_percent: 33,
      url: "https://silpo.ua",
    },
  ]);
};

// src/data/products.js
// Статичні дані + модель продуктів (CRUD) + getAll із фільтрами/сортуванням/пагінацією

let products = [
  {
    id: 1,
    name: "Espresso",
    description: "Класичний еспресо",
    price: 50,
    category: "coffee",
    inStock: true,
    quantity: 20,
    createdBy: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Cappuccino",
    description: "Еспресо + молочна піна",
    price: 70,
    category: "coffee",
    inStock: true,
    quantity: 15,
    createdBy: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Latte",
    description: "М’який смак з молоком",
    price: 75,
    category: "coffee",
    inStock: true,
    quantity: 12,
    createdBy: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Tea",
    description: "Чай чорний",
    price: 40,
    category: "tea",
    inStock: true,
    quantity: 30,
    createdBy: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Croissant",
    description: "Свіжа випічка",
    price: 55,
    category: "food",
    inStock: false,
    quantity: 0,
    createdBy: 1,
    createdAt: new Date().toISOString(),
  },
];

function findById(id) {
  return products.find((p) => p.id === Number(id)) || null;
}

function getByUser(userId) {
  return products.filter((p) => p.createdBy === Number(userId));
}

function create(data) {
  const newProduct = {
    id: products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1,
    name: String(data.name).trim(),
    description: data.description ? String(data.description) : "",
    price: Number(data.price),
    category: data.category ? String(data.category) : "other",
    inStock: data.inStock !== undefined ? Boolean(data.inStock) : true,
    quantity: data.quantity !== undefined ? Number(data.quantity) : 0,
    createdBy: Number(data.createdBy),
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  return newProduct;
}

function update(id, patch) {
  const p = findById(id);
  if (!p) return null;

  if (patch.name !== undefined) p.name = String(patch.name).trim();
  if (patch.description !== undefined) p.description = String(patch.description);
  if (patch.price !== undefined) p.price = Number(patch.price);
  if (patch.category !== undefined) p.category = String(patch.category);
  if (patch.inStock !== undefined) p.inStock = Boolean(patch.inStock);
  if (patch.quantity !== undefined) p.quantity = Number(patch.quantity);

  return p;
}

function remove(id) {
  const before = products.length;
  products = products.filter((p) => p.id !== Number(id));
  return products.length !== before;
}

/*
Query params:
- category=coffee
- inStock=true|false
- q=search (name/description)
- sort=price_asc|price_desc|date_asc|date_desc|name_asc|name_desc
- page=1
- limit=10
*/
function getAll(query = {}) {
  const category = query.category ? String(query.category) : null;
  const q = query.q ? String(query.q).toLowerCase() : null;

  const inStock =
    query.inStock === undefined
      ? null
      : String(query.inStock).toLowerCase() === "true"
        ? true
        : String(query.inStock).toLowerCase() === "false"
          ? false
          : null;

  const sort = query.sort ? String(query.sort) : null;

  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(query.limit || 10)));

  let result = [...products];

  if (category) result = result.filter((p) => p.category === category);
  if (inStock !== null) result = result.filter((p) => p.inStock === inStock);

  if (q) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }

  if (sort) {
    const [field, dir] = sort.split("_"); // price_desc
    const desc = dir === "desc";

    result.sort((a, b) => {
      let av = a[field];
      let bv = b[field];

      if (field === "date") {
        // підтримка date_* як createdAt
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      }

      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();

      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }

  const totalItems = result.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * limit;
  const items = result.slice(start, start + limit);

  return {
    totalItems,
    totalPages,
    page: safePage,
    limit,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
    items,
  };
}

module.exports = {
  findById,
  getByUser,
  create,
  update,
  remove,
  getAll,
};

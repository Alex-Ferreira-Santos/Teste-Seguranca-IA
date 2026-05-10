const bcrypt = require("bcryptjs");

const users = [
  {
    id: 1,
    name: "Admin",
    email: "admin@email.com",
    password: bcrypt.hashSync("123456", 10),
    roles: ["admin"],
    permissions: [
      "posts.create",
      "posts.edit",
      "posts.delete",
      "users.manage"
    ]
  },
  {
    id: 2,
    name: "Editor",
    email: "editor@email.com",
    password: bcrypt.hashSync("123456", 10),
    roles: ["editor"],
    permissions: [
      "posts.create",
      "posts.edit"
    ]
  },
  {
    id: 3,
    name: "Viewer",
    email: "viewer@email.com",
    password: bcrypt.hashSync("123456", 10),
    roles: ["viewer"],
    permissions: []
  }
];

module.exports = users;
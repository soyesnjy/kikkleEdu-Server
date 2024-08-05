require("dotenv").config();

const users = [
  {
    id: "njy95",
    pwd: "qwer1234",
  },
  {
    id: "njy96",
    pwd: "qwer1234",
  },
  {
    id: "njy97",
    pwd: "qwer1234",
  },
];

const dbconfig = {
  host: process.env.DATABASE_HOST,
  user: "admin",
  password: process.env.DATABASE_PASSWORD,
  database: "soyesdb",
};

const dbconfig_ai = {
  host: process.env.DATABASE_HOST,
  user: "admin",
  password: process.env.DATABASE_PASSWORD,
  database: "soyesAI",
};

module.exports = {
  users,
  dbconfig,
  dbconfig_ai,
};

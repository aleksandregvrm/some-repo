require("dotenv").config()
const { Pool } = require("pg");
const { DataSource } = require("typeorm");
const {User} = require("../entities/User")
const {ConnectedUser} = require("../entities/ConnectedUser")

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
});
const dataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  synchronize: true,
  logging: true,
  entities: [User, ConnectedUser],
  migrations: [__dirname + "../migration/**/*.js"],
  subscribers: [__dirname + "../subscriber/**/*.js"],
});

const connectToDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL database");
    const result = await client.query("SELECT NOW()");
    console.log("Current Time:", result.rows[0]);

    client.release(); 
  } catch (err) {
    console.error("Database connection error:", err.stack);
  }
};

module.exports = {dataSource,connectToDatabase}
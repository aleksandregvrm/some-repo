const EntitySchema = require("typeorm").EntitySchema;

const ConnectedUser = new EntitySchema({
  name: "connectedUser",
  tableName: "connected_user",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    email: {
      type: "varchar",
      unique: true,
    },
    connectionPlatform: {
      type: "varchar",
    },
  },
  relations: {
    user: {
      type: "one-to-one",
      target: "userOfSandro",
      joinColumn: true, 
      onDelete: "CASCADE"
    },
  },
});

module.exports = {ConnectedUser}
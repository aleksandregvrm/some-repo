const EntitySchema = require("typeorm").EntitySchema;

const User = new EntitySchema({
  name: "userOfSandro",
  tableName: "userOfSandro",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
    },
    email: {
      type: "varchar",
      unique: true,
    },
    password: {
      type: "varchar",
      nullable: true,
    },
  },
  relations: {
    connectedUser: {
      type: "one-to-one",
      target: "connectedUser",
      inverseSide: "user",
      cascade: true,
      onDelete: "CASCADE",
    },
  },
});

function validateUserData(user) {
  const errors = [];

  if (!user.name || user.name.length < 1 || user.name.length > 100) {
    errors.push("Name must be between 1 and 100 characters.");
  }

  if (!validator.isEmail(user.email)) {
    errors.push("Email is not valid.");
  }

  if (
    user.password &&
    (user.password.length < 6 || user.password.length > 255)
  ) {
    errors.push("Password must be between 6 and 255 characters long.");
  }

  return errors;
}

module.exports = {User,validateUserData}
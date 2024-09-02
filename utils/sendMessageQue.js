const amqp = require("amqplib/callback_api");

async function sendMessage(message) {
  try {
    amqp.connect("amqp://localhost", (err, connection) => {
      if (err) throw err;
      connection.createChannel((err, channel) => {
        if (err) throw err;
        let queue = "sandros-queue";
        channel.assertQueue(queue, {
          durable: false,
        });
        channel.sendToQueue(queue, Buffer.from(message));
        console.log('message sent');
        process.on("SIGINT", async () => {
          if (connection) {
            await connection.close();
          }
          console.log("RabbitMQ connection closed.");
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = sendMessage;

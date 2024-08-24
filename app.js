const express = require("express");
const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");
const cron = require("node-cron");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const app = express();
const port = 3000;

const connection = new IORedis({
  maxRetriesPerRequest: null,
});

const myQueue = new Queue("cronQueue", { connection });

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullMQAdapter(myQueue)],
  serverAdapter,
});
serverAdapter.setBasePath("/admin/queues");

app.use("/admin/queues", serverAdapter.getRouter());

app.get("/", async (req, res) => {
  const worker = new Worker(
    "cronQueue",
    async (job) => {
      console.log("Executed job:", job.id, job.data, "fghjk");
    },
    { connection }
  );
  worker.on("completed", (job) => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} has failed with ${err.message}`);
  });

  cron.schedule("*/5 * * * * *", async () => {
    console.log("Adding job to queue every 5 seconds");
    await myQueue.add("my-job", { message: "Hello OLA!" });
  });

  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(
    `BullMQ Dashboard running on http://localhost:${port}/admin/queues`
  );
});

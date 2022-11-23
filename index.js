"use strict";
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require("fs").promises;
const mongoose = require("mongoose");

// Connect mongo db
mongoose.connect("mongodb+srv://SaadatAli:RXy1YbmxER4GRsj2@cluster0.qg9knqb.mongodb.net/?retryWrites=true&w=majority");

const ChartDataSchema = new mongoose.Schema({
  coin_id: String,
  prices: mongoose.Schema.Types.Mixed,
});

const ChartData = mongoose.model("ChartData", ChartDataSchema);

const Hapi = require("@hapi/hapi");

const fetchChartData = async (id) => {
  const data = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=14`);
  const json = await data.json();
  return json;
}

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "localhost",
  });

  server.route({
    method: "GET",
    path: "/v4/details",
    handler: async (request, h) => {
      // Read JSON file async await
      const fileData = await fs.readFile("./data/market-data.json", "utf8");
      
      return h.response(JSON.parse(fileData)).code(200);
    },
  });

  server.route({
    method: "GET",
    path: "/v4/details/chart/{id}",
    handler: async (request, h) => {
      const { id } = request.params;

      const chartData = await ChartData.findOne({
        coin_id: id,
      });

      if (chartData) {
        console.log("from db");
        return h.response(chartData).code(200);
      } else {
        console.log("from api");
        const data = await fetchChartData(id);
        const chartData = new ChartData({
          coin_id: id,
          prices: data.prices,
        });
        chartData.save();
        return h.response(data).code(200);
      }
      
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();

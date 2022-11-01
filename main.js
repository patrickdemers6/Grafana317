const express = require('express');
const { Gauge, collectDefaultMetrics, register } = require('prom-client');

collectDefaultMetrics();

const app = express();
const gauge = new Gauge({ name: 'api_http_requests_total', help: "api_http_requests_total_help" });
gauge.set(0);
app.use(gauge.inc);

app.get('/metrics', async (_req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

app.get('/hello', async (_req, res) => {
    console.log('hello request received');
    res.status(200).send("Hello, world!");
});

app.listen(4001, '0.0.0.0');

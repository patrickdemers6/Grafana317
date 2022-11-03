const express = require('express');
const { Gauge, collectDefaultMetrics, register, Histogram } = require('prom-client');

const app = express();

const httpRequestDurationMicroseconds = new Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['route'],
    // buckets for response time from 0.1ms to 500ms
    buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
})
const gauge = new Gauge({ name: 'api_http_requests_total', help: "api_http_requests_total_help", labelNames: ['custom'] });
register.registerMetric(gauge);
register.registerMetric(httpRequestDurationMicroseconds);
collectDefaultMetrics({ register });
gauge.set(0);

app.use((req, res, next) => {
    res.locals.startEpoch = Date.now()
    next()
})

app.use((req, res, next) => { gauge.inc(1); next(); });

app.get('/metrics', async (req, res, next) => {
    console.log('get metrics');
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics(), () => {
        });
    } catch (err) {
        res.status(500).end(err);
    }
    next();
});

app.get('/hello', async (req, res) => {
    console.log('hello request received');
    res.status(200).send("Hello, world!");
});

app.use((req, res, next) => {
    const responseTimeInMs = new Date() - res.locals.startEpoch;

    httpRequestDurationMicroseconds
        .labels(req.route.path)
        .observe(responseTimeInMs);

    next();
})

app.listen(4001, '0.0.0.0');

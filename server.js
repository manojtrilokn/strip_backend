require('dotenv').config();
require('./config/db_conn');
const express = require('express');
const cors = require ('cors');
const port = process.env.PORT || 6060;
const routes = require('./src/routes/user_routes');
const exceptionLogger = require('./src/utils/exceptionLogger');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.use((err, req, res, next) => {
    exceptionLogger.error({
        message: err.message,
        stack: err.stack,
        request: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query,
            headers: req.headers
        }
    });
    res.json({
        status: 0,
        message:err.message
    });
});

app.listen(port, () => {
    console.log(`Server running at ${port}`);
});
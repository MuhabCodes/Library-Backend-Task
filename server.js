const app = require('./src/app')
const config = require('./src/config');

const port = config.port

app.listen(port, () => {
});
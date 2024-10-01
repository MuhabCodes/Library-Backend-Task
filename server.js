const app = require('./src/app')
const config = require('./src/config');
const logger = require('./src/utils/logger');

const port = config.port

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
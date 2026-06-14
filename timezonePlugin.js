const moment = require('moment-timezone');

function timezonePlugin(schema, options) {
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret.createdAt) {
        // Convert createdAt to the specified timezone
        ret.createdAt = moment(ret.createdAt)
          .tz(options.timezone || 'UTC')
          .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      }
      return ret;
    },
  });
}

module.exports = timezonePlugin;

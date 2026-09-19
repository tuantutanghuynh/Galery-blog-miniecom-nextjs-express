const { updateSettings } = require('./controllers/setting.controller');

// Need to mock req/res
const req = { body: { settings: { homepage_hero: "https://example.com/test.jpg" } } };
const res = {
  status: (code) => ({ json: (data) => console.log('res:', code, data) }),
  json: (data) => console.log('res:', 200, data)
};

updateSettings(req, res, (err) => console.log('next err:', err));

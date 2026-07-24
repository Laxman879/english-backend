// Entry shim: Render's default start command runs `node index.js`.
// The real app lives in server.js — load it so any start command works.
require('./server.js');

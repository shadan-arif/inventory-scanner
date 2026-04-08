const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  // It looks like the file names for the cert and key were swapped 
  // during renaming. Let's point them to the correct contents!
  key: fs.readFileSync(path.join(__dirname, "cert/netbird-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "cert/netbird-cert.pem")),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, "0.0.0.0", (err) => {
    if (err) throw err;
    console.log("> Ready on https://0.0.0.0:3000 (NetBird Production)");
  });
}).catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});

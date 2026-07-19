const https = require('https');

const url = "https://piqskprlebpawgypifbr.supabase.co/rest/v1/";

https.get(url, (res) => {
  console.log("Status code:", res.statusCode);
}).on('error', (e) => {
  console.error("HTTPS Error:", e);
});

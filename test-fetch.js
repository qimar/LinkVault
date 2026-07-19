const url = "https://piqskprlebpawgypifbr.supabase.co/rest/v1/";
console.log("Testing connection to: " + url);

fetch(url)
  .then(res => console.log("Status:", res.status))
  .catch(err => console.error("Fetch Error:", err.message, err.cause));

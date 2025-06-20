const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testarAmadeus() {
  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "9AWmIIultvXMhP7hZ7rcixVlSMCG25YC",
      client_secret: "KGKIRafB8uZkXbHx"
    })
  });

  const data = await response.json();
  console.log("🔍 Resposta da Amadeus:", data);
}

testarAmadeus();

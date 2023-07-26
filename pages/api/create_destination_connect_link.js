import fetch from "node-fetch"
import pino from "pino"

const logger = pino({ name: __filename })

const censusBaseUrl = process.env["CENSUS_BASE_URL"] ?? "https://app.getcensus.com"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({})
    return
  }

  const apiResponse = await fetch(`${censusBaseUrl}/api/v1/destination_connect_links`, {
    method: "POST",
    headers: { ["authorization"]: req.headers["authorization"], ["content-type"]: "application/json" },
    body: JSON.stringify({
      type: req.body.type,
      redirect_uri: req.headers["referer"],
    }),
  })
  const { data } = await apiResponse.json()
  logger.info([apiResponse.status, data])
  res.status(apiResponse.status).json(data)
}
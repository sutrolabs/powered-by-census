import fetch from "node-fetch"

import { getWorkspaceAccessToken } from "@utils/auth"
import { checkStatus } from "@utils/status"
import { censusBaseUrl } from "@utils/url"

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.status(405).json({})
    return
  }

  const { sourceId, segmentId } = req.body
  const CENSUS_API_DELETE_SEGMENT = `${censusBaseUrl}/api/v1/sources/${sourceId}/filter_segments/${segmentId}`
  const workspaceApiKey = getWorkspaceAccessToken(req)
  const apiResponse = await fetch(CENSUS_API_DELETE_SEGMENT, {
    method: "DELETE",
    headers: { ["authorization"]: `Bearer ${workspaceApiKey}` },
  })
  await checkStatus(apiResponse, 200)
  res.status(200).json(null)
}

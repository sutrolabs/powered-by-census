import { Dialog } from "@headlessui/react"
import { useState } from "react"
import { Tooltip } from "react-tooltip"

import Button from "@components/Button"
import { Card } from "@components/Card"
import EmbeddedFrame from "@components/EmbeddedFrame"
import RequestTooltip from "@components/RequestTooltip"
import SyncManagement from "@components/SyncManagement"
import Toggle from "@components/Toggle"
import { useSourceConnectLink } from "@hooks/use-source-connect-link"
import { censusBaseUrl } from "@utils/url"

export default function Source({
  label,
  type,
  iconClassName,
  workspaceAccessToken,
  sources,
  setSources,
  refetchSources,
  sourceConnectLinks,
  embedSourceFlow,
  devMode,
  refetchSyncs,
  syncManagementLinks,
  refetchSyncManagementLinks,
  syncs,
  setSyncs,
  runsLoading,
  runs,
}) {
  const [loading, setLoading] = useState(false)
  const [isCheckedOverride, setIsCheckedOverride] = useState()
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const source = sources.find((item) => item.type === type)
  const isChecked = isCheckedOverride ?? !!source

  const [sourceConnectLink, getNewSourceConnectLink] = useSourceConnectLink(
    sourceConnectLinks,
    type,
    workspaceAccessToken,
  )
  const [showEmbeddedFrame, setShowEmbeddedFrame] = useState(!!source)

  const initiateSourceConnectFlow = (sourceConnectLinkData) => {
    if (embedSourceFlow) {
      setShowEmbeddedFrame(true)
    } else {
      window.location.href = sourceConnectLinkData.uri
    }
  }

  const onExitedConnectionFlow = async (connectionDetails) => {
    setLoading(false)
    if (connectionDetails.status === "created") {
      setIsCheckedOverride(null)
      setSources([...sources, { id: connectionDetails.details.id, type: type }])
      refetchSources()
      // await getNewSourceConnectLink()
    } else {
      // Status is "not_created"
      setIsCheckedOverride(false)
      setShowEmbeddedFrame(false)
    }
  }

  const deleteSource = async (source) => {
    const response = await fetch("/api/delete_source", {
      method: "DELETE",
      headers: {
        ["authorization"]: `Bearer ${workspaceAccessToken}`,
        ["content-type"]: "application/json",
      },
      body: JSON.stringify({
        id: source.id,
      }),
    })
    if (!response.ok) {
      throw new Error(response.statusText)
    }
  }

  const SyncCreationStep = () => {
    return !source ? (
      <EmbeddedFrame connectLink={sourceConnectLink.uri} onExit={onExitedConnectionFlow} />
    ) : (
      <SyncManagement
        sourceId={source.id}
        type={type}
        refetchSyncs={refetchSyncs}
        syncManagementLinks={syncManagementLinks}
        refetchSyncManagementLinks={refetchSyncManagementLinks}
        workspaceAccessToken={workspaceAccessToken}
        syncs={syncs}
        setSyncs={setSyncs}
        runsLoading={runsLoading}
        runs={runs}
        devMode={devMode}
      />
    )
  }

  return (
    <>
      <Card className="flex flex-col gap-4" disabled={!isChecked}>
        <Dialog
          open={isDeleteConfirmOpen}
          onClose={() => {
            setLoading(false)
            setIsCheckedOverride(null)
            setIsDeleteConfirmOpen(false)
          }}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <Dialog.Panel className="flex w-full max-w-md flex-col gap-4 rounded bg-stone-100 px-8 py-6">
              <Dialog.Title className="text-xl font-bold text-stone-700">Delete source</Dialog.Title>
              <Dialog.Description className="text-stone-600">
                This will permanently remove your connection to {label}.
              </Dialog.Description>

              <p className="text-stone-600">Are you sure you want to continue?</p>
              <div className="flex flex-row justify-end gap-3">
                <a id={`delete-source-${source?.id}`}>
                  <Button
                    solid
                    disabled={loading}
                    onClick={async () => {
                      try {
                        setLoading(true)
                        await deleteSource(source)
                        setSources(sources.filter((item) => item.id !== source.id))
                        getNewSourceConnectLink()
                        refetchSources()
                        setShowEmbeddedFrame(false)
                      } finally {
                        setLoading(false)
                        setIsCheckedOverride(null)
                        setIsDeleteConfirmOpen(false)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </a>
                <Button
                  disabled={loading}
                  onClick={() => {
                    setLoading(false)
                    setIsCheckedOverride(null)
                    setIsDeleteConfirmOpen(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
        <h3 className="flex flex-row justify-between">
          <span
            className="flex flex-row items-center gap-2 text-lg font-medium text-stone-500 data-[enabled]:text-teal-900"
            data-enabled={source ? "" : null}
          >
            <i className={iconClassName} />
            {label}
          </span>
          <a id={`toggle-source-${type}`}>
            <Toggle
              checked={isChecked}
              disabled={loading || isDeleteConfirmOpen}
              onChange={async () => {
                if (source) {
                  // Delete the source
                  setIsCheckedOverride(false)
                  setIsDeleteConfirmOpen(true)
                } else if (sourceConnectLink) {
                  // Create a source: We already have a source connect link
                  setLoading(true)
                  setIsCheckedOverride(true)
                  initiateSourceConnectFlow(sourceConnectLink)
                } else {
                  // Create a source: We need to create a source connect link
                  try {
                    setLoading(true)
                    setIsCheckedOverride(true)
                    const newLink = await getNewSourceConnectLink()
                    initiateSourceConnectFlow(newLink)
                  } catch (error) {
                    setLoading(false)
                    setIsCheckedOverride(null)
                    throw error
                  }
                }
              }}
            />
          </a>
        </h3>
        {showEmbeddedFrame && <SyncCreationStep />}
      </Card>
      {devMode && !isChecked && (
        <Tooltip anchorSelect={`#toggle-source-${type}`}>
          {embedSourceFlow ? (
            <div className="max-w-sm">
              <p>Toggling this will open a source connect wizard within an embedded iframe like so:</p>
              <p>{`<iframe src="${sourceConnectLink?.uri ?? `${censusBaseUrl}pbc?auth=...`}" />`}</p>
            </div>
          ) : (
            <div className="max-w-sm">
              <p>Toggling this will open a source connect wizard at a redirect flow like so:</p>
              <p>{sourceConnectLink?.uri ?? `${censusBaseUrl}pbc?auth=...`}</p>
            </div>
          )}
        </Tooltip>
      )}
      {source && (
        <RequestTooltip
          anchorSelect={`#delete-source-${source.id}`}
          url={`${censusBaseUrl}/api/v1/sources/${source.id}`}
          method="DELETE"
          devMode={devMode}
          headers={
            <pre>
              {JSON.stringify(
                {
                  ["authorization"]: "Bearer <workspaceAccessToken>",
                },
                null,
                2,
              )}
            </pre>
          }
        />
      )}
    </>
  )
}

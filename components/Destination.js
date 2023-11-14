import { Dialog } from "@headlessui/react"
import { useState } from "react"

import Button from "@components/Button"
import { Card } from "@components/Card"
import Toggle from "@components/Toggle"

export default function Destination({
  label,
  type,
  iconClassName,
  personalAccessToken,
  workspaceId,
  destinations,
  setDestinations,
  destinationConnectLinks,
  setDestinationConnectLinks,
  syncs,
  children,
}) {
  const [now] = useState(() => new Date())
  const [loading, setLoading] = useState(false)
  const [disabledOverride, setDisabledOverride] = useState()
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const destination = destinations.find((item) => item.type === type)
  const destinationConnectLink = destinationConnectLinks.find(
    (item) => item.type === type && new Date(item.expiration) > now && !item.revoked && !item.destination_id,
  )
  const syncsCount = syncs.filter(
    (item) => item.destination_attributes.connection_id === destination?.id,
  ).length
  const disabled = disabledOverride ?? !destination

  return (
    <Card className="flex flex-col gap-4" disabled={disabled}>
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => {
          setLoading(false)
          setDisabledOverride()
          setIsDeleteConfirmOpen(false)
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="flex w-full max-w-md flex-col gap-4 rounded bg-stone-100 px-8 py-6">
            <Dialog.Title className="text-xl font-bold text-stone-700">Delete destination</Dialog.Title>
            <Dialog.Description className="text-stone-600">
              This will permanently remove your connection to {label}
              {syncsCount ? ` and all ${syncsCount} associated syncs` : ""}.
            </Dialog.Description>

            <p className="text-stone-600">Are you sure you want to continue?</p>

            <div className="flex flex-row justify-end gap-3">
              <Button
                solid
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true)
                    const response = await fetch("/api/delete_destination", {
                      method: "DELETE",
                      headers: {
                        ["authorization"]: `Bearer ${personalAccessToken}`,
                        ["content-type"]: "application/json",
                      },
                      body: JSON.stringify({
                        workspaceId,
                        id: destination.id,
                      }),
                    })
                    if (!response.ok) {
                      throw new Error(response.statusText)
                    }
                    setDestinations(destinations.filter((item) => item.id !== destination.id))
                  } finally {
                    setLoading(false)
                    setDisabledOverride()
                    setIsDeleteConfirmOpen(false)
                  }
                }}
              >
                Delete
              </Button>
              <Button
                disabled={loading}
                onClick={() => {
                  setLoading(false)
                  setDisabledOverride()
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
          data-enabled={destination ? "" : null}
        >
          <i className={iconClassName} />
          {label}
        </span>
        {!destination && destinationConnectLink ? (
          <span className="flex flex-row gap-2 text-sm">
            <Button
              solid
              onClick={() => {
                window.location.href = destinationConnectLink.uri
              }}
            >
              Continue connecting
            </Button>
            <Button
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true)
                  const response = await fetch("/api/revoke_destination_connect_link", {
                    method: "POST",
                    headers: {
                      ["authorization"]: `Bearer ${personalAccessToken}`,
                      ["content-type"]: "application/json",
                    },
                    body: JSON.stringify({
                      workspaceId,
                      id: destinationConnectLink.id,
                    }),
                  })
                  if (!response.ok) {
                    throw new Error(response.statusText)
                  }
                  const data = await response.json()
                  setDestinationConnectLinks(
                    destinationConnectLinks.map((item) =>
                      item.id === destinationConnectLink.id ? data : item,
                    ),
                  )
                } finally {
                  setLoading(false)
                }
              }}
            >
              Cancel
            </Button>
          </span>
        ) : (
          <Toggle
            checked={!disabled}
            disabled={loading || isDeleteConfirmOpen}
            onChange={async () => {
              if (destination) {
                setDisabledOverride(true)
                setIsDeleteConfirmOpen(true)
              } else {
                try {
                  setLoading(true)
                  setDisabledOverride(false)
                  const response = await fetch("/api/create_destination_connect_link", {
                    method: "POST",
                    headers: {
                      ["authorization"]: `Bearer ${personalAccessToken}`,
                      ["content-type"]: "application/json",
                    },
                    body: JSON.stringify({
                      workspaceId,
                      type,
                    }),
                  })
                  if (!response.ok) {
                    throw new Error(response.statusText)
                  }
                  const data = await response.json()
                  window.location.href = data.uri
                } catch (error) {
                  setLoading(false)
                  setDisabledOverride()
                  throw error
                }
              }
            }}
          />
        )}
      </h3>
      {destination ? children : null}
    </Card>
  )
}

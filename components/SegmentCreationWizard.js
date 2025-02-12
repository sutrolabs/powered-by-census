import Card from "@components/Card"
import EmbeddedFrame from "@components/EmbeddedFrame"

export default function SegmentCreationWizard({
  setSegments,
  refetchSegments,
  resetSegmentManagementLink,
  setShowCreateSegmentWizard,
  connectLink,
}) {
  return (
    <Card noPadding>
      <EmbeddedFrame
        connectLink={connectLink}
        onExit={async (response) => {
          if (response.status === "created") {
            setSegments((segments) => [
              ...segments,
              {
                id: response.details.id,
              },
            ])
            await refetchSegments()
            // prepares a new link for the next segment creation
            await resetSegmentManagementLink()
          }
          setShowCreateSegmentWizard(false)
        }}
      />
    </Card>
  )
}

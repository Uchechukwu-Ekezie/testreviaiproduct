"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface RenameDialogProps {
  showRenameDialog: boolean
  setShowRenameDialog: React.Dispatch<React.SetStateAction<boolean>>
  newTitle: string
  setNewTitle: React.Dispatch<React.SetStateAction<string>>
  selectedSessionId: string | null
  setSelectedSessionId: React.Dispatch<React.SetStateAction<string | null>>
  handleRename: (sessionId: string) => Promise<void>
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  showRenameDialog,
  setShowRenameDialog,
  newTitle,
  setNewTitle,
  selectedSessionId,
  setSelectedSessionId,
  handleRename,
}) => {
  return (
    <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Chat Session</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter new title"
            className="w-full "
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowRenameDialog(false)
              setNewTitle("")
              setSelectedSessionId(null)
            }}
          >
            Cancel
          </Button>
          <Button 
          className=" bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
          onClick={() => selectedSessionId && handleRename(selectedSessionId)} disabled={!newTitle.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RenameDialog


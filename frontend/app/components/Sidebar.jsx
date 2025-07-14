import React from 'react'
import ConversationList    from './ConversationList'
import NewConversationBtn  from './NewConversationBtn'

export default function Sidebar() {
  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      <div className="p-4 border-b border-gray-700">
        <NewConversationBtn />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ConversationList />
      </div>
    </div>
  )
}

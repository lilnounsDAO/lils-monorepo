import React from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/shadcn'
import { FileText, Lightbulb, MessageSquare } from 'lucide-react'
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
} from './ui/DrawerDialog'
import { isDaoVersion5 } from '@/utils/daoVersion'

interface CreateTypeDialogProps {
  isOpen: boolean
  onClose: () => void
  daoType: 'lilnouns' | 'nouns'
}

interface CreateOption {
  type: 'proposal' | 'candidate' | 'topic'
  title: string
  description: string
  icon: React.ReactNode
  route: string
}

export default function CreateTypeDialog({ isOpen, onClose, daoType }: CreateTypeDialogProps) {
  const navigate = useNavigate()
  const isVersion5 = isDaoVersion5()

  const allOptions: CreateOption[] = [
    {
      type: 'proposal',
      title: 'Create Proposal',
      description: 'Submit an official proposal for DAO voting. Requires meeting threshold requirements.',
      icon: <FileText className="w-8 h-8" />,
      route: '/new/proposal'
    },
    {
      type: 'candidate',
      title: 'Create Candidate',
      description: 'Share a candidate proposal to gather feedback and support before submitting officially.',
      icon: <Lightbulb className="w-8 h-8" />,
      route: '/new/candidate'
    },
    {
      type: 'topic',
      title: 'Create Topic',
      description: 'Start a community discussion about governance, proposals, or general DAO matters.',
      icon: <MessageSquare className="w-8 h-8" />,
      route: '/new/topic'
    }
  ]

  // Filter options based on DAO version - hide candidate and topic if not version 5
  const options: CreateOption[] = isVersion5
    ? allOptions
    : allOptions.filter(option => option.type === 'proposal')

  const handleOptionClick = (route: string) => {
    navigate(route)
    onClose()
  }

  return (
    <DrawerDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerDialogContent className="md:max-w-[600px]">
        <DrawerDialogTitle className="sr-only">
          What would you like to create?
        </DrawerDialogTitle>
        <DrawerDialogContentInner>
          {/* Header */}
          <div className="w-full mb-6">
            <h2 className="heading-5">
              What would you like to create?
            </h2>
          </div>

          {/* Options */}
          <div className="w-full flex flex-col gap-4">
            {options.map((option) => (
              <button
                key={option.type}
                onClick={() => handleOptionClick(option.route)}
                className={cn(
                  'flex items-start gap-4 p-6 rounded-[16px] border-2 border-gray-200',
                  'hover:border-blue-400 hover:bg-blue-50/30 transition-all',
                  'text-left cursor-pointer group'
                )}
              >
                {/* Icon placeholder - will be replaced with illustration */}
                <div className="flex items-center justify-center w-16 h-16 rounded-[12px] bg-gray-100 group-hover:bg-blue-100 transition-colors shrink-0">
                  <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                    {option.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="heading-6 mb-2">{option.title}</h3>
                  <p className="text-sm text-content-secondary">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  )
}

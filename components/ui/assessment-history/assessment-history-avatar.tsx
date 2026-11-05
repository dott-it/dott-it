'use client'

import { User, GraduationCap } from 'lucide-react'
import Image from 'next/image'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AssessmentHistoryAvatarProps {
  type: 'student' | 'assistant' | 'user'
  className?: string
}

export function AssessmentHistoryAvatar({
  type,
  className = 'size-8',
}: AssessmentHistoryAvatarProps) {
  return (
    <Avatar className={`${className} shrink-0`}>
      <AvatarFallback
        className={
          type === 'assistant'
            ? 'bg-gradient-to-br from-purple-500/60 to-pink-500/60 text-white shadow-lg'
            : 'bg-secondary text-secondary-foreground'
        }
      >
        {type === 'assistant' ? (
          <Image
            src="/eddo-logo.png"
            alt="Eddo AI"
            width={32}
            height={32}
            className="size-full object-cover"
          />
        ) : ((type === 'student') ? (
          <User className="size-4" />
        ) : (
          <GraduationCap className="size-4" />
        ))}
      </AvatarFallback>
    </Avatar>
  )
}

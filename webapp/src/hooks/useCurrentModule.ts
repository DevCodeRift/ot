'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useCurrentModule() {
  const pathname = usePathname()
  const [currentModule, setCurrentModule] = useState<string>('dashboard')

  useEffect(() => {
    // Extract module from pathname
    if (pathname.includes('/modules/war')) {
      setCurrentModule('War Management')
    } else if (pathname.includes('/modules/membership')) {
      setCurrentModule('Membership')
    } else if (pathname.includes('/modules/economic')) {
      setCurrentModule('Economic')
    } else if (pathname.includes('/modules/quests')) {
      setCurrentModule('Quests')
    } else if (pathname.includes('/modules/recruitment')) {
      setCurrentModule('Recruitment')
    } else if (pathname.includes('/modules/bot-management')) {
      setCurrentModule('Bot Management')
    } else if (pathname.includes('/admin/modules')) {
      setCurrentModule('Module Administration')
    } else if (pathname.includes('/admin/alliances')) {
      setCurrentModule('Alliance Management')
    } else if (pathname.includes('/dashboard')) {
      setCurrentModule('dashboard')
    } else {
      setCurrentModule('dashboard')
    }
  }, [pathname])

  return currentModule
}

export function getModuleIdFromName(moduleName: string): string {
  switch (moduleName) {
    case 'War Management':
      return 'war'
    case 'Membership':
      return 'membership'
    case 'Economic':
      return 'economic'
    case 'Quests':
      return 'quests'
    case 'Recruitment':
      return 'recruitment'
    case 'Bot Management':
      return 'bot-management'
    case 'Module Administration':
      return 'admin-modules'
    case 'Alliance Management':
      return 'admin-alliances'
    default:
      return 'dashboard'
  }
}
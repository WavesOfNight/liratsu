'use client'
/** Liste des easter eggs actifs (réglés dans l'admin), partagée avec les composants. */
import React, { createContext, useContext } from 'react'

export type EggFlags = {
  konami: boolean
  logoPop: boolean
  windowClose: boolean
  wizz: boolean
  footerCredit: boolean
  console: boolean
  aquarium404: boolean
  secretCode: boolean
  secretHint: 'fishClicks' | 'typeGlouglou'
}

export const DEFAULT_EGGS: EggFlags = {
  konami: true,
  logoPop: true,
  windowClose: true,
  wizz: true,
  footerCredit: true,
  console: true,
  aquarium404: true,
  secretCode: true,
  secretHint: 'fishClicks',
}

const Ctx = createContext<EggFlags>(DEFAULT_EGGS)

export function EggsProvider({ value, children }: { value: EggFlags; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useEggs = () => useContext(Ctx)

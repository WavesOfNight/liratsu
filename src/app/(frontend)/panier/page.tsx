import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { AeroWindow } from '@/components/AeroWindow'
import { Checkout } from '@/components/shop/Checkout'
import { getSection } from '@/lib/site'

export const metadata: Metadata = { title: 'Mon panier', robots: { index: false } }

export default async function CartPage() {
  if ((await getSection('shop')).status !== 'on') notFound()
  return (
    <div className="container">
      <header className="page-head">
        <h1>Mon panier</h1>
      </header>
      <AeroWindow title="Panier.exe" icon="shop">
        <Checkout />
      </AeroWindow>
    </div>
  )
}

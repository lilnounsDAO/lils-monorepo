import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/Header'
import Footer from '@/components/Footer'
import MobileNav from '@/components/Nav/MobileNav'
import NounDialog from '@/components/dialog/NounDialog'

export default function MainLayout() {
  const location = useLocation()
  const isEditorPage = location.pathname.includes('/new') || location.pathname.includes('/update')
  
  if (isEditorPage) {
    // Scroll container pattern for /new pages (proposal editor)
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        {/* NAVBAR - Fixed height */}
        <Header />

        {/* SCROLL CONTAINER WRAPPER */}
        <div style={{
          flex: 1,
          minHeight: 0,
          position: 'relative'
        }}>
          {/* ACTUAL SCROLL CONTAINER */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'scroll',
            overflowX: 'hidden'
          }}>
            {/* EDITOR CONTENT */}
            <main className="flex grow items-start justify-center" style={{
              minHeight: '100%'
            }}>
              <Outlet />
            </main>
          </div>
        </div>

        <MobileNav />
        {/* NounDialog now loads data lazily when opened */}
        <NounDialog />
      </div>
    )
  }

  // Original layout for all other pages
  return (
    <>
      <Header />
      <main className="flex grow items-start justify-center">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      {/* NounDialog now loads data lazily when opened */}
      <NounDialog />
    </>
  )
}
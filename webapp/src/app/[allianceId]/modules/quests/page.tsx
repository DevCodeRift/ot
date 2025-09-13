import { Suspense } from 'react'
import QuestsModule from '@/components/modules/quests'

interface PageProps {
  params: Promise<{
    allianceId: string
  }>
}

export default async function QuestsModulePage({ params }: PageProps) {
  const { allianceId } = await params

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="cp-card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-cp-cyan/20 rounded border border-cp-cyan flex items-center justify-center mr-4">
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-cyberpunk text-cp-text-primary">Quest Management</h1>
                  <p className="text-cp-text-secondary">
                    Loading quest system...
                  </p>
                </div>
              </div>
            </div>
            <div className="cp-card p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-cp-bg-tertiary rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <QuestsModule allianceId={allianceId} />
        </Suspense>
      </div>
    )
  }

import { Suspense } from 'react'
import QuestsModule from '@/components/modules/quests'

interface PageProps {
  params: Promise<{
    allianceId: string
    moduleId: string
  }>
}

export default async function QuestsModulePage({ params }: PageProps) {
  const { allianceId, moduleId } = await params
  
  if (moduleId !== 'quests') {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cp-text-primary mb-2">Module Not Found</h1>
          <p className="text-cp-text-secondary">The requested module could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cp-bg-primary">
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-cp-cyan mb-2">Quest Management</h1>
                <p className="text-cp-text-secondary">
                  Loading quest system...
                </p>
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
    </div>
  )
}

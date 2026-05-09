import React from 'react'
import { usePortfolio } from '../hooks/usePortfolio'
import PortfolioHeader from '../components/portfolio/PortfolioHeader'
import PortfolioMetrics from '../components/portfolio/PortfolioMetrics'
import PortfolioTreemap from '../components/portfolio/PortfolioTreemap'
import PortfolioPieChart from '../components/portfolio/PortfolioPieChart'
import PortfolioLedger from '../components/portfolio/PortfolioLedger'
import AddPositionModal from '../components/portfolio/AddPositionModal'
import DeleteConfirmModal from '../components/portfolio/DeleteConfirmModal'

export default function PortfolioView() {
  const portfolioData = usePortfolio()

  if (portfolioData.isInitialLoad) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-muted text-xs uppercase tracking-widest">Loading portfolio data...</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 pb-12 custom-scrollbar relative bg-background">
      <PortfolioHeader onOpenAdd={portfolioData.openAddModal} />

      {portfolioData.pnlData && portfolioData.pnlData.total && (
        <PortfolioMetrics total={portfolioData.pnlData.total} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <PortfolioTreemap data={portfolioData.treeData} positionsCount={portfolioData.positions.length} />
        <PortfolioPieChart data={portfolioData.pieData} />
      </div>

      <PortfolioLedger 
        positions={portfolioData.positions} 
        pnlData={portfolioData.pnlData} 
        onEdit={portfolioData.handleEditClick} 
        onDelete={portfolioData.setDeleteTarget} 
      />

      {portfolioData.showAdd && (
        <AddPositionModal 
          {...portfolioData}
          onClose={() => {
            portfolioData.setShowAdd(false)
            portfolioData.resetForm()
          }}
        />
      )}

      {portfolioData.deleteTarget && (
        <DeleteConfirmModal 
          deleteTarget={portfolioData.deleteTarget}
          onDelete={portfolioData.handleDelete}
          onCancel={() => portfolioData.setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

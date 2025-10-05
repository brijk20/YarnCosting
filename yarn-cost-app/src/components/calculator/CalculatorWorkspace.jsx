import QuickPresetSection from "./QuickPresetSection"
import QualitySection from "./QualitySection"
import WarpSection from "./WarpSection"
import WeftSection from "./WeftSection"
import AdditionalCostsSection from "./AdditionalCostsSection"
import PricingSection from "./PricingSection"
import ResultsPanel from "./ResultsPanel"

const CalculatorWorkspace = () => (
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
    <div className="space-y-4">
      <QuickPresetSection />
      <QualitySection />
      <WarpSection />
      <WeftSection />
      <AdditionalCostsSection />
      <PricingSection />
    </div>
    <ResultsPanel />
  </div>
)

export default CalculatorWorkspace

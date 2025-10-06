import CalculatorWorkspace from "../components/calculator/CalculatorWorkspace"
import PresetManager from "../components/calculator/PresetManager"
import Card, { CardSection } from "../components/ui/Card"

const CalculatorPage = () => (
  <div className="space-y-8">
    <Card>
      <CardSection
        title="Cost planner"
        description="Adjust warp, weft, wastage, and efficiency to land on a defensible per-metre cost."
      />
      <CalculatorWorkspace />
    </Card>

    <PresetManager />
  </div>
)

export default CalculatorPage

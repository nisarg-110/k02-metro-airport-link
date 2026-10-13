import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DepartmentDetail from './pages/DepartmentDetail'
import Budget from './pages/Budget'
import Dependencies from './pages/Dependencies'
import People from './pages/People'
import AnomaliesPage from './pages/Anomalies'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/departments" element={<DepartmentDetail />} />
          <Route path="/departments/:deptId" element={<DepartmentDetail />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/dependencies" element={<Dependencies />} />
          <Route path="/people" element={<People />} />
          <Route path="/anomalies" element={<AnomaliesPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

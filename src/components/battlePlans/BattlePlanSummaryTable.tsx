import type { BattlePlan } from '../../types/battlePlans'
import type { Employee } from '../../types/employees'
import {
  calculateCompletedMinutes,
  calculatePlannedMinutes,
} from '../../utils/battlePlanTotals'

interface BattlePlanSummaryTableProps {
  plans: BattlePlan[]
  employees: Employee[]
}

const BattlePlanSummaryTable = ({
  plans,
  employees,
}: BattlePlanSummaryTableProps) => {
  const getEmployeeName = (employeeId: string): string =>
    employees.find((employee) => employee.id === employeeId)?.name ?? employeeId

  return (
    <div className="panel">
      <h3>Today's Battle Plans</h3>
      <div className="table-wrap">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Worker</th>
              <th>Date</th>
              <th>Status</th>
              <th>Planned</th>
              <th>Completed</th>
              <th>Remaining</th>
              <th>Tasks</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const planned = calculatePlannedMinutes(plan.tasks)
              const completed = calculateCompletedMinutes(plan.tasks)
              const remaining = Math.max(planned - completed, 0)

              return (
                <tr key={plan.id}>
                  <td>{getEmployeeName(plan.assignedWorkerId)}</td>
                  <td>{plan.date}</td>
                  <td>{plan.status}</td>
                  <td>{planned}</td>
                  <td>{completed}</td>
                  <td>{remaining}</td>
                  <td>{plan.tasks.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BattlePlanSummaryTable

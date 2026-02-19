import { AlertTriangle, Users, TrendingDown } from 'lucide-react';

export default function FraudRingTable({ fraudRings = [] }) {
  const getRiskBadgeColor = (riskScore) => {
    if (riskScore >= 80) return 'badge-danger';
    if (riskScore >= 60) return 'badge-warning';
    return 'badge-success';
  };

  const getRiskLabel = (riskScore) => {
    if (riskScore >= 80) return 'Critical';
    if (riskScore >= 60) return 'High';
    return 'Medium';
  };

  return (
    <div className="card-elevated animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Detected Fraud Rings</h2>
        <p className="text-sm text-gray-600">Analysis of potentially fraudulent clusters</p>
      </div>

      {fraudRings.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No fraud rings detected yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-cell text-left">Ring ID</th>
                <th className="table-cell text-left">Members</th>
                <th className="table-cell text-left">Transactions</th>
                <th className="table-cell text-right">Risk Score</th>
                <th className="table-cell text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {fraudRings.map((ring, idx) => (
                <tr key={ring.id || idx} className="table-row">
                  <td className="table-cell font-semibold text-gray-900">{ring.id}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{ring.members}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                      <span>{ring.transactions}</span>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            ring.riskScore >= 80
                              ? 'bg-danger'
                              : ring.riskScore >= 60
                              ? 'bg-warning'
                              : 'bg-success'
                          }`}
                          style={{ width: `${ring.riskScore}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 min-w-12 text-right">
                        {ring.riskScore}%
                      </span>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <span className={`badge ${getRiskBadgeColor(ring.riskScore)}`}>
                      {getRiskLabel(ring.riskScore)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
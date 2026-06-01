export default function ApplicantTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">Prateek Sharma</td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">paddyuiux@gmail.com</td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">UI/UX Designer</td>
            <td className="border border-gray-300 px-4 py-3">
              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                Active
              </span>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">Prateek Sharma</td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">paddyuiux@gmail.com</td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">UI/UX Designer</td>
            <td className="border border-gray-300 px-4 py-3">
              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                Active
              </span>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">Prateek Sharma</td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">paddyuiux@gmail.com</td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">UI/UX Designer</td>
            <td className="border border-gray-300 px-4 py-3">
              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                Active
              </span>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">Prateek Sharma</td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">paddyuiux@gmail.com</td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">UI/UX Designer</td>
            <td className="border border-gray-300 px-4 py-3">
              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                Active
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

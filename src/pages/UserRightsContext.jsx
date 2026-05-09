import React from 'react';

const UserManagementPage = () => {
  // Assuming 'users' is the state where you store the list of users from Supabase
  const [users] = React.useState([]); 

  const handleEdit = (user) => console.log("Editing", user);
  const handleDelete = (id) => console.log("Deleting", id);

  return (
    <div className="p-6">
      <table className="w-full text-white">
        <thead>
          <tr className="text-left border-b border-white/10">
            <th className="pb-4 font-medium">Email</th>
            <th className="pb-4 font-medium">Role</th>
            <th className="pb-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((targetUser) => {
            const isSuperAdmin = targetUser.user_type?.toUpperCase() === 'SUPERADMIN';

            return (
              <tr key={targetUser.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="py-4">{targetUser.email}</td>
                <td className="py-4">
                  <span className={`text-xs px-2 py-1 rounded ${isSuperAdmin ? 'bg-gold/20 text-gold' : 'bg-white/10'}`}>
                    {targetUser.user_type}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(targetUser)}
                      disabled={isSuperAdmin} // PR-02 Guard
                      title={isSuperAdmin ? 'SUPERADMIN accounts cannot be modified' : 'Edit User'} // PR-02 Tooltip
                      className="px-3 py-1 text-xs border border-white/20 hover:bg-white hover:text-black transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(targetUser.id)}
                      disabled={isSuperAdmin} // PR-02 Guard
                      title={isSuperAdmin ? 'SUPERADMIN accounts cannot be modified' : 'Delete User'} // PR-02 Tooltip
                      className="px-3 py-1 text-xs border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      DELETE
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagementPage;
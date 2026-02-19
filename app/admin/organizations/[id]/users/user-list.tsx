'use client'

import { Mail, Shield, GraduationCap, User, Users } from 'lucide-react'

export function UserList({ initialUsers }: { initialUsers: any[] }) {

    if (initialUsers.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No hay usuarios registrados</h3>
                <p className="text-slate-500 mt-1">Invita a administradores o profesores a tu organización.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-medium text-slate-500 text-sm">Usuario</th>
                        <th className="px-6 py-4 font-medium text-slate-500 text-sm">Rol</th>
                        <th className="px-6 py-4 font-medium text-slate-500 text-sm">Fecha de Registro</th>
                        <th className="px-6 py-4 font-medium text-slate-500 text-sm">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {initialUsers.map((user) => (
                        <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{user.email || 'Email no disponible'}</div>
                                        <div className="text-xs text-slate-400 font-mono">{user.user_id.slice(0, 8)}...</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${user.rol === 'superadmin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                        user.rol === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            'bg-green-100 text-green-700 border-green-200'}`}>
                                    {user.rol === 'superadmin' && <Shield className="w-3 h-3" />}
                                    {user.rol === 'admin' && <Shield className="w-3 h-3" />}
                                    {user.rol === 'profesor' && <GraduationCap className="w-3 h-3" />}
                                    {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm">
                                {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                {user.last_sign_in_at ? (
                                    <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">Activo</span>
                                ) : (
                                    <span className="text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded">Invitado</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

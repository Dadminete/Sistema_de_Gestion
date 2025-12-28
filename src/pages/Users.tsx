import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Shield, User, Image, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import type { UserWithRoles } from '../types/database';
import { RoleService, type Role } from '../services/roleService';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import './Users.css';
import Swal from 'sweetalert2';

const initialNewUserState: {
  username: string;
  nombre: string;
  apellido: string;
  passwordHash: string;
  telefono: string;
  cedula: string;
  sexo: string;
  esEmpleado: boolean;
  activo: boolean;
  avatar: string;
  avatarPreview: string;
  direccion: string;
  notas: string;
  roles: string[];
  email: string;
  fechaNacimiento: Date | null;
  esCliente: boolean;
} = {
  username: '',
  nombre: '',
  apellido: '',
  passwordHash: '',
  telefono: '',
  cedula: '',
  sexo: 'M',
  esEmpleado: false,
  activo: true,
  avatar: '',
  avatarPreview: '',
  direccion: '',
  notas: '',
  roles: [] as string[],
  email: '',
  fechaNacimiento: null,
  esCliente: false,
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [newUser, setNewUser] = useState(initialNewUserState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUsers();
        // Ordenar alfabéticamente por nombre y apellidos
        const sortedUsers = data.sort((a, b) => {
          const nameA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase().trim();
          const nameB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase().trim();
          return nameA.localeCompare(nameB, 'es');
        });
        setUsers(sortedUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    const fetchRoles = async () => {
      try {
        const roles = await RoleService.getRoles();
        setAvailableRoles(roles);
      } catch (err) {
        console.error('Error loading roles:', err);
      }
    };

    fetchUsers();
    fetchRoles();
  }, []);

  const handleCreate = () => {
    setEditingUser(null);
    setNewUser({ ...initialNewUserState, roles: [] });
    setShowModal(true);
  };

  const handleEdit = (user: UserWithRoles) => {
    setEditingUser(user);
    // Get current user roles
    const currentRoles = user.usuariosRoles?.map((ur) => ur.rolId.toString()) || [];

    setNewUser({
      username: user.username,
      nombre: user.nombre,
      apellido: user.apellido,
      passwordHash: '', // Password is not edited here for security
      telefono: user.telefono || '',
      cedula: user.cedula || '',
      sexo: user.sexo || 'M',
      esEmpleado: user.esEmpleado,
      activo: user.activo,
      avatar: user.avatar || '',
      avatarPreview: user.avatar || '',
      direccion: user.direccion || '',
      notas: user.notas || '',
      roles: currentRoles,
      email: user.email || '',
      fechaNacimiento: user.fechaNacimiento,
      esCliente: user.esCliente,
    });
    setAvatarFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres eliminar este usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        setError(null);
        await deleteUser(id);
        setUsers(users.filter((user) => user.id !== id));
        Swal.fire('Eliminado', 'Usuario eliminado exitosamente.', 'success');
      } catch (err) {
        setError('Error deleting user');
        console.error('Error deleting user:', err);
        Swal.fire('Error', 'Error al eliminar el usuario.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewUser({ ...newUser, avatarPreview: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (editingUser) {
        // Update user
        const updatePayload: any = {
          username: newUser.username,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          telefono: newUser.telefono,
          cedula: newUser.cedula,
          sexo: newUser.sexo,
          esEmpleado: newUser.esEmpleado,
          activo: newUser.activo,
          avatar: newUser.avatarPreview || newUser.avatar,
          direccion: newUser.direccion,
          notas: newUser.notas,
          roles: newUser.roles,
        };

        // Only include password if it's provided
        if (newUser.passwordHash.trim()) {
          updatePayload.passwordHash = newUser.passwordHash;
        }

        const updatedUser = await updateUser(editingUser.id, updatePayload);
        setUsers(users.map((user) => (user.id === editingUser.id ? updatedUser : user)));
      } else {
        // Create new user
        const createdUser = await createUser({
          username: newUser.username,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          passwordHash: newUser.passwordHash,
          telefono: newUser.telefono,
          cedula: newUser.cedula,
          sexo: newUser.sexo,
          esEmpleado: newUser.esEmpleado,
          activo: newUser.activo,
          avatar: newUser.avatarPreview || newUser.avatar,
          direccion: newUser.direccion,
          notas: newUser.notas,
          intentosFallidos: 0,
          roles: newUser.roles,
          email: newUser.email,
          fechaNacimiento: newUser.fechaNacimiento,
          esCliente: newUser.esCliente,
        });
        setUsers([...users, createdUser]);
      }

      // Only close modal and reset form after successful operation
      setShowModal(false);
      setNewUser(initialNewUserState);
      setEditingUser(null);
      setAvatarFile(null);
    } catch (err) {
      setError(editingUser ? 'Error updating user' : 'Error creating user');
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<UserWithRoles>[] = [
    {
      accessorKey: 'avatar',
      header: 'Avatar',
      cell: ({ row }) => (
        <div className="avatar-cell">
          {row.original.avatar ? (
            <img
              src={row.original.avatar}
              alt="Avatar"
              className="avatar-table-img"
            />
          ) : (
            <div className="avatar-table-placeholder">
              <User size={24} strokeWidth={2.5} />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
    },
    {
      accessorKey: 'apellido',
      header: 'Apellido',
    },
    {
      accessorKey: 'username',
      header: 'Usuario',
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const userRoles = row.original.usuariosRoles || [];
        console.log('User roles for', row.original.username, ':', userRoles); // Debug log
        return (
          <div className="roles-cell">
            {userRoles.length > 0 ? (
              userRoles.map((ur, index) => (
                <span key={index} className="role-badge">
                  {ur.rol?.nombreRol || 'Rol sin nombre'}
                </span>
              ))
            ) : (
              <span className="no-roles">Sin roles</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'cedula',
      header: 'Cédula',
      enableHiding: true,
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono',
    },
    {
      accessorKey: 'esEmpleado',
      header: 'Empleado',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.esEmpleado ? 'success' : 'secondary'}`}>
          {row.original.esEmpleado ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Activo',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.activo ? 'success' : 'danger'}`}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="table-actions">
          <button
            className="action-btn edit-btn"
            onClick={() => handleEdit(row.original)}
            title="Editar"
          >
            <Pencil size={18} strokeWidth={2.5} />
          </button>
          <button
            className="action-btn permissions-btn"
            onClick={() => navigate(`/users/${row.original.id}/permisos`)}
            title="Gestionar Permisos"
          >
            <Shield size={18} strokeWidth={2.5} />
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => handleDelete(row.original.id)}
            title="Eliminar"
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb"><h1>Gestión Usuarios</h1></div>
          <p>Administra los usuarios del sistema y sus roles.</p>
        </div>
        <div className="header-right">
          {/* The create button is now part of the DataTable component */}
        </div>
      </div>

      {error && (
        <div className="error-message" style={{
          backgroundColor: 'var(--colors-error-main)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} strokeWidth={2.5} />
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message" style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--colors-text-secondary)'
        }}>
          <RefreshCw size={32} strokeWidth={2.5} className="rotating" />
          <p>Cargando...</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        createAction={{
          label: 'Nuevo Usuario',
          onClick: handleCreate,
        }}
      />

      {showModal && (
        <Modal
          title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Usuario</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="compact-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={newUser.nombre}
                onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                className="compact-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                value={newUser.apellido}
                onChange={(e) => setNewUser({ ...newUser, apellido: e.target.value })}
                className="compact-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Cédula</label>
              <input
                type="text"
                value={newUser.cedula}
                onChange={(e) => setNewUser({ ...newUser, cedula: e.target.value })}
                className="compact-input"
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={newUser.telefono}
                onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                className="compact-input"
              />
            </div>

            {/* Selector de Roles */}
            <div className="form-group">
              <label>Roles</label>
              <select
                multiple
                className="compact-input role-selector"
                value={newUser.roles}
                onChange={(e) => {
                  const selectedRoles = Array.from(e.target.selectedOptions, option => option.value);
                  setNewUser({ ...newUser, roles: selectedRoles });
                }}
              >
                {availableRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.nombreRol}
                  </option>
                ))}
              </select>
              <small>Mantén Ctrl presionado para seleccionar múltiples roles</small>
            </div>
            <div className="form-group">
              <label>Sexo</label>
              <select
                value={newUser.sexo}
                onChange={(e) => setNewUser({ ...newUser, sexo: e.target.value })}
                className="compact-input"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Contraseña {editingUser && <small>(dejar vacío para no cambiar)</small>}</label>
              <input
                type="password"
                value={newUser.passwordHash}
                onChange={(e) => setNewUser({ ...newUser, passwordHash: e.target.value })}
                className="compact-input"
                required={!editingUser}
                placeholder={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
              />
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newUser.esEmpleado}
                  onChange={(e) => setNewUser({ ...newUser, esEmpleado: e.target.checked })}
                />
                <span className="checkmark"></span>
                Es Empleado
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newUser.activo}
                  onChange={(e) => setNewUser({ ...newUser, activo: e.target.checked })}
                />
                <span className="checkmark"></span>
                Activo
              </label>
            </div>
            <div className="avatar-section">
              <div className="form-group">
                <label>Avatar</label>
                <div className="avatar-input-group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="avatar-upload-btn">
                    <Image size={20} strokeWidth={2.5} />
                    Subir Imagen
                  </label>
                </div>
              </div>
              <div className="avatar-preview">
                {newUser.avatarPreview ? (
                  <img
                    src={newUser.avatarPreview}
                    alt="Avatar preview"
                    className="avatar-preview-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={32} strokeWidth={2.5} />
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={newUser.direccion}
                onChange={(e) => setNewUser({ ...newUser, direccion: e.target.value })}
                className="compact-input"
              />
            </div>
            <div className="form-group">
              <label>Notas</label>
              <input
                type="text"
                value={newUser.notas}
                onChange={(e) => setNewUser({ ...newUser, notas: e.target.value })}
                className="compact-input"
              />
            </div>
            <div className="form-actions">
              <Button onClick={() => setShowModal(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Users;

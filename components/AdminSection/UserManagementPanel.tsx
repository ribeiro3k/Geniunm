
import React, { useState, useEffect, useCallback } from 'react';
import { SimpleUserCredentials, QuizAttemptRecord, SimulationRecord } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { 
    LOCAL_STORAGE_SIMPLE_USERS_KEY, 
    LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, 
    BASE_SIMPLE_USER_NAMES,
    DEFAULT_SIMPLE_USER_PASSWORD,
    LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY,
    LOCAL_STORAGE_SIMULATION_RECORDS_KEY,
    LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX
} from '../../constants';

interface UserManagementPanelProps {
  onUserListChange: () => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ onUserListChange }) => {
  const [simpleUserCredentials, setSimpleUserCredentials] = useState<SimpleUserCredentials[]>([]);
  const [editingPasswords, setEditingPasswords] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUserCredentials = useCallback(() => {
    const storedCredentialsJSON = localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY);
    const storedUsernamesJSON = localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_KEY);
    
    let usernames = BASE_SIMPLE_USER_NAMES;
    if (storedUsernamesJSON) {
        try { usernames = JSON.parse(storedUsernamesJSON); } catch (e) { console.error("Error parsing simple usernames list", e); }
    } else {
        localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_KEY, JSON.stringify(usernames));
    }

    let credentials: SimpleUserCredentials[] = [];
    if (storedCredentialsJSON) {
      try { credentials = JSON.parse(storedCredentialsJSON); } catch (e) { console.error("Error parsing credentials", e); }
    }
    
    // Synchronize: Ensure all users in usernames list have a credential entry
    const finalCredentials: SimpleUserCredentials[] = usernames.map(username => {
        const existingCred = credentials.find(cred => cred.username === username);
        return existingCred || { username, passwordPlainText: DEFAULT_SIMPLE_USER_PASSWORD };
    });

    // Ensure credentials list doesn't have users not in usernames list
    const finalFilteredCredentials = finalCredentials.filter(cred => usernames.includes(cred.username));

    setSimpleUserCredentials(finalFilteredCredentials);
    if (JSON.stringify(finalFilteredCredentials) !== localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY)) {
        localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, JSON.stringify(finalFilteredCredentials));
    }

    const initialEditingPasswords: Record<string, string> = {};
    finalFilteredCredentials.forEach(cred => {
        initialEditingPasswords[cred.username] = cred.passwordPlainText;
    });
    setEditingPasswords(initialEditingPasswords);

  }, []);

  useEffect(() => {
    loadUserCredentials();
  }, [loadUserCredentials]);

  const handlePasswordChange = (username: string, value: string) => {
    setEditingPasswords(prev => ({ ...prev, [username]: value }));
    setMessage(null);
  };

  const toggleShowPassword = (username: string) => {
    setShowPasswords(prev => ({ ...prev, [username]: !prev[username] }));
  };

  const savePassword = (username: string) => {
    setMessage(null);
    const newPassword = editingPasswords[username];
    if (!newPassword || newPassword.length < 3) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 3 caracteres.' });
      return;
    }
    const updatedCredentials = simpleUserCredentials.map(cred => 
      cred.username === username ? { ...cred, passwordPlainText: newPassword } : cred
    );
    localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
    setSimpleUserCredentials(updatedCredentials);
    setMessage({ type: 'success', text: `Senha do usuário "${username}" atualizada com sucesso.` });
  };

  const handleCreateNewUser = () => {
    setMessage(null);
    if (!newUserName.trim()) {
      setMessage({ type: 'error', text: 'O nome do novo usuário não pode estar vazio.' });
      return;
    }
    if (!newUserPassword || newUserPassword.length < 3) {
      setMessage({ type: 'error', text: 'A senha do novo usuário deve ter pelo menos 3 caracteres.' });
      return;
    }
    const existingUsernames = simpleUserCredentials.map(u => u.username.toLowerCase());
    if (existingUsernames.includes(newUserName.trim().toLowerCase()) || newUserName.trim().toLowerCase() === 'admin') {
      setMessage({ type: 'error', text: `Usuário "${newUserName.trim()}" já existe.` });
      return;
    }

    const newUser: SimpleUserCredentials = { username: newUserName.trim(), passwordPlainText: newUserPassword };
    const updatedCredentials = [...simpleUserCredentials, newUser];
    localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
    setSimpleUserCredentials(updatedCredentials); // Update internal state for UI

    const usernamesListFromStorage: string[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_KEY) || '[]');
    const updatedUsernamesList = [...usernamesListFromStorage, newUser.username];
    localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_KEY, JSON.stringify(updatedUsernamesList));

    setEditingPasswords(prev => ({ ...prev, [newUser.username]: newUser.passwordPlainText }));
    setShowPasswords(prev => ({ ...prev, [newUser.username]: false }));
    
    setMessage({ type: 'success', text: `Usuário "${newUser.username}" criado com sucesso.` });
    setNewUserName('');
    setNewUserPassword('');
    onUserListChange(); // Notify App.tsx to refresh its list
  };

  const deleteUser = (usernameToDelete: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${usernameToDelete}"? Todos os seus dados (quizzes, simulações, senha) serão perdidos permanentemente.`)) {
      return;
    }
    setMessage(null);

    // Remove from credentials state and localStorage
    const updatedCredentials = simpleUserCredentials.filter(cred => cred.username !== usernameToDelete);
    localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
    setSimpleUserCredentials(updatedCredentials); // Update internal state for UI

    // Remove from simple usernames list in localStorage
    const usernamesListFromStorage: string[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SIMPLE_USERS_KEY) || '[]');
    const updatedUsernamesList = usernamesListFromStorage.filter(name => name !== usernameToDelete);
    localStorage.setItem(LOCAL_STORAGE_SIMPLE_USERS_KEY, JSON.stringify(updatedUsernamesList));

    // Remove from editing states
    const newEditingPasswords = { ...editingPasswords }; delete newEditingPasswords[usernameToDelete]; setEditingPasswords(newEditingPasswords);
    const newShowPasswords = { ...showPasswords }; delete newShowPasswords[usernameToDelete]; setShowPasswords(newShowPasswords);

    // Delete associated data
    const currentQuizAttempts: QuizAttemptRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY) || '[]');
    localStorage.setItem(LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY, JSON.stringify(currentQuizAttempts.filter(qa => qa.userId !== usernameToDelete)));
    
    const currentSimRecords: SimulationRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SIMULATION_RECORDS_KEY) || '[]');
    localStorage.setItem(LOCAL_STORAGE_SIMULATION_RECORDS_KEY, JSON.stringify(currentSimRecords.filter(sr => sr.userId !== usernameToDelete)));

    localStorage.removeItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${usernameToDelete}`);
    
    setMessage({ type: 'success', text: `Usuário "${usernameToDelete}" e seus dados foram excluídos.` });
    onUserListChange(); // Notify App.tsx to refresh its list
  };


  return (
    <section id="user-management-panel" className="py-8">
      <h1 className="section-title">Gerenciamento de Usuários</h1>

      {message && (
        <GlassCard className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-[rgba(var(--success-rgb),0.15)] text-[var(--success)] border-[rgba(var(--success-rgb),0.3)]' : 'bg-[rgba(var(--error-rgb),0.15)] text-[var(--error)] border-[rgba(var(--error-rgb),0.3)]'}`}>
          {message.text}
        </GlassCard>
      )}

      <GlassCard className="mb-8 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Criar Novo Usuário Simplificado</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="new-username" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Nome do Novo Usuário:</label>
            <input
              type="text"
              id="new-username"
              value={newUserName}
              onChange={(e) => { setNewUserName(e.target.value); setMessage(null); }}
              className="themed-input w-full"
              placeholder="Ex: NovoConsultor"
            />
          </div>
          <div>
            <label htmlFor="new-user-password" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Senha do Novo Usuário:</label>
            <div className="relative">
              <input
                type={showNewUserPassword ? "text" : "password"}
                id="new-user-password"
                value={newUserPassword}
                onChange={(e) => { setNewUserPassword(e.target.value); setMessage(null); }}
                className="themed-input w-full pr-10" 
                placeholder="Mínimo 3 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--color-text-light)] hover:text-[var(--color-primary)]"
                aria-label={showNewUserPassword ? "Esconder senha" : "Mostrar senha"}
              >
                <i className={`fas ${showNewUserPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          <GlassButton onClick={handleCreateNewUser} className="themed-button">
            <i className="fas fa-plus mr-2"></i>Criar Novo Usuário
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Lista de Usuários</h2>
        <div className="space-y-6">
          {/* Admin User */}
          <div>
            <h3 className="text-md font-medium text-[var(--color-text)]">admin</h3>
            <p className="text-sm text-[var(--color-text-light)] italic mt-1">Senha do administrador não pode ser alterada por este painel.</p>
          </div>

          {/* Simple Users */}
          {simpleUserCredentials.map(user => (
            <div key={user.username} className="p-3 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)]">
              <h3 className="text-md font-medium text-[var(--color-text)] mb-2">{user.username}</h3>
              <div className="mb-3">
                <label htmlFor={`password-${user.username}`} className="block text-xs font-medium text-[var(--color-text-light)] mb-1">Senha:</label>
                <div className="flex items-center">
                  <div className="relative flex-grow">
                    <input
                      type={showPasswords[user.username] ? "text" : "password"}
                      id={`password-${user.username}`}
                      value={editingPasswords[user.username] || ''}
                      onChange={(e) => handlePasswordChange(user.username, e.target.value)}
                      className="themed-input w-full pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword(user.username)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--color-text-light)] hover:text-[var(--color-primary)]"
                      aria-label={showPasswords[user.username] ? "Esconder senha" : "Mostrar senha"}
                    >
                      <i className={`fas ${showPasswords[user.username] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <GlassButton onClick={() => savePassword(user.username)} className="themed-button !text-xs !py-2 ml-2">
                    <i className="fas fa-save mr-1"></i>Salvar Senha
                  </GlassButton>
                </div>
              </div>
              <GlassButton 
                onClick={() => deleteUser(user.username)} 
                className="!text-xs !py-1.5 !px-3 !bg-[rgba(var(--error-rgb),0.1)] !text-[var(--error)] hover:!bg-[rgba(var(--error-rgb),0.2)] !border-transparent"
              >
                <i className="fas fa-trash-alt mr-1"></i>Excluir Usuário
              </GlassButton>
            </div>
          ))}
          {simpleUserCredentials.length === 0 && (
            <p className="text-sm text-[var(--color-text-light)] italic">Nenhum usuário simplificado cadastrado.</p>
          )}
        </div>
      </GlassCard>
    </section>
  );
};

export default UserManagementPanel;

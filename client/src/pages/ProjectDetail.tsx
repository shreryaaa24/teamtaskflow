import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, UserPlus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
  assignedTo: { id: string, name: string } | null;
}

interface Member {
  id: string;
  role: string;
  user: { id: string, name: string, email: string };
}

interface Project {
  id: string;
  name: string;
  description: string;
  members: Member[];
  tasks: Task[];
}

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // New Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState('');

  // New Member state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');

  const fetchProject = async () => {
    try {
      const res = await axios.get(`/api/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', {
        title: taskTitle,
        description: taskDesc,
        dueDate: taskDueDate,
        priority: taskPriority,
        assignedToId: taskAssignee || null,
        projectId: id
      });
      setShowTaskModal(false);
      setTaskTitle(''); setTaskDesc(''); setTaskDueDate(''); setTaskAssignee('');
      fetchProject();
    } catch (err) {
      console.error(err);
      alert('Error creating task');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/projects/${id}/members`, {
        email: memberEmail,
        role: memberRole
      });
      setShowMemberModal(false);
      setMemberEmail('');
      fetchProject();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error adding member');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
      fetchProject();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error updating task status');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      fetchProject();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error deleting task');
    }
  };

  const removeMember = async (memberUserId: string) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await axios.delete(`/api/projects/${id}/members/${memberUserId}`);
      fetchProject();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error removing member');
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!project) return <div className="text-center mt-20 text-gray-500">Project not found</div>;

  const currentMember = project.members.find(m => m.user.id === user?.id);
  const isAdmin = currentMember?.role === 'ADMIN';

  const statuses = ['TODO', 'IN_PROGRESS', 'DONE'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">{project.description}</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="flex -space-x-2 mr-4">
            {project.members.slice(0, 3).map((m, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700" title={`${m.user.name} (${m.role})`}>
                {m.user.name.charAt(0)}
              </div>
            ))}
            {project.members.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
                +{project.members.length - 3}
              </div>
            )}
          </div>
          {isAdmin && (
            <button onClick={() => setShowMemberModal(true)} className="text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center">
              <UserPlus size={16} className="mr-1" /> Add Member
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowTaskModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center shadow-sm">
              <Plus size={16} className="mr-1" /> Add Task
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 overflow-x-auto pb-4">
        {statuses.map(status => (
          <div key={status} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-[500px]">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <span className={`w-2.5 h-2.5 rounded-full mr-2 ${status === 'TODO' ? 'bg-gray-400' : status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                {status.replace('_', ' ')}
              </span>
              <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full">{project.tasks.filter(t => t.status === status).length}</span>
            </h3>
            
            <div className="space-y-3">
              {project.tasks.filter(t => t.status === status).map(task => (
                <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                    {isAdmin && (
                      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  {task.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{task.description}</p>}
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <div className="flex flex-col space-y-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm w-max ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center text-xs text-gray-500 font-medium">
                          <Calendar size={12} className="mr-1" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700" title={task.assignedTo?.name || 'Unassigned'}>
                        {task.assignedTo ? task.assignedTo.name.charAt(0) : '?'}
                      </div>
                      
                      {/* Status Dropdown */}
                      { (isAdmin || task.assignedTo?.id === user?.id) && (
                        <select 
                          className="text-xs bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-gray-600 focus:outline-none"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {project.tasks.filter(t => t.status === status).length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                  No tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals here (omitted for brevity, assume similar simple structure to ProjectList modal) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500" rows={2} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {project.members.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                <input type="email" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowMemberModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium">Add Member</button>
              </div>
            </form>
            
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Current Members</h3>
              <div className="space-y-2">
                {project.members.map(m => (
                  <div key={m.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.user.name} <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{m.role}</span></p>
                      <p className="text-xs text-gray-500">{m.user.email}</p>
                    </div>
                    {m.user.id !== user?.id && (
                      <button onClick={() => removeMember(m.user.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

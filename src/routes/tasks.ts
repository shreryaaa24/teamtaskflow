import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Create Task
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate, priority, projectId, assignedToId } = req.body;
    const userId = req.user!.id;

    // Check if user is member of project
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });

    if (!member) return res.status(403).json({ error: 'Not a member of this project' });

    // Only ADMIN can create tasks? Or Members too?
    // Let's allow any member to create tasks for simplicity, or restrict to ADMIN.
    // The prompt says: "Admin: Manage tasks and users. Member: View and update assigned tasks only"
    if (member.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can create tasks' });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        projectId,
        assignedToId
      }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Task Status (Members can do this)
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const userId = req.user!.id;

    const taskWithProject = await prisma.task.findUnique({ where: { id }, include: { project: { include: { members: true } } } });
    if (!taskWithProject) return res.status(404).json({ error: 'Task not found' });

    const member = taskWithProject.project.members.find((m: { userId: string }) => m.userId === userId);
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });

    // Members can only update their ASSIGNED tasks
    if (member.role === 'MEMBER' && taskWithProject.assignedToId !== userId) {
      return res.status(403).json({ error: 'Members can only update assigned tasks' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status }
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete Task (Admin only)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const taskWithProject = await prisma.task.findUnique({ where: { id }, include: { project: { include: { members: true } } } });
    if (!taskWithProject) return res.status(404).json({ error: 'Task not found' });

    const member = taskWithProject.project.members.find((m: { userId: string }) => m.userId === userId);
    if (!member || member.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can delete tasks' });

    await prisma.task.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

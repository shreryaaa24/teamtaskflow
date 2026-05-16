import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get projects the user is part of
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      select: { id: true }
    });
    const projectIds = projects.map(p => p.id);

    // If no projects, return empty stats
    if (projectIds.length === 0) {
      return res.json({
        totalTasks: 0,
        tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        tasksPerUser: [],
        overdueTasks: 0
      });
    }

    // Get all tasks in these projects
    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: { assignedTo: { select: { name: true } } }
    });

    const totalTasks = tasks.length;
    const tasksByStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      DONE: tasks.filter(t => t.status === 'DONE').length,
    };

    const tasksPerUserMap: Record<string, number> = {};
    tasks.forEach(t => {
      const name = t.assignedTo?.name || 'Unassigned';
      tasksPerUserMap[name] = (tasksPerUserMap[name] || 0) + 1;
    });
    
    const tasksPerUser = Object.entries(tasksPerUserMap).map(([name, count]) => ({ name, count }));

    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length;

    res.json({
      totalTasks,
      tasksByStatus,
      tasksPerUser,
      overdueTasks
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Create Project
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.id;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN' // Creator is automatically ADMIN
          }
        }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get User's Projects
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: true
      }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Project by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: { include: { assignedTo: { select: { id: true, name: true } } } }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check if user is a member
    const isMember = project.members.some(m => m.userId === userId);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add member to project
router.post('/:id/members', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const userId = req.user!.id;

    // Verify current user is ADMIN
    const currentMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } }
    });

    if (!currentMember || currentMember.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User to add not found' });

    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        role: role || 'MEMBER'
      }
    });

    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member
router.delete('/:id/members/:memberId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;

    const currentMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } }
    });

    if (!currentMember || currentMember.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId: memberId } }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

const EvaluationQuestion = require('../models/EvaluationQuestion');
const AuditLog = require('../models/AuditLog');

/**
 * GET /api/evaluation-questions/manage
 * Get all questions (active and inactive) for admin management
 */
const getAllForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const questions = await EvaluationQuestion.findAll();
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Error fetching questions for admin:', error);
    res.status(500).json({ message: 'Server error fetching questions.' });
  }
};

/**
 * POST /api/evaluation-questions
 * Add a new question (admin only)
 */
const create = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { category, question_type, category_description, question, sort_order, is_active } = req.body;

    if (!category || !question_type || !question) {
      return res.status(400).json({ message: 'Category, question_type, and question text are required.' });
    }

    if (!['rating', 'text'].includes(question_type)) {
      return res.status(400).json({ message: 'question_type must be rating or text.' });
    }

    const result = await EvaluationQuestion.create({
      category,
      question_type,
      category_description,
      question,
      sort_order: sort_order !== undefined ? Number(sort_order) : 0,
      is_active: is_active !== undefined ? is_active : 1,
    });

    await AuditLog.log({
      actor_role: req.user.role,
      actor_id: req.user.id,
      action: 'QUESTION_CREATE',
      target: `question:${result.insertId}`,
      details: { category, question_type, question },
      ip_address: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully.',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Server error creating question.' });
  }
};

/**
 * PUT /api/evaluation-questions/:id
 * Edit question metadata or deactivate
 * Crucial rule: If the question already has responses, its text/meaning cannot be edited (must deactivate instead).
 */
const update = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;
    const { category, question_type, category_description, question, sort_order, is_active } = req.body;

    const existing = await EvaluationQuestion.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    const responseCount = await EvaluationQuestion.countResponses(id);

    // If responses exist, disallow modifying the question text, type, or category
    if (responseCount > 0) {
      const textChanged = question !== undefined && question.trim() !== existing.question.trim();
      const typeChanged = question_type !== undefined && question_type !== existing.question_type;
      const categoryChanged = category !== undefined && category !== existing.category;

      if (textChanged || typeChanged || categoryChanged) {
        return res.status(400).json({
          message: `Cannot edit text or type of question #${id} because it already has ${responseCount} historical response(s). Deactivate it and create a new question instead.`,
        });
      }
    }

    await EvaluationQuestion.update(id, {
      category,
      question_type,
      category_description,
      question,
      sort_order,
      is_active,
    });

    await AuditLog.log({
      actor_role: req.user.role,
      actor_id: req.user.id,
      action: 'QUESTION_UPDATE',
      target: `question:${id}`,
      details: {
        category,
        question_type,
        is_active,
        sort_order,
      },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Question updated successfully.' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Server error updating question.' });
  }
};

/**
 * PUT /api/evaluation-questions/:id/deactivate
 * Soft-deactivate a question (admin only)
 */
const deactivate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { id } = req.params;
    const existing = await EvaluationQuestion.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    await EvaluationQuestion.deactivate(id);

    await AuditLog.log({
      actor_role: req.user.role,
      actor_id: req.user.id,
      action: 'QUESTION_DEACTIVATE',
      target: `question:${id}`,
      details: { question: existing.question },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Question deactivated successfully.' });
  } catch (error) {
    console.error('Error deactivating question:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * PUT /api/evaluation-questions/reorder
 * Reorder questions (admin only)
 * Body: { orders: [{ id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }] }
 */
const reorder = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { orders } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: 'orders must be a non-empty array of { id, sort_order }' });
    }

    await EvaluationQuestion.reorder(orders);

    await AuditLog.log({
      actor_role: req.user.role,
      actor_id: req.user.id,
      action: 'QUESTION_REORDER',
      target: 'evaluation_questions',
      details: { count: orders.length },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Questions reordered successfully.' });
  } catch (error) {
    console.error('Error reordering questions:', error);
    res.status(500).json({ message: 'Server error reordering questions.' });
  }
};

module.exports = {
  getAllForAdmin,
  create,
  update,
  deactivate,
  reorder,
};

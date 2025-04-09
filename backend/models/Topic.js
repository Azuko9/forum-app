// backend/routes/topic.js
const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const authenticateToken = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

/**
 * [POST] Créer un nouveau sujet (protégé)
 */
router.post(
    '/',
    authenticateToken,
    [
        body('title').trim().notEmpty().withMessage('Le titre est requis'),
        body('content').trim().notEmpty().withMessage('Le contenu est requis'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, content } = req.body;
            const topic = new Topic({
                title,
                content,
                createdBy: req.user.id,
            });
            await topic.save();
            res.status(201).json({ message: 'Sujet créé avec succès', topic });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * [GET] Récupérer la liste des sujets avec pagination et tri (public)
 * Les paramètres query possibles : page, limit, sort
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || '-createdAt';
        const total = await Topic.countDocuments();
        const topics = await Topic.find()
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('createdBy', 'username');
        res.status(200).json({
            topics,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * [PUT] Mettre à jour un sujet existant (seul le créateur peut le modifier)
 * URL: /api/topics/:id
 */
router.put(
    '/:id',
    authenticateToken,
    [
        body('title').optional().trim().notEmpty().withMessage('Le titre ne peut pas être vide'),
        body('content').optional().trim().notEmpty().withMessage('Le contenu ne peut pas être vide'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const topic = await Topic.findById(req.params.id);
            if (!topic) return res.status(404).json({ message: 'Sujet non trouvé' });

            // Vérification: seul le créateur peut modifier le sujet
            if (topic.createdBy.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Non autorisé à modifier ce sujet' });
            }

            // Met à jour les champs fournis
            if (req.body.title) topic.title = req.body.title;
            if (req.body.content) topic.content = req.body.content;

            await topic.save();
            res.status(200).json({ message: 'Sujet mis à jour', topic });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * [DELETE] Supprimer un sujet (seul le créateur peut le supprimer)
 * URL: /api/topics/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Sujet non trouvé' });

        // Vérification de l'autorisation
        if (topic.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé à supprimer ce sujet' });
        }

        await topic.remove();
        res.status(200).json({ message: 'Sujet supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

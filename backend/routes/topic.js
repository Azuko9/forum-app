// backend/routes/topic.js
const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const authenticateToken = require('../middleware/authMiddleware');
const permit = require('../middleware/permit');
const { body, validationResult } = require('express-validator');

// Création d'un sujet (accessible aux utilisateurs authentifiés)
router.post(
    '/',
    authenticateToken,
    [
        body('title').trim().notEmpty().withMessage('Le titre est requis'),
        body('content').trim().notEmpty().withMessage('Le contenu est requis'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

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
 * Mise à jour d'un sujet.
 * Seul le créateur du sujet ou un administrateur peut modifier un sujet.
 */
router.put(
    '/:id',
    authenticateToken,
    // Aucun middleware permit ici n'est suffisant car on doit autoriser :
    // - l'utilisateur qui a créé le sujet
    // - ou l'admin (indépendamment d'être le créateur)
    async (req, res) => {
        const { id } = req.params;
        try {
            const topic = await Topic.findById(id);
            if (!topic) return res.status(404).json({ message: 'Sujet non trouvé' });

            // Vérification : si ce n'est pas l'auteur et l'utilisateur n'est pas admin, refuser
            if (topic.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ message: "Non autorisé à modifier ce sujet" });
            }

            // Mettre à jour les champs envoyés
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
 * Suppression d'un sujet.
 * Seul le créateur ou un administrateur peut supprimer un sujet.
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Sujet non trouvé' });

        // Vérifier l'autorisation
        if (topic.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Non autorisé à supprimer ce sujet" });
        }

        await topic.remove();
        res.status(200).json({ message: 'Sujet supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Obtenir la liste des sujets (avec pagination et tri)
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
        res.status(200).json({ topics, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// backend/routes/comment.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const authenticateToken = require('../middleware/authMiddleware');

// Pour la validation
const { body, validationResult } = require('express-validator');

/**
 * [POST] Créer un commentaire sur un sujet
 * L'utilisateur authentifié doit fournir le contenu du commentaire et l'ID du sujet (topic)
 */
router.post(
    '/',
    authenticateToken,
    [
        body('content')
            .trim()
            .notEmpty().withMessage('Le contenu est requis'),
        body('topic')
            .trim()
            .notEmpty().withMessage('L\'ID du sujet est requis'),
    ],
    async (req, res) => {
        // Vérifier la présence d'erreurs de validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { content, topic } = req.body;
            const comment = new Comment({
                content,
                topic,
                createdBy: req.user.id,
            });
            await comment.save();
            res.status(201).json({ message: 'Commentaire créé avec succès', comment });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * [GET] Récupérer tous les commentaires pour un sujet donné
 * On peut fournir l'ID du sujet en query string, par exemple /api/comments?topic=<topicId>
 */
router.get('/', async (req, res) => {
    try {
        const { topic } = req.query;
        if (!topic) {
            return res.status(400).json({ message: 'L\'ID du sujet est requis en query param "topic"' });
        }
        const comments = await Comment.find({ topic })
            .populate('createdBy', 'username')
            .sort('-createdAt');
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

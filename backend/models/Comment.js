// backend/models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
        // Référence à l'utilisateur qui a écrit le commentaire
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Référence au sujet auquel se rattache le commentaire
        topic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);

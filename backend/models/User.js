const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    // Nouveau champ pour le rôle
    role: {
        type: String,
        enum: ['user', 'admin'], // Tu peux ajouter d'autres rôles, comme 'moderator'
        default: 'user',
    },
}, { timestamps: true });

// Middleware pour hacher le mot de passe avant sauvegarde
UserSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next();
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(this.password, saltRounds);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Méthode pour comparer un mot de passe fourni avec le mot de passe stocké
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

// backend/middleware/permit.js

const permit = (...allowedRoles) => {
    return (req, res, next) => {
        // Vérifie que req.user est défini (celle-ci doit être définie par le middleware d'authentification)
        if (!req.user) {
            return res.status(401).json({ message: "Non authentifié" });
        }

        // Si le rôle de l'utilisateur n'est pas dans la liste des rôles autorisés, l'accès est refusé
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Accès interdit : privilèges insuffisants" });
        }

        // Autorise l'accès
        next();
    };
};

module.exports = permit;

// Point d'accès unique aux modèles Mongoose (source de vérité du modèle de données).
module.exports = {
  User: require('./User'),
  Project: require('./Project'),
  Sprint: require('./Sprint'),
  Task: require('./Task'),
  Leave: require('./Leave'),
  Role: require('./Role'),
  Notification: require('./Notification'),
};

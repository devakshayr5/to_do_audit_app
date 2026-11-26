// currentUser.js - reads WHO is making the request.
// The React app sends the name in an "X-User" header.
// NOTE: this is a simple identity for the assignment, not real authentication.
// In a real app you would take the user from a login token (JWT / session).
module.exports = function currentUser(req, res, next) {
  const name = (req.header('X-User') || '').trim().slice(0, 100);
  req.user = name || 'anonymous';
  next();
};

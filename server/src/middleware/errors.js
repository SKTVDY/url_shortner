export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'That page could not be found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'That email or short link is already in use.' });
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
  if (error.name === 'CastError') return res.status(404).json({ success: false, message: 'Resource not found.' });
  console.error(error);
  return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
}

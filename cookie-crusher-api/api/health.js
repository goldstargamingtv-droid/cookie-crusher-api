// Health check endpoint
module.exports = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    product: 'Cookie Crusher API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};

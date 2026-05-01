require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  const user = await User.findOne({ studentCode: 'EVC-B3D8439D' });
  console.log('cardUrl:', user.cardUrl);
  
  const Certificate = require('./models/Certificate');
  const cert = await Certificate.findOne({ userId: user._id }).sort({ issuedAt: -1 });
  console.log('pdfUrl:', cert.pdfUrl);
  
  process.exit();
});
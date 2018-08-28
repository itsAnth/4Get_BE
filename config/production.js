require('dotenv').config();
module.exports = {
	// enabled logging for development
	logging: false,
	db: {
		url: process.env.MONGODB_URI || 'mongodb://localhost:27017/4getprod'
	},
};
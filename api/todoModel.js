var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validator = require('validator');
var logger = require('../util/logger');

var TodoSchema = new Schema({
	uniqueid: {
		type:String,
		required: true,
		unique: true
	},
	dateCreated: {
        type: Date,
        default: Date.now
	},
	expiresAt: {
        type: Date
	},
	title: {
		type: String,
		required: true
	},
	tasks: [
		{
			description: {
					type: String,
					required: true
			},				
			completed: {
                    type:Boolean,
                    default: false,
					required: true
			}
		}
	]
});

TodoSchema.methods = {
	// convert the mongo document to an normal js obj
	toJson: function() {
		var obj = this.toObject();
		return obj;
	}
};

// From mongoose documentation: The first argument is
// the singular name of the collection your model is for.
// Mongoose automatically looks for the plural version of
// your model name. Thus, for the example above, the model
// Tank is for the tanks collection in the database.
// The .model() function makes a copy of schema. Make sure
// that you've added everything you want to schema before
// calling .model()!

module.exports = mongoose.model('todo', TodoSchema);

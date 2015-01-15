module.exports = function (mongoose) {
	var Schema = mongoose.Schema;
	var UserSchema = new Schema({
		name : String,
		email : String,
		password : String,
		nickname : String,
		friends : Schema.Types.Mixed,
		photo: String
		
	});

	return mongoose.model('User', UserSchema);
}

userscontroller = function  (server, formidable, bcrypt,fs, path) {
	
	server.post('/user/new', function  (req, res) {

		var form = new formidable.IncomingForm();
		form.parse(req, function  (err, fields, files) {
			var email = fields.email;
			var name = fields.name;
			var username = fields.username;
			var password = fields.password;
			var salt = bcrypt.genSaltSync(10);
			var hash = bcrypt.hashSync(password, salt);

			var user = new db.User({
				name : name,
				email : email,
				password : hash,
				username : username,
				friends : null,
				photo: null
			});
			

			user.save(function(error, newuser) {
			  
			  	if (error) return res.json(error);
				
			  	req.session.user = newuser;
			  	
			  	fs.mkdir(path.join(process.env.PWD,'/uploads/' ,newuser.username));

			  	return res.redirect('/welcome');
			
			});
		});

		

	});

	server.get('/welcome', function  (req, res) {

		return res.render('welcome', {user: req.session.user});
	});

	server.post('/user/login', function (req, res) {
		var form = new formidable.IncomingForm();
		form.parse(req, function  (err, fields, files) {
			
			var email = fields.email;
			var password = fields.password;
			db.User.findOne({email: email}, function(error, user) {
			  if (user)
			  {

			  	if(bcrypt.compareSync(password, user.password))
			  	{
			  		req.session.user = user;	
			  		return res.redirect('/home');	
			  	}
			  	
			  } 
			  else
			  {
			  	req.session.error = true;
			  	return res.redirect('/')
			  } 
			  
		});
		  
		});
		
	});
	server.post('/upload-photo', function (req, res){
		var file_route;
		var form = new formidable.IncomingForm();
	   form.parse(req, function (err, fields, files) {
	   		var old_path = files.file.path,
	           	file_size = files.file.size,
	           	file_ext = files.file.name.split('.').pop(),
	           	index = old_path.lastIndexOf('/') + 1,
	           	file_name = old_path.substr(index),
	           	new_path = path.join(process.env.PWD, '/public/uploads/', req.session.user.username ,file_name + '.' + file_ext);
	           	
	           	file_route = 'uploads/' + req.session.user.username + '/' + file_name + '.' + file_ext; 
	        fs.readFile(old_path, function(err, data) {
	                    fs.writeFile(new_path, data, function(err) {
	                        fs.unlink(old_path, function(err) {
	                            if (err) {
	                                res.status(500);
	                                res.json({'success': false});
	                            } else {
	                                res.status(200);
	                                res.json({'success': true});
	                    
	                                db.User.findById(req.session.user._id, function (err, user) {
	                                	if (err) throw(err);
	                                	if (!err && user != null )
	                                	{
	                                		user.photo = file_route;	
	                                		user.save();
	                                		return true;
	                                	}
	                                	
	                                })
	                            }
	                        });
	                    });
	                });
	   		   });
		});

	server.io.route('check-user', function  (req) {
		
		var email = (req.data.email !== '')?req.data.email.trim():'default';
		var username = (req.data.username !== '')?req.data.username.trim():'default';
		
		if (username && email)
		{

			db.User.findOne({username: username}, function (err, user) {
				if (user)
				{
					db.User.findOne({email: email}, function (err, user) {
						if (user)
						{
							
							return req.io.emit('user-exist', {email: 'Este email ya esta registrado',username: 'Este username ya pertenece a un usuario'});
						}
						
						return req.io.emit('user-exist', {username: 'Este username ya esta registrado'});

					});	
				}
				else
				{
					db.User.findOne({email: email}, function (err, user){
						if (user)
						{
						
							return req.io.emit('user-exist', {email: 'Este email ya esta registrado'})
						}
						
						return req.io.emit('user-exist');
					
					});	
				}
				
			});
		}
	});


}

module.exports = userscontroller;



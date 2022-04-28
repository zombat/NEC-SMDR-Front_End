const	path = require(`path`)
		require(`dotenv`).config({ path: path.resolve(__dirname, `./.env`) });
		url = process.env.SITE_URL;
const	helperFunctions = require(`./helper-functions`),
		assert = require(`assert`),
		express = require(`express`),
		router = express.Router(),
		ensureLoggedIn = require(`connect-ensure-login`).ensureLoggedIn(),
		mongoClient = require(`./mongoClient`),
		Account = require(`./models/account`),
		noPermissions = {
			'sysadmin': false
		};
		
		
router.get(`/authenticated-users/js/:id`, helperFunctions.logAccess, ensureLoggedIn, (req, res) => {
	const requestIP = req.headers[`x-forwarded-for`] || req.connection.remoteAddress;
		if(req.hasOwnProperty(`user`)){
			const userID = req.user[`_id`] || 0;
			helperFunctions.getUserPermissions(userID, function(response){
				if(response!=null){
					if(response.sysadmin){
						res.sendFile( `/private/authenticated-users/js/` + req.params.id, { root: `./` });
					} 
				}
			});		
		} 
});

router.get(`/login`, (req, res) => {
	if(req.hasOwnProperty(`user`)){
		res.redirect(`/`);
	} else {
		res.render(`login`, { user: req.user, userPermissions: noPermissions });
	}
});
		
		
router.get(`/logout`, (req, res) => {
	req.logout();
	res.status(401);
	res.redirect(`/`);
});

router.get(`/legal`, function(req, res) {
	if(req.hasOwnProperty(`user`)){
		let userID = req.user[`_id`] || 0;
		helperFunctions.getUserPermissions(userID, function(response){
			if(response!=null){
				res.render(`legal`, { user: userID, userPermissions: response });
			} else {
				res.render(`legal`, { user: userID, userPermissions: noPermissions});
			}
		});		
	} else {
		res.render(`legal`, { user: req.user, sysadmin: false });
	}
});

router.get(`/`, (req, res) => {
	if(req.hasOwnProperty(`user`)){
		const userID = req.user[`_id`] || 0;
		helperFunctions.getUserPermissions(userID, function(response){
			if(response!=null){
				if(response.sysadmin){
					res.render(`home`, { user: req.user || null, userPermissions: response });
				} else {
					res.render(`home`, { user: req.user || null, userPermissions: noPermissions });
				}
			}
		});		
	} else {
		res.render(`home`, { user: null, userPermissions: noPermissions });
	}
	
});
	
router.get(`/user-settings`, (req, res) => {
	if(req.hasOwnProperty(`user`)){
		const userID = req.user[`_id`] || 0;
		helperFunctions.getUserPermissions(userID, (response) => {
			if(response!=null){
				res.render(`user-settings`, { user: userID, userPermissions: response});
			} else {
				res.render(`user-settings`, { user: userID, userPermissions: noPermissions});
			}
		});		
	} else {
		res.render(`user-settings`, { user: req.user, userPermissions: noPermissions});
	}
});

router.post(`/user-settings/api`, helperFunctions.logAccess, ensureLoggedIn, (req, res)  => {
	const requestIP = req.headers[`x-forwarded-for`] || req.connection.remoteAddress;
	if(req.hasOwnProperty(`user`)){
		const userID = req.user[`_id`] || 0;
		helperFunctions.getUserPermissions(userID, (response) => {
			if(response!=null){
				if(req.body.getOrSet.match(/get/i)){
					mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`accounts`).findOne({ '_id': userID},{ 'projection' : { '_id' : 0, 'lastname' : 1, 'firstname': 1, 'username': 1, 'phonenumber': 1, 'company': 1, 'address': 1  } },(err, document) => {
						assert.equal(null, err);
						res.json(document);
					});
				} else if(req.body.getOrSet.match(/set-password/i)){
					Account.findOne({ '_id': req.user[`_id`] }, (err, user) =>{
					  // Check if error connecting
					  if (err) {
						res.json({ success: false, message: err }); // Return error
					  } else {
						// Check if user was found in database
						if (!user) {
							res.status(401);
							res.json({ success: false, message: `User not found` }); // Return error, user was not found in db
						} else {
						  user.changePassword(req.body.data.oldPassword, req.body.data.newPassword, (err) => {
							 if(err) {
									  if(err.name === `IncorrectPasswordError`){
										  res.status(401);
										  res.json({ success: false, message: `Incorrect password` }); // Return error
									  }else {
										  res.status(500);
										  res.json({ success: false, message: `This is embarrasing...` });
									  }
							} else {
							  res.json({ success: true, message: `Password changed.` });
							 }
						   })
						}
					  }
					});  
				}					
			} else {
				helperFunctions.logUnauthorizedAttempts(req.user[`_id`], requestIP, `/api/user-settings`, (response) => {
					res.status(401);
					res.json({'error': 'Unauthorized Access'});
				});
			}
		});		
	} else {
		helperFunctions.logUnauthorizedAttempts(`logged-out-user`, requestIP, `/api/user-settings`, (response) => {	
			res.status(401);
			res.json({'error': 'Unauthorized Access'});
		});
	}
});

module.exports = router;